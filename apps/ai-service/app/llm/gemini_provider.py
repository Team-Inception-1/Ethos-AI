"""
Gemini implementation of `AgreementLLM`.

Uses Google's `google-genai` SDK with structured JSON output (response_schema)
so we get back parseable clause data directly, without brittle prompt-only
JSON parsing.

The API key is read from `Settings.gemini_api_key` (env var `GEMINI_API_KEY`)
— never hardcoded, never logged.
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.schemas import ClauseType, ExtractedClause
from .base import AgreementLLM, LLMError

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are a contract-analysis assistant for Ethos AI, a platform that protects "
    "Bangladeshi students/parents from predatory study-abroad consultancy agreements. "
    "You will be given the full text of a consultancy service agreement. Extract every "
    "clause related to: fees, refunds, cancellation terms, and liability/indemnity. "
    "For each clause: quote the relevant text (verbatim or near-verbatim, trimmed to the "
    "essential sentence(s)), classify its type, extract any monetary amount mentioned "
    "(in Bangladeshi Taka, converted to poisha = taka * 100, as an integer; null if none), "
    "and write a one-line plain-English summary a non-lawyer can understand. "
    "Be thorough — agreements often bury fee clauses inside unrelated paragraphs. "
    "If the agreement text is empty, unreadable, or contains no relevant clauses, return an empty list."
)

# JSON schema Gemini must conform its output to.
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "clauses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "clause_type": {
                        "type": "string",
                        "enum": ["fee", "refund", "cancellation", "liability", "other"],
                    },
                    "quote": {"type": "string"},
                    # Gemini's schema format doesn't support JSON Schema's
                    # `"type": ["integer", "null"]` union syntax — nullability
                    # is expressed via a separate `nullable` flag alongside a
                    # single `type` instead.
                    "amount_poisha": {"type": "integer", "nullable": True},
                    "summary_en": {"type": "string"},
                },
                "required": ["clause_type", "quote", "summary_en"],
            },
        }
    },
    "required": ["clauses"],
}


class GeminiAgreementLLM(AgreementLLM):
    name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-flash-latest") -> None:
        if not api_key:
            raise LLMError("GEMINI_API_KEY is not set; cannot construct GeminiAgreementLLM")
        self._api_key = api_key
        self._model = model
        self._client = None  # lazy-init so import of this module never requires network/creds

    def _get_client(self):
        if self._client is None:
            from google import genai  # local import: keep SDK optional at module load time

            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def extract_clauses(self, agreement_text: str, *, language: str = "en") -> list[ExtractedClause]:
        if not agreement_text or not agreement_text.strip():
            return []

        try:
            return await asyncio.to_thread(self._extract_sync, agreement_text, language)
        except LLMError:
            raise
        except Exception as exc:  # pragma: no cover - defensive, SDK-specific errors vary
            logger.exception("Gemini clause extraction failed")
            raise LLMError(f"Gemini request failed: {exc}") from exc

    def _extract_sync(self, agreement_text: str, language: str) -> list[ExtractedClause]:
        from google.genai import types

        client = self._get_client()

        lang_note = (
            "Write summaries in Bangla (Bengali)."
            if language == "bn"
            else "Write summaries in English."
        )

        response = client.models.generate_content(
            model=self._model,
            contents=(
                f"{lang_note}\n\n--- BEGIN AGREEMENT TEXT ---\n{agreement_text}\n--- END AGREEMENT TEXT ---"
            ),
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.1,
            ),
        )

        raw = response.text
        if not raw:
            raise LLMError("Gemini returned an empty response")

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise LLMError(f"Gemini returned non-JSON output: {exc}") from exc

        clauses_raw = payload.get("clauses", [])
        clauses: list[ExtractedClause] = []
        for item in clauses_raw:
            try:
                clauses.append(
                    ExtractedClause(
                        clause_type=ClauseType(item.get("clause_type", "other")),
                        quote=item["quote"],
                        amount_poisha=item.get("amount_poisha"),
                        summary_en=item["summary_en"],
                    )
                )
            except (KeyError, ValueError) as exc:
                logger.warning("Skipping malformed clause from Gemini response: %s (%s)", item, exc)
                continue

        return clauses
