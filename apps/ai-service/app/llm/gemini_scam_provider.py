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
from typing import Any

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover
    genai = None  # type: ignore[assignment]
    types = None  # type: ignore[assignment]

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

    def __init__(self, api_key: str, model: str = "gemini-flash-latest") -> None:
        if not api_key:
            raise ScamLLMError("GEMINI_API_KEY is not set; cannot construct GeminiScamLLM")
        self._api_key = api_key
        self._model = model
        self._client: Any = None  # lazy-init so import of this module never requires network/creds

    def _get_client(self) -> Any:
        if self._client is None:
            if genai is not None:
                self._client = genai.Client(api_key=self._api_key)
            else:
                try:
                    from google import genai as _genai
                    self._client = _genai.Client(api_key=self._api_key)
                except ImportError as exc:
                    raise ScamLLMError("google-genai SDK is not installed") from exc
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
        client = self._get_client()

        lang_note = (
            "Write flag messages in Bangla (Bengali)."
            if language == "bn"
            else "Write flag messages in English."
        )

        config_kwargs: dict[str, Any] = {
            "system_instruction": _SYSTEM_INSTRUCTION,
            "response_mime_type": "application/json",
            "response_schema": _RESPONSE_SCHEMA,
            "temperature": 0.1,
        }

        if types is not None:
            config = types.GenerateContentConfig(**config_kwargs)
        else:
            try:
                from google.genai import types as _types
                config = _types.GenerateContentConfig(**config_kwargs)
            except ImportError:
                config = config_kwargs  # type: ignore

        response = client.models.generate_content(
            model=self._model,
            contents=(
                f"{lang_note}\n\n--- BEGIN TEXT TO SCAN ---\n{text}\n--- END TEXT TO SCAN ---"
            ),
            config=config,
        )


        raw = response.text
        if not raw:
            raise ScamLLMError("Gemini returned an empty response")

        clean_raw = raw.strip()
        if clean_raw.startswith("```json"):
            clean_raw = clean_raw[7:]
        elif clean_raw.startswith("```"):
            clean_raw = clean_raw[3:]
        if clean_raw.endswith("```"):
            clean_raw = clean_raw[:-3]
        clean_raw = clean_raw.strip()

        try:
            payload = json.loads(clean_raw)
        except json.JSONDecodeError as exc:
            raise ScamLLMError(f"Gemini returned non-JSON output: {exc}") from exc

        flags_raw = payload.get("flags", []) if isinstance(payload, dict) else []
        flags: list[ScamFlag] = []
        for item in flags_raw:
            if not isinstance(item, dict):
                continue
            try:
                flags.append(
                    ScamFlag(
                        tag=item.get("tag", "Scam Indicator"),
                        category=ScamCategory(item.get("category", "other")),
                        severity=FlagSeverity(item.get("severity", "info")),
                        source=ScamFlagSource.LLM,
                        matched_text=item.get("matched_text", ""),
                        message_en=item.get("message_en", ""),
                    )
                )
            except (KeyError, ValueError) as exc:
                logger.warning("Skipping malformed scam flag from Gemini response: %s (%s)", item, exc)
                continue

        return flags
