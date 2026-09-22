"""
Service for live, search-grounded university discovery using Google Gemini.

Queries real-time web data (official university portals, 2026/2027 tuition fees,
living expenses, and entry requirements) grounded in Google Search, matching the
student's exact GPA, English proficiency, and annual budget in BDT Lakhs.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Any

from app.schemas import (
    CounselorEvaluationRequest,
    UniversityRecommendation,
    UniversityTier,
)
from app.services.counselor_knowledge import CURRENCY_RATES_TO_BDT

logger = logging.getLogger(__name__)

_DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def _build_search_prompt(req: CounselorEvaluationRequest) -> str:
    """Constructs a high-precision prompt with budget converted to target currencies."""
    countries_str = (
        ", ".join(req.target_countries)
        if req.target_countries
        else "Germany, USA, Canada, UK, Australia, Sweden, Malaysia"
    )

    degree_level = "Undergraduate Bachelor's" if req.current_degree in ("hsc", "a_level") else "Postgraduate Master's"
    field_str = req.target_field or req.field_category or "Computer Science / Data Science / Business"

    ielts_str = f"IELTS {req.ielts_score}" if req.ielts_score else "English requirement not yet tested"
    if req.pte_score:
        ielts_str += f" (PTE: {req.pte_score})"
    if req.duolingo_score:
        ielts_str += f" (Duolingo: {req.duolingo_score})"

    budget_bdt = req.budget_yearly_bdt_lakh
    approx_eur = round((budget_bdt * 100_000) / CURRENCY_RATES_TO_BDT.get("EUR", 133.0))
    approx_usd = round((budget_bdt * 100_000) / CURRENCY_RATES_TO_BDT.get("USD", 122.5))
    approx_gbp = round((budget_bdt * 100_000) / CURRENCY_RATES_TO_BDT.get("GBP", 158.0))
    approx_cad = round((budget_bdt * 100_000) / CURRENCY_RATES_TO_BDT.get("CAD", 90.5))

    budget_context = (
        f"Total Annual Budget (Tuition + Living combined): ৳{budget_bdt} Lakh BDT "
        f"(approx. ${approx_usd:,} USD / €{approx_eur:,} EUR / £{approx_gbp:,} GBP / ${approx_cad:,} CAD per year)."
    )

    return f"""You are Ethos AI's real-time international admissions researcher.
Search Google via live search grounding to discover real, accredited universities for an international applicant from Bangladesh with the following verified profile:

Target Countries: {countries_str}
Target Degree Level: {degree_level}
Target Program/Field: {field_str}
Intake: {req.preferred_intake or 'Fall 2026'}
Academic GPA: {req.gpa} / {req.max_gpa}
English Test Score: {ielts_str}
Study Gap: {req.study_gap_years} years (Has Work Experience: {req.has_work_experience})
{budget_context}
Scholarship Priority: {req.scholarship_priority}
MOI (Medium of Instruction) / Duolingo Priority: {req.moi_only}

TASK:
1. Search Google for 4 to 8 real, accredited universities in {countries_str} offering English-taught {field_str} {degree_level} degrees for {req.preferred_intake or 'Fall 2026'}.
2. For each university, verify current tuition fees, cost of living, minimum GPA cutoffs, and whether it fits into Dream (high reach), Target (good match), or Safe (high admission chance) tiers.
3. If budget is low (e.g. under ৳20L/yr), prioritize German public universities (0 tuition), low-cost Swedish/Canadian/Malaysian institutions, or high-scholarship US/UK colleges.
4. Provide the official university admissions website URL (e.g. https://www.uni-passau.de or https://www.tum.de).

CRITICAL FORMAT INSTRUCTION:
Return ONLY a valid JSON array wrapped inside a markdown code block:
```json
[
  {{
    "university_name": "University Name",
    "country": "Germany",
    "city": "City Name",
    "website_url": "https://www.official-uni-domain.org",
    "target_programs": ["M.Sc. Computer Science", "M.Sc. Artificial Intelligence"],
    "tier": "target",
    "currency_local": "EUR",
    "annual_tuition_local": 0.0,
    "annual_living_local": 11200.0,
    "minimum_gpa": 3.0,
    "minimum_ielts": 6.5,
    "max_study_gap_years": 3,
    "admission_chance_percent": 65,
    "matching_reasons": ["Reason 1", "Reason 2"],
    "caution_notes": ["Caution 1 if any"],
    "scholarship_info": "Scholarship info or null",
    "accepts_moi": false,
    "coop_available": true,
    "field_tags": ["cs_it"]
  }}
]
```
Do not include any conversational preamble or outro. Output only the ```json [...] ``` block.
"""


def _parse_gemini_json_response(text: str) -> list[dict[str, Any]]:
    """Robustly extracts and parses JSON list from model response text."""
    if not text:
        return []

    # Try extracting markdown json code block
    match = re.search(r"```(?:json)?\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```", text)
    if match:
        raw_json = match.group(1).strip()
    else:
        # Fallback: look for outermost array brackets
        match_bracket = re.search(r"(\[\s*\{[\s\S]*?\}\s*\])", text)
        if match_bracket:
            raw_json = match_bracket.group(1).strip()
        else:
            return []

    try:
        data = json.loads(raw_json)
        if isinstance(data, list):
            return data
    except Exception as exc:
        logger.warning(f"Failed to parse live university JSON from Gemini: {exc}")

    return []


def _extract_grounding_citations(response: Any) -> list[dict[str, str]]:
    """Extracts web citation metadata from Gemini Search Grounding."""
    citations: list[dict[str, str]] = []
    if not hasattr(response, "candidates") or not response.candidates:
        return citations

    candidate = response.candidates[0]
    gm = getattr(candidate, "grounding_metadata", None)
    if not gm:
        return citations

    chunks = getattr(gm, "grounding_chunks", None) or []
    seen_urls: set[str] = set()

    for chunk in chunks:
        web = getattr(chunk, "web", None)
        if web:
            uri = (getattr(web, "uri", "") or "").strip()
            title = (getattr(web, "title", "") or "").strip()
            if uri and uri not in seen_urls:
                seen_urls.add(uri)
                citations.append({
                    "title": title or uri,
                    "url": uri,
                })

    return citations


def _sync_gemini_search(
    req: CounselorEvaluationRequest,
    limit: int = 8,
) -> tuple[list[UniversityRecommendation], list[dict[str, str]]]:
    """Synchronous worker that calls Google GenAI with Search Grounding."""
    from app.config import get_settings

    settings = get_settings()
    api_key = (
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured for live university discovery.")
        return [], []

    try:
        from google import genai
        from google.genai import types

        model_name = settings.gemini_model or "gemini-3.6-flash"
        client = genai.Client(api_key=api_key)

        prompt = _build_search_prompt(req)
        grounding_tool = types.Tool(google_search=types.GoogleSearch())

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[grounding_tool],
                temperature=0.2,
            ),
        )

        raw_text = response.text or ""
        citations = _extract_grounding_citations(response)
        items = _parse_gemini_json_response(raw_text)

        recommendations: list[UniversityRecommendation] = []
        norm_gpa = (
            round((min(5.0, req.gpa) / 5.0) * 4.0, 2)
            if req.max_gpa == 5.0
            else min(4.0, req.gpa)
        )
        ielts_band = req.ielts_score or 6.0
        budget = req.budget_yearly_bdt_lakh

        for i, item in enumerate(items[:limit]):
            uni_name = str(item.get("university_name", "")).strip()
            if not uni_name:
                continue

            country = str(item.get("country", "Global")).strip()
            city = str(item.get("city", "")).strip()
            website_url = str(item.get("website_url", "")).strip() or None

            currency = str(item.get("currency_local", "USD")).upper()
            rate = CURRENCY_RATES_TO_BDT.get(currency, 122.50)

            tuition_local = float(item.get("annual_tuition_local", 0.0) or 0.0)
            living_local = float(item.get("annual_living_local", 0.0) or 0.0)

            tuition_bdt_lakh = round((tuition_local * rate) / 100_000.0, 2)
            living_bdt_lakh = round((living_local * rate) / 100_000.0, 2)
            total_bdt_lakh = round(tuition_bdt_lakh + living_bdt_lakh, 2)

            min_gpa = float(item.get("minimum_gpa", 3.0) or 3.0)
            min_ielts = float(item.get("minimum_ielts", 6.0) or 6.0)
            max_gap = int(item.get("max_study_gap_years", 3) or 3)

            tier_raw = str(item.get("tier", "target")).lower()
            if "dream" in tier_raw:
                tier = UniversityTier.DREAM
            elif "safe" in tier_raw:
                tier = UniversityTier.SAFE
            else:
                tier = UniversityTier.TARGET

            admission_chance = int(item.get("admission_chance_percent", 60) or 60)
            admission_chance = max(10, min(95, admission_chance))

            # Match score computation
            gpa_diff = norm_gpa - min_gpa
            ielts_diff = ielts_band - min_ielts
            score = 75.0 + (gpa_diff * 12.0) + (ielts_diff * 8.0)
            if budget >= total_bdt_lakh:
                score += 10.0
            else:
                score -= min(25.0, (total_bdt_lakh - budget) * 2.0)
            score = int(max(15, min(98, round(score))))

            programs = item.get("target_programs") or ["Relevant Degree Program"]
            if not isinstance(programs, list):
                programs = [str(programs)]

            reasons = item.get("matching_reasons") or ["Live match discovered based on academic profile and budget."]
            if not isinstance(reasons, list):
                reasons = [str(reasons)]

            cautions = item.get("caution_notes") or []
            if not isinstance(cautions, list):
                cautions = [str(cautions)]

            field_tags = item.get("field_tags") or [req.field_category or "general"]
            if not isinstance(field_tags, list):
                field_tags = [str(field_tags)]

            safe_slug = re.sub(r"[^a-z0-9]+", "-", f"live-{country[:2].lower()}-{uni_name.lower()}").strip("-")[:40]

            rec = UniversityRecommendation(
                id=f"{safe_slug}-{i+1}",
                university_name=uni_name,
                country=country,
                city=city,
                target_programs=programs[:4],
                tier=tier,
                match_score=score,
                admission_chance_percent=admission_chance,
                annual_tuition_bdt_lakh=tuition_bdt_lakh,
                annual_living_bdt_lakh=living_bdt_lakh,
                annual_total_bdt_lakh=total_bdt_lakh,
                currency_local=currency,
                annual_tuition_local=tuition_local,
                minimum_gpa=min_gpa,
                minimum_ielts=min_ielts,
                max_study_gap_years=max_gap,
                matching_reasons=reasons[:4],
                caution_notes=cautions[:3],
                scholarship_info=item.get("scholarship_info"),
                accepts_moi=bool(item.get("accepts_moi", False)),
                coop_available=bool(item.get("coop_available", False)),
                field_tags=field_tags,
                website_url=website_url,
                is_live_grounded=True,
                grounding_citations=citations[:5],
            )
            recommendations.append(rec)

        return recommendations, citations

    except Exception as exc:
        logger.exception(f"Gemini live university discovery failed: {exc}")
        return [], []


async def discover_live_universities_gemini(
    req: CounselorEvaluationRequest,
    limit: int = 8,
) -> tuple[list[UniversityRecommendation], list[dict[str, str]]]:
    """Asynchronously calls Gemini Google Search Grounding to find live universities."""
    return await asyncio.to_thread(_sync_gemini_search, req, limit)
