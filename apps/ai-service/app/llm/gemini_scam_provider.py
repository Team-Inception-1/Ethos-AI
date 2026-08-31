"""
Gemini implementation of `ScamLLM` (Module 5.10, Issue #23).

Same approach as `GeminiAgreementLLM` (#16): structured JSON output via
`response_schema`, so we never depend on brittle prompt-only JSON parsing.

The API key is read from `Settings.gemini_api_key` (env var `GEMINI_API_KEY`)
— the SAME key already used by the Agreement Analyzer; this service only
ever reads one Gemini key, never hardcodes one, never logs one.
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.schemas import FlagSeverity, ScamCategory, ScamFlag, ScamFlagSource
from .scam_base import ScamLLM, ScamLLMError

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are a trust & safety assistant for Ethos AI, a platform that protects "
    "Bangladeshi students/parents from predatory study-abroad consultancy agencies. "
    "You will be given a piece of marketing copy, a chat message, or agreement text. "
    "A cheap rule-based filter has ALREADY scanned this text for well-known predatory "
    "phrases (fake guarantees, urgency pressure, fabricated credentials, payment "
    "pressure) — your job is to catch ADDITIONAL predatory or scam-like claims that "
    "phrase-matching would miss: paraphrased guarantees, subtler manipulation, "
    "inconsistent/suspicious claims, or requests that bypass safe payment channels. "
    "Do not re-report obvious phrase matches a simple regex would already catch — focus "
    "on judgment calls that need language understanding. "
    "If the text contains nothing concerning, return an empty list — do not invent flags."
)

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "flags": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "tag": {"type": "string", "description": "Short label, e.g. 'Implied Guarantee'"},
                    "category": {
                        "type": "string",
                        "enum": [c.value for c in ScamCategory],
                    },
                    "severity": {
                        "type": "string",
                        "enum": [s.value for s in FlagSeverity],
                    },
                    "matched_text": {
                        "type": "string",
                        "description": "The exact phrase/sentence that triggered this flag",
                    },
                    "message_en": {"type": "string"},
                },
                "required": ["tag", "category", "severity", "matched_text", "message_en"],
            },
        }
    },
    "required": ["flags"],
}


class GeminiScamLLM(ScamLLM):
    name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-3.6-flash") -> None:
        if not api_key:
            raise ScamLLMError("GEMINI_API_KEY is not set; cannot construct GeminiScamLLM")
        self._api_key = api_key
        self._model = model
        self._client = None  # lazy-init so import of this module never requires network/creds

    def _get_client(self):
        if self._client is None:
            from google import genai  # local import: keep SDK optional at module load time

            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def classify(self, text: str, *, language: str = "en") -> list[ScamFlag]:
        if not text or not text.strip():
            return []

        try:
            return await asyncio.to_thread(self._classify_sync, text, language)
        except ScamLLMError:
            raise
        except Exception as exc:  # pragma: no cover - defensive, SDK-specific errors vary
            logger.exception("Gemini scam classification failed")
            raise ScamLLMError(f"Gemini request failed: {exc}") from exc

    def _classify_sync(self, text: str, language: str) -> list[ScamFlag]:
        from google.genai import types

        client = self._get_client()

        lang_note = (
            "Write flag messages in Bangla (Bengali)."
            if language == "bn"
            else "Write flag messages in English."
        )

        response = client.models.generate_content(
            model=self._model,
            contents=(
                f"{lang_note}\n\n--- BEGIN TEXT TO SCAN ---\n{text}\n--- END TEXT TO SCAN ---"
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
            raise ScamLLMError("Gemini returned an empty response")

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ScamLLMError(f"Gemini returned non-JSON output: {exc}") from exc

        flags_raw = payload.get("flags", [])
        flags: list[ScamFlag] = []
        for item in flags_raw:
            try:
                flags.append(
                    ScamFlag(
                        tag=item["tag"],
                        category=ScamCategory(item.get("category", "other")),
                        severity=FlagSeverity(item.get("severity", "info")),
                        source=ScamFlagSource.LLM,
                        matched_text=item["matched_text"],
                        message_en=item["message_en"],
                    )
                )
            except (KeyError, ValueError) as exc:
                logger.warning("Skipping malformed scam flag from Gemini response: %s (%s)", item, exc)
                continue

        return flags
