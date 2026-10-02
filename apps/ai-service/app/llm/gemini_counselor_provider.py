"""
Gemini implementation of `CounselorLLM`.

Uses Google's `google-genai` SDK with structured JSON output for conversational study-abroad
counseling for Bangladeshi students and parents, supporting both English and Bangla.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from app.schemas import CounselorChatMessage, CounselorEvaluationRequest
from .counselor_base import CounselorLLM, CounselorLLMError
from .fake_counselor_provider import is_bangla_text

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are an expert, unbiased study-abroad educational counselor for Ethos AI, "
    "a platform that protects Bangladeshi students and parents from fraudulent consultancies. "
    "You provide factual, realistic, empathetic guidance regarding university admissions, "
    "admission chance estimations, tuition fees in BDT and local currency, student visa criteria, "
    "bank solvency proof, and study gaps. "
    "Crucial ethics guidelines:\n"
    "1. Never promise '100% visa guarantees' or backchannel shortcuts — explain that only embassies issue visas.\n"
    "2. If a student mentions a study gap, advise genuine employment records; warn against submitting forged certificates.\n"
    "3. Keep advice practical for Bangladeshi currency (BDT Lakhs) and banking (student files, Bangladesh Bank rules).\n"
    "4. If the user speaks in Bangla (বাংলা) or asks for Bangla, reply in natural, supportive Bangla.\n"
    "5. Return 2-3 relevant follow-up questions to help the student continue their research."
)

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string", "description": "The counselor's detailed, helpful response"},
        "suggested_queries": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2-3 short follow-up questions relevant to the discussion",
        },
        "detected_language": {
            "type": "string",
            "enum": ["en", "bn"],
            "description": "The language of the reply ('en' or 'bn')",
        },
    },
    "required": ["reply", "suggested_queries", "detected_language"],
}

_SYSTEM_INSTRUCTION_GROUNDED = (
    _SYSTEM_INSTRUCTION + "\n\n"
    "GROUNDING RULES:\n"
    "You have access to Google Search. When answering questions about visa policies, tuition fees, "
    "admission deadlines, embassy procedures, or country-specific regulations, ALWAYS search for "
    "the latest information. Prioritize official sources: .gov, .edu, daad.de, canada.ca, gov.uk, "
    "uscis.gov, studyinaustralia.gov.au.\n"
    "After presenting factual information from search results, naturally mention the source."
)

_SOP_AUDIT_SYSTEM_INSTRUCTION = (
    "You are an expert SOP (Statement of Purpose) reviewer for study-abroad applications from Bangladesh. "
    "Analyze the provided SOP draft critically but constructively. Evaluate:\n"
    "1. CLICHÉ DETECTION: Flag overused, generic phrases (e.g., 'Since childhood...', 'your esteemed university', "
    "'globalized world', 'broaden my horizons'). These weaken the narrative.\n"
    "2. VISA INTENT: Check for clear ties to Bangladesh (family, career plans, community goals) that demonstrate "
    "genuine intent to return after studies. Visa officers look for this.\n"
    "3. UNIVERSITY ALIGNMENT: Check if the SOP mentions specific courses, professors, labs, or unique features "
    "of the target university. Generic praise is a red flag.\n"
    "4. GRAMMAR & TONE: Professional academic tone, no grammatical errors, appropriate formality.\n"
    "5. STRUCTURE: Introduction → motivation → academic background → why this university → career goals → conclusion.\n\n"
    "Be specific with quotes from the SOP. Provide actionable suggestions for each finding."
)

_SOP_AUDIT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_score": {"type": "integer", "description": "Overall SOP quality 0-100"},
        "verdict": {"type": "string", "enum": ["strong", "needs_work", "weak"]},
        "findings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ["cliche", "visa_intent", "university_alignment", "grammar_tone", "structure"]},
                    "severity": {"type": "string", "enum": ["info", "warning", "danger"]},
                    "quote": {"type": "string"},
                    "issue": {"type": "string"},
                    "suggestion": {"type": "string"},
                    "paragraph_ref": {"type": "string"},
                },
                "required": ["category", "severity", "quote", "issue", "suggestion"],
            },
        },
        "cliche_count": {"type": "integer"},
        "visa_intent_score": {"type": "integer", "description": "0-100 visa intent strength"},
        "university_alignment_score": {"type": "integer", "description": "0-100 university specificity"},
        "summary": {"type": "string"},
        "improved_excerpt": {"type": "string", "description": "AI-rewritten version of the weakest paragraph"},
    },
    "required": ["overall_score", "verdict", "findings", "cliche_count", "visa_intent_score", "university_alignment_score", "summary"],
}


class GeminiCounselorLLM(CounselorLLM):
    name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-flash-latest") -> None:
        if not api_key:
            raise CounselorLLMError("GEMINI_API_KEY is not set; cannot construct GeminiCounselorLLM")
        self._api_key = api_key
        self._model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def chat(
        self,
        messages: list[CounselorChatMessage],
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "auto",
    ) -> tuple[str, list[str], str, list[dict] | None]:
        if not messages:
            return (
                "Hello! I am your Ethos AI Study-Abroad Counselor. How can I help you plan your higher education today?",
                ["How much bank balance is required for Germany?", "Can I apply to the UK with a 2-year study gap?"],
                "en",
                None,
            )

        try:
            # Try grounded chat first for live citations
            return await asyncio.to_thread(self._chat_grounded_sync, messages, profile_context, language)
        except Exception as grounded_exc:
            logger.warning(f"Grounded chat failed, falling back to standard chat: {grounded_exc}")
            try:
                return await asyncio.to_thread(self._chat_sync, messages, profile_context, language)
            except CounselorLLMError:
                raise
            except Exception as exc:
                logger.exception("Gemini counselor chat failed")
                raise CounselorLLMError(f"Gemini counselor request failed: {exc}") from exc

    def _chat_sync(
        self,
        messages: list[CounselorChatMessage],
        profile_context: CounselorEvaluationRequest | None,
        language: str,
    ) -> tuple[str, list[str], str, list[dict] | None]:
        from google.genai import types

        client = self._get_client()

        context_str = "No student profile attached."
        if profile_context:
            context_str = (
                f"Student Profile:\n"
                f"- Degree: {profile_context.current_degree}, GPA: {profile_context.gpa}/{profile_context.max_gpa}\n"
                f"- Target Field: {profile_context.target_field or 'Not specified'}\n"
                f"- IELTS Band: {profile_context.ielts_score or 'Not yet tested'}\n"
                f"- Annual Budget: ৳{profile_context.budget_yearly_bdt_lakh} Lakh BDT\n"
                f"- Target Countries: {', '.join(profile_context.target_countries) if profile_context.target_countries else 'Open'}\n"
                f"- Study Gap: {profile_context.study_gap_years} years (Work Experience: {profile_context.has_work_experience})\n"
                f"- Preferred Intake: {profile_context.preferred_intake}"
            )

        convo_lines = []
        for m in messages:
            r = m.role.value if hasattr(m.role, "value") else str(m.role)
            convo_lines.append(f"{r.upper()}: {m.content}")

        convo_text = "\n".join(convo_lines)
        last_msg = messages[-1].content if messages else ""

        lang_instruction = "Match the language of the user's latest query (auto-detect English or Bangla)."
        if language == "bn" or is_bangla_text(last_msg):
            lang_instruction = "Reply strictly in fluent, helpful Bengali (বাংলা)."
        elif language == "en":
            lang_instruction = "Reply strictly in clear, professional English."

        prompt_content = (
            f"INSTRUCTION: {lang_instruction}\n\n"
            f"--- CONTEXT ---\n{context_str}\n\n"
            f"--- CONVERSATION HISTORY ---\n{convo_text}\n"
        )

        response = client.models.generate_content(
            model=self._model,
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.3,
            ),
        )

        raw = response.text
        if not raw:
            raise CounselorLLMError("Gemini returned an empty response")

        try:
            parsed = json.loads(raw)
            detected = parsed.get("detected_language", "en")
            if language in ("en", "bn"):
                detected = language
            return (
                parsed.get("reply", ""),
                parsed.get("suggested_queries", []),
                detected,
                None,  # No citations in non-grounded mode
            )
        except Exception as exc:
            raise CounselorLLMError(f"Failed to parse Gemini JSON output: {raw[:200]}") from exc

    def _chat_grounded_sync(
        self,
        messages: list[CounselorChatMessage],
        profile_context: CounselorEvaluationRequest | None,
        language: str,
    ) -> tuple[str, list[str], str, list[dict] | None]:
        """Grounded chat with Google Search citations."""
        from google.genai import types

        client = self._get_client()

        # Build context and prompt (same as _chat_sync)
        context_str = "No student profile attached."
        if profile_context:
            context_str = (
                f"Student Profile:\n"
                f"- Degree: {profile_context.current_degree}, GPA: {profile_context.gpa}/{profile_context.max_gpa}\n"
                f"- Target Field: {profile_context.target_field or 'Not specified'}\n"
                f"- IELTS Band: {profile_context.ielts_score or 'Not yet tested'}\n"
                f"- Annual Budget: ৳{profile_context.budget_yearly_bdt_lakh} Lakh BDT\n"
                f"- Target Countries: {', '.join(profile_context.target_countries) if profile_context.target_countries else 'Open'}\n"
                f"- Study Gap: {profile_context.study_gap_years} years (Work Experience: {profile_context.has_work_experience})\n"
                f"- Preferred Intake: {profile_context.preferred_intake}"
            )

        convo_lines = []
        for m in messages:
            r = m.role.value if hasattr(m.role, "value") else str(m.role)
            convo_lines.append(f"{r.upper()}: {m.content}")
        convo_text = "\n".join(convo_lines)
        last_msg = messages[-1].content if messages else ""

        lang_instruction = "Match the language of the user's latest query (auto-detect English or Bangla)."
        if language == "bn" or is_bangla_text(last_msg):
            lang_instruction = "Reply strictly in fluent, helpful Bengali (বাংলা)."
        elif language == "en":
            lang_instruction = "Reply strictly in clear, professional English."

        prompt_content = (
            f"INSTRUCTION: {lang_instruction}\n\n"
            f"--- CONTEXT ---\n{context_str}\n\n"
            f"--- CONVERSATION HISTORY ---\n{convo_text}\n"
        )

        # Grounded call (NO response_schema — incompatible with grounding)
        grounding_tool = types.Tool(google_search=types.GoogleSearch())

        response = client.models.generate_content(
            model=self._model,
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION_GROUNDED,
                tools=[grounding_tool],
                temperature=0.3,
            ),
        )

        reply_text = response.text or ""

        # Extract citations from grounding metadata
        citations = []
        if response.candidates:
            candidate = response.candidates[0]
            gm = getattr(candidate, 'grounding_metadata', None)
            if gm:
                chunks = getattr(gm, 'grounding_chunks', None) or []
                for chunk in chunks:
                    web = getattr(chunk, 'web', None)
                    if web:
                        citations.append({
                            "title": getattr(web, 'title', '') or '',
                            "url": getattr(web, 'uri', '') or '',
                        })

        # Detect language from reply
        if language in ("en", "bn"):
            detected_lang = language
        else:
            bengali_chars = len(re.findall(r"[\u0985-\u09B9\u09CE\u09DC-\u09DF]", reply_text))
            detected_lang = "bn" if bengali_chars >= 5 else "en"

        # Generate suggested queries: first try to extract personalized follow-ups from the reply
        extracted_queries: list[str] = []
        followup_match = re.search(r"(?:follow-up questions|follow up|পরবর্তী প্রশ্ন|❓).*?(?:\n|$)([\s\S]*)$", reply_text, re.IGNORECASE)
        if followup_match:
            for line in followup_match.group(1).splitlines():
                m = re.match(r"^\s*\d+[\.\)]\s*(?:\*\*)?(.*?)(?:\*\*)?(?:\?|\:|\(|$)", line)
                if m:
                    candidate = m.group(1).strip().strip("*").strip()
                    if len(candidate) >= 12 and not candidate.startswith("http"):
                        if not candidate.endswith("?"):
                            candidate += "?"
                        extracted_queries.append(candidate)

        if extracted_queries:
            suggested_queries = extracted_queries[:4]
        else:
            suggested_queries = [
                "Tell me more about the visa requirements",
                "What scholarships are available?",
                "How much does living cost there?",
            ]
            if detected_lang == "bn":
                suggested_queries = [
                    "ভিসার প্রয়োজনীয়তা সম্পর্কে আরও বলুন",
                    "কোন স্কলারশিপ পাওয়া যায়?",
                    "সেখানে থাকার খরচ কত?",
                ]

        return reply_text, suggested_queries, detected_lang, citations if citations else None

    async def audit_sop(
        self,
        sop_text: str,
        target_university: str | None = None,
        target_country: str | None = None,
        target_program: str | None = None,
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "en",
    ) -> dict:
        try:
            return await asyncio.to_thread(
                self._audit_sop_sync,
                sop_text, target_university, target_country, target_program,
                profile_context, language,
            )
        except CounselorLLMError:
            raise
        except Exception as exc:
            logger.exception("SOP audit failed")
            raise CounselorLLMError(f"SOP audit request failed: {exc}") from exc

    def _audit_sop_sync(
        self,
        sop_text: str,
        target_university: str | None,
        target_country: str | None,
        target_program: str | None,
        profile_context: CounselorEvaluationRequest | None,
        language: str,
    ) -> dict:
        from google.genai import types

        client = self._get_client()

        context_parts = []
        if target_university:
            context_parts.append(f"Target University: {target_university}")
        if target_country:
            context_parts.append(f"Target Country: {target_country}")
        if target_program:
            context_parts.append(f"Target Program: {target_program}")
        if profile_context:
            context_parts.append(
                f"Student Profile: GPA {profile_context.gpa}/{profile_context.max_gpa}, "
                f"IELTS {profile_context.ielts_score or 'N/A'}, "
                f"Study Gap {profile_context.study_gap_years} years, "
                f"Field: {profile_context.target_field or 'N/A'}"
            )

        context_block = "\n".join(context_parts) if context_parts else "No additional context provided."

        lang_note = "Provide the audit summary and suggestions in English." if language == "en" else "Provide the audit summary and suggestions in Bengali (বাংলা)."

        prompt_content = (
            f"--- STUDENT CONTEXT ---\n{context_block}\n\n"
            f"--- SOP DRAFT ---\n{sop_text}\n\n"
            f"INSTRUCTION: {lang_note}\n"
            f"Analyze this SOP thoroughly. Provide an overall_score (0-100), verdict, detailed findings, "
            f"cliche_count, visa_intent_score (0-100), university_alignment_score (0-100), a summary, "
            f"and an improved_excerpt rewriting the weakest paragraph."
        )

        response = client.models.generate_content(
            model=self._model,
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=_SOP_AUDIT_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=_SOP_AUDIT_RESPONSE_SCHEMA,
                temperature=0.2,
            ),
        )

        raw = response.text
        if not raw:
            raise CounselorLLMError("Gemini returned an empty SOP audit response")

        try:
            parsed = json.loads(raw)
            parsed["model_used"] = self.name
            return parsed
        except Exception as exc:
            raise CounselorLLMError(f"Failed to parse SOP audit JSON: {raw[:200]}") from exc
