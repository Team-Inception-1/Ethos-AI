"""
Deterministic heuristic and recommendation engine for the Ethos AI Counselor.

Evaluates student profiles against university admission standards, categorizes into
Dream / Target / Safe tiers, audits visa & bank solvency feasibility, and generates
intake milestone roadmaps.
"""
from __future__ import annotations

import logging
import math
from typing import Any

from app.schemas import (
    CounselorEvaluationRequest,
    CounselorEvaluationResponse,
    FlagSeverity,
    RoadmapMilestone,
    UniversityRecommendation,
    UniversityTier,
    VisaAssessment,
    VisaRiskFlag,
)
from app.services.counselor_knowledge import (
    COUNTRY_VISA_RULES,
    UNIVERSITY_CATALOG,
    convert_to_bdt_lakh,
)


def normalize_gpa(gpa: float, max_gpa: float) -> float:
    """Normalizes GPA to a standard 4.0 scale if given on a 5.0 scale."""
    if max_gpa == 5.0:
        # Standard Bangladeshi HSC/SSC 5.0 to 4.0 conversion benchmark
        return round(min(4.0, (gpa / 5.0) * 4.0), 2)
    return round(min(4.0, gpa), 2)


def effective_ielts_band(req: CounselorEvaluationRequest) -> float:
    """Calculates an effective IELTS equivalent band from IELTS, PTE, or Duolingo."""
    if req.ielts_score is not None:
        return float(req.ielts_score)
    if req.pte_score is not None:
        # PTE Academic to IELTS mapping
        if req.pte_score >= 76:
            return 8.0
        if req.pte_score >= 66:
            return 7.0
        if req.pte_score >= 58:
            return 6.5
        if req.pte_score >= 50:
            return 6.0
        if req.pte_score >= 42:
            return 5.5
        return 5.0
    if req.duolingo_score is not None:
        # Duolingo to IELTS mapping
        if req.duolingo_score >= 130:
            return 7.5
        if req.duolingo_score >= 120:
            return 7.0
        if req.duolingo_score >= 110:
            return 6.5
        if req.duolingo_score >= 100:
            return 6.0
        if req.duolingo_score >= 90:
            return 5.5
        return 5.0
    return 6.0  # Default assumed baseline band if not yet taken


def evaluate_counselor_profile(req: CounselorEvaluationRequest) -> CounselorEvaluationResponse:
    norm_gpa = normalize_gpa(req.gpa, req.max_gpa)
    ielts_band = effective_ielts_band(req)
    budget = req.budget_yearly_bdt_lakh

    # Target countries filtering (case-insensitive)
    target_countries = [c.strip().lower() for c in req.target_countries if c.strip()]

    scored_unis: list[dict[str, Any]] = []

    for uni in UNIVERSITY_CATALOG:
        uni_country = uni["country"].lower()
        if target_countries and uni_country not in target_countries:
            continue

        tuition_bdt_lakh = convert_to_bdt_lakh(uni["annual_tuition_local"], uni["currency"])
        living_bdt_lakh = convert_to_bdt_lakh(uni["annual_living_local"], uni["currency"])
        total_bdt_lakh = round(tuition_bdt_lakh + living_bdt_lakh, 2)

        min_gpa = uni["min_gpa"]
        min_ielts = uni["min_ielts"]
        max_gap = uni["max_study_gap"]
        selectivity = uni["selectivity"]

        gpa_diff = norm_gpa - min_gpa
        ielts_diff = ielts_band - min_ielts
        budget_diff = budget - total_bdt_lakh

        # Base match score computation (0 - 100)
        score = 70.0
        score += gpa_diff * 15.0
        score += ielts_diff * 10.0
        if budget >= total_bdt_lakh:
            score += 15.0
        else:
            # penalize deficit
            deficit = total_bdt_lakh - budget
            score -= min(30.0, deficit * 2.5)

        # Scholarship priority bonus
        if req.scholarship_priority:
            if uni.get("scholarship_info") or uni["annual_tuition_local"] == 0.0:
                score += 12.0
            else:
                score -= 8.0

        # MOI filter bonus/check
        if req.moi_only:
            if uni.get("accepts_moi"):
                score += 15.0
            else:
                score -= 20.0

        # Field match bonus
        if req.field_category and req.field_category in uni.get("field_tags", []):
            score += 10.0

        score = max(10.0, min(98.0, score))

        reasons = list(uni.get("reasons", []))
        cautions: list[str] = []

        if uni.get("scholarship_info"):
            reasons.insert(0, f"Scholarship: {uni['scholarship_info']}")
        if uni.get("accepts_moi"):
            reasons.append("Accepts Medium of Instruction (MOI) / Duolingo English test.")
        if uni.get("coop_available"):
            reasons.append("Integrated paid industrial internship / co-op available.")

        # Tier assignment heuristics
        is_dream = False
        is_safe = False

        if selectivity == "high" or gpa_diff < -0.1 or ielts_diff < 0 or (total_bdt_lakh > budget * 1.15):
            is_dream = True
        elif (
            gpa_diff >= 0.25
            and ielts_diff >= 0.5
            and (budget >= total_bdt_lakh)
            and (selectivity == "accessible" or selectivity == "accessible-medium")
        ):
            is_safe = True

        if is_dream:
            tier = UniversityTier.DREAM
            admission_chance = int(min(35, max(15, round(25 + gpa_diff * 10))))
            if gpa_diff < 0:
                cautions.append(f"Your GPA ({norm_gpa}) is slightly below the typical competitive cutoff ({min_gpa}).")
            if ielts_diff < 0:
                cautions.append(f"Minimum English requirement is IELTS {min_ielts} (you have ~{ielts_band}).")
            if total_bdt_lakh > budget:
                cautions.append(f"Estimated annual cost (৳{total_bdt_lakh}L) exceeds your declared budget (৳{budget}L).")
        elif is_safe:
            tier = UniversityTier.SAFE
            admission_chance = int(min(96, max(80, round(85 + gpa_diff * 8))))
            reasons.append(f"Comfortably exceeds minimum GPA ({min_gpa}) and English requirements.")
            reasons.append(f"Annual cost of ৳{total_bdt_lakh}L fits safely inside your ৳{budget}L budget.")
        else:
            tier = UniversityTier.TARGET
            admission_chance = int(min(78, max(45, round(60 + gpa_diff * 12))))
            reasons.append("Strong alignment with your current academic qualifications.")

        # Study gap caution
        if req.study_gap_years > max_gap:
            if req.has_work_experience:
                cautions.append(
                    f"Study gap of {req.study_gap_years} years requires verifiable work experience certificates & tax slips."
                )
            else:
                cautions.append(
                    f"Study gap of {req.study_gap_years} years exceeds the university's typical preference of {max_gap} years without employment."
                )

        scored_unis.append({
            "rec": UniversityRecommendation(
                id=uni["id"],
                university_name=uni["name"],
                country=uni["country"],
                city=uni["city"],
                target_programs=uni["programs"],
                tier=tier,
                match_score=int(round(score)),
                admission_chance_percent=admission_chance,
                annual_tuition_bdt_lakh=tuition_bdt_lakh,
                annual_living_bdt_lakh=living_bdt_lakh,
                annual_total_bdt_lakh=total_bdt_lakh,
                currency_local=uni["currency"],
                annual_tuition_local=uni["annual_tuition_local"],
                minimum_gpa=min_gpa,
                minimum_ielts=min_ielts,
                max_study_gap_years=max_gap,
                matching_reasons=reasons[:4],
                caution_notes=cautions,
                scholarship_info=uni.get("scholarship_info"),
                accepts_moi=bool(uni.get("accepts_moi", False)),
                coop_available=bool(uni.get("coop_available", False)),
                field_tags=uni.get("field_tags", []),
            ),
            "tier": tier,
            "score": score,
        })

    # If too few recommendations or empty due to strict filters, fallback to all catalog
    if not scored_unis and target_countries:
        # Relax country filter
        return evaluate_counselor_profile(
            CounselorEvaluationRequest(
                current_degree=req.current_degree,
                gpa=req.gpa,
                max_gpa=req.max_gpa,
                ielts_score=req.ielts_score,
                pte_score=req.pte_score,
                duolingo_score=req.duolingo_score,
                budget_yearly_bdt_lakh=req.budget_yearly_bdt_lakh,
                target_countries=[],
                target_field=req.target_field,
                study_gap_years=req.study_gap_years,
                preferred_intake=req.preferred_intake,
                has_work_experience=req.has_work_experience,
                language=req.language,
            )
        )

    # Balance into Dream, Target, Safe groups
    dreams = [u["rec"] for u in scored_unis if u["tier"] == UniversityTier.DREAM]
    targets = [u["rec"] for u in scored_unis if u["tier"] == UniversityTier.TARGET]
    safes = [u["rec"] for u in scored_unis if u["tier"] == UniversityTier.SAFE]

    # Sort each tier by match score descending
    dreams.sort(key=lambda x: x.match_score, reverse=True)
    targets.sort(key=lambda x: x.match_score, reverse=True)
    safes.sort(key=lambda x: x.match_score, reverse=True)

    # Ensure at least 1 in each tier if available by promoting/demoting
    if not safes and len(targets) > 2:
        # Move lowest selective target to safe
        promoted = targets.pop()
        promoted.tier = UniversityTier.SAFE
        promoted.admission_chance_percent = 82
        safes.append(promoted)

    if not dreams and len(targets) > 2:
        promoted = targets.pop(0)
        promoted.tier = UniversityTier.DREAM
        promoted.admission_chance_percent = 32
        dreams.append(promoted)

    # Take top matches of each category (up to 20 total)
    final_recommendations: list[UniversityRecommendation] = (
        dreams[:6] + targets[:8] + safes[:6]
    )

    # Evaluate Visa & Solvency
    visa_assessment = assess_visa_feasibility(req, norm_gpa, ielts_band)

    # Generate Milestone Roadmap
    roadmap = generate_intake_roadmap(req.preferred_intake or "Fall 2026", req.study_gap_years)

    dream_cnt = sum(1 for r in final_recommendations if r.tier == UniversityTier.DREAM)
    target_cnt = sum(1 for r in final_recommendations if r.tier == UniversityTier.TARGET)
    safe_cnt = sum(1 for r in final_recommendations if r.tier == UniversityTier.SAFE)

    return CounselorEvaluationResponse(
        profile_summary={
            "normalized_gpa": norm_gpa,
            "ielts_equivalent": ielts_band,
            "budget_bdt_lakh": budget,
            "study_gap_years": req.study_gap_years,
            "target_field": req.target_field or "General",
            "preferred_intake": req.preferred_intake or "Fall 2026",
        },
        recommendations=final_recommendations,
        visa_assessment=visa_assessment,
        roadmap=roadmap,
        dream_count=dream_cnt,
        target_count=target_cnt,
        safe_count=safe_cnt,
        live_discovery_active=False,
    )


async def evaluate_counselor_profile_with_live(
    req: CounselorEvaluationRequest,
) -> CounselorEvaluationResponse:
    """Evaluates student profile and optionally augments with live Google Search Grounded universities."""
    base_response = evaluate_counselor_profile(req)
    if not req.enable_live_discovery:
        return base_response

    try:
        from app.services.live_university_finder import discover_live_universities_gemini

        live_recs, _ = await discover_live_universities_gemini(req, limit=8)
        if not live_recs:
            return base_response

        # Deduplicate against catalog items by lowercase name
        existing_names = {r.university_name.lower().strip() for r in base_response.recommendations}
        merged_recs = list(base_response.recommendations)

        for l_rec in live_recs:
            if l_rec.university_name.lower().strip() not in existing_names:
                existing_names.add(l_rec.university_name.lower().strip())
                merged_recs.append(l_rec)

        dream_cnt = sum(1 for r in merged_recs if r.tier == UniversityTier.DREAM)
        target_cnt = sum(1 for r in merged_recs if r.tier == UniversityTier.TARGET)
        safe_cnt = sum(1 for r in merged_recs if r.tier == UniversityTier.SAFE)

        return CounselorEvaluationResponse(
            profile_summary=base_response.profile_summary,
            recommendations=merged_recs,
            visa_assessment=base_response.visa_assessment,
            roadmap=base_response.roadmap,
            dream_count=dream_cnt,
            target_count=target_cnt,
            safe_count=safe_cnt,
            live_discovery_active=True,
        )
    except Exception as exc:
        logging.getLogger(__name__).warning(
            f"Live university discovery failed during evaluation, returning baseline catalog: {exc}"
        )
        return base_response


def assess_visa_feasibility(
    req: CounselorEvaluationRequest,
    norm_gpa: float,
    ielts_band: float,
) -> VisaAssessment:
    """Assesses visa readiness, bank solvency requirements in BDT, and study gap risk."""
    readiness_score = 85
    flags: list[VisaRiskFlag] = []
    solvency_breakdown: dict[str, str] = {}
    max_solvency_required = 0.0

    target_countries = [c.strip() for c in req.target_countries if c.strip()]
    if not target_countries:
        target_countries = ["Germany", "UK", "USA", "Canada", "Australia"]

    for country in target_countries:
        # Match against knowledge base
        matched_rule = None
        for k, v in COUNTRY_VISA_RULES.items():
            if k.lower() == country.lower():
                matched_rule = (k, v)
                break

        if matched_rule:
            c_name, c_info = matched_rule
            solv_val = float(c_info["estimated_solvency_bdt_lakh"])
            max_solvency_required = max(max_solvency_required, solv_val)
            desc = c_info["solvency_summary_bn"] if req.language == "bn" else c_info["solvency_summary_en"]
            solvency_breakdown[c_name] = f"৳{solv_val} Lakh — {desc}"

    if max_solvency_required == 0.0:
        max_solvency_required = 25.0

    # Risk factor 1: Study gap
    if req.study_gap_years >= 2:
        if not req.has_work_experience:
            readiness_score -= min(35, req.study_gap_years * 10)
            flags.append(
                VisaRiskFlag(
                    severity=FlagSeverity.DANGER,
                    title="High Study Gap without Formal Employment" if req.language != "bn" else "চাকরির প্রমাণবিহীন উচ্চ স্টাডি গ্যাপ",
                    description=(
                        f"You have a {req.study_gap_years}-year study gap without declared work experience. "
                        "Visa officers in Australia, Germany, and the UK scrutinize unexplained study gaps heavily."
                    )
                    if req.language != "bn"
                    else (
                        f"আপনার {req.study_gap_years} বছরের স্টাডি গ্যাপ রয়েছে এবং কোনো চাকরির প্রমাণ নেই। "
                        "জার্মানি, অস্ট্রেলিয়া ও যুক্তরাজ্য ভিসা অফিস স্টাডি গ্যাপ অত্যন্ত কড়াকড়িভাবে দেখে।"
                    ),
                    mitigation_tip=(
                        "Gather formal job appointment letters, official salary pay slips, and bank statements showing salary credit. "
                        "Never submit falsified experience certificates."
                    )
                    if req.language != "bn"
                    else (
                        "অফিসিয়াল অ্যাপয়েন্টমেন্ট লেটার, পে-স্লিপ ও ব্যাংকে স্যালারি ক্রেডিট স্টেটমেন্ট প্রস্তুত করুন। "
                        "কখনোই কোনো এজেন্সির পরামর্শে ভুয়া এক্সপেরিয়েন্স সার্টিফিকেট তৈরি করবেন না।"
                    ),
                )
            )
        else:
            readiness_score -= 10
            flags.append(
                VisaRiskFlag(
                    severity=FlagSeverity.WARNING,
                    title="Study Gap Supported by Employment" if req.language != "bn" else "কর্মঅভিজ্ঞতা সমৃদ্ধ স্টাডি গ্যাপ",
                    description=(
                        f"Your {req.study_gap_years}-year gap is justified by professional experience. "
                        "Ensure your job responsibilities directly tie into your targeted degree."
                    )
                    if req.language != "bn"
                    else (
                        f"আপনার {req.study_gap_years} বছরের গ্যাপ চাকরির অভিজ্ঞতার সাথে সম্পর্কিত। "
                        "আপনার ভবিষ্যৎ কোর্সের সাথে বর্তমান চাকরির সম্পর্ক স্টেটমেন্ট অফ পারপাসে (SOP) পরিষ্কার করুন।"
                    ),
                    mitigation_tip=(
                        "Highlight career progression and explain why you need an international degree for promotion."
                    )
                    if req.language != "bn"
                    else (
                        "আপনার ক্যারিয়ার গ্রোথের জন্য উচ্চশিক্ষা কীভাবে ভূমিকা রাখবে তা ভিসা অ্যাপ্লিকেশনে তুলে ধরুন।"
                    ),
                )
            )

    # Risk factor 2: English proficiency
    if ielts_band < 6.0:
        readiness_score -= 20
        flags.append(
            VisaRiskFlag(
                severity=FlagSeverity.WARNING,
                title="Sub-optimal Language Score" if req.language != "bn" else "ভাষাগত স্কোর উন্নীতকরণ প্রয়োজন",
                description=(
                    f"Estimated IELTS equivalent ({ielts_band}) is below the standard direct visa threshold of 6.0–6.5."
                )
                if req.language != "bn"
                else (
                    f"আপনার আনুমানিক আইইএলটিএস ব্যান্ড ({ielts_band}) সরাসরি ভিসা পাওয়ার জন্য আদর্শ নয় (ন্যূনতম ৬.০–৬.৫ প্রয়োজন)।"
                ),
                mitigation_tip=(
                    "Target retaking IELTS or PTE Academic to achieve at least 6.5 with no band less than 6.0 to unlock direct visas."
                )
                if req.language != "bn"
                else (
                    "আইইএলটিএস আবার দিয়ে অন্তত ৬.৫ ব্যান্ড তোলার চেষ্টা করুন, যা ভিসা রিজেকশনের ঝুঁকি অনেক কমিয়ে দেয়।"
                ),
            )
        )

    # Risk factor 3: Budget vs Solvency
    if req.budget_yearly_bdt_lakh < max_solvency_required:
        readiness_score -= 15
        flags.append(
            VisaRiskFlag(
                severity=FlagSeverity.WARNING,
                title="Bank Solvency Buffer Alert" if req.language != "bn" else "ব্যাংক সলভেন্সি সতর্কবার্তা",
                description=(
                    f"Your annual budget (৳{req.budget_yearly_bdt_lakh}L) is lower than the mandatory initial proof-of-funds requirement (approx ৳{max_solvency_required}L)."
                )
                if req.language != "bn"
                else (
                    f"আপনার বার্ষিক বাজেট (৳{req.budget_yearly_bdt_lakh} লাখ) ভিসা আবেদনের জন্য আবশ্যক ব্যাংক সলভেন্সির চেয়ে কম (প্রায় ৳{max_solvency_required} লাখ প্রয়োজন)।"
                ),
                mitigation_tip=(
                    "Line up an immediate first-degree blood sponsor (parents) with clear income tax certificates (TIN & Return acknowledgments)."
                )
                if req.language != "bn"
                else (
                    "পিতা-মাতার বৈধ ট্যাক্স ফাইল, রিটার্ন দাখিল রসিদ ও ব্যাংকে পর্যাপ্ত ব্যালেন্স সময়মতো প্রস্তুত রাখুন।"
                ),
            )
        )

    readiness_score = max(20, min(95, readiness_score))

    if readiness_score >= 75:
        status = "favorable"
    elif readiness_score >= 50:
        status = "moderate_risk"
    else:
        status = "high_scrutiny"

    advice = [
        "Keep all bank accounts in recognized schedule banks with 3 to 6 months regular transactional history.",
        "Ensure sponsor ties are immediate family (parents preferred) with clear income tax filings.",
        "Maintain document authenticity: Ethos AI verifies offer letters and agreements to keep you protected.",
    ]
    if req.language == "bn":
        advice = [
            "অনুমোদিত তফসিলি ব্যাংকে ৩ থেকে ৬ মাসের নিয়মিত লেনদেনসহ ফান্ড রাখুন।",
            "স্পন্সর হিসেবে পিতা-মাতাকে অগ্রাধিকার দিন এবং তাদের আয়কর রিটার্ন ফাইল হালনাগাদ রাখুন।",
            "ভুয়া অফার লেটার বা গ্যারান্টি দেওয়া প্রতারক এজেন্সি এড়িয়ে চলুন; ইথোস এআই দিয়ে যাচাই করে নিন।",
        ]

    return VisaAssessment(
        readiness_score=readiness_score,
        status=status,
        estimated_solvency_required_bdt_lakh=round(max_solvency_required, 2),
        solvency_details_by_country=solvency_breakdown,
        risk_flags=flags,
        key_advice=advice,
    )


def generate_intake_roadmap(intake: str, study_gap_years: int) -> list[RoadmapMilestone]:
    """Generates a structured 6-phase application roadmap aligned with standard study-abroad timelines."""
    return [
        RoadmapMilestone(
            step_number=1,
            month_timeline="Month 1–2",
            phase_title="Profile Evaluation & Standardized Tests",
            tasks=[
                "Complete IELTS / PTE Academic testing to secure at least 6.5 band.",
                "Collect official academic transcripts, medium-of-instruction (MOI) certificates, and provisional certificates from your college/university.",
                "Consolidate passport with at least 18 months validity remaining.",
            ],
            critical_warning="Do not pay non-refundable consultancy fees before having verified test scores.",
        ),
        RoadmapMilestone(
            step_number=2,
            month_timeline="Month 3",
            phase_title="University Shortlisting & Document Preparation",
            tasks=[
                "Draft academic Statement of Purpose (SOP) articulating your career rationale.",
                "Secure 2 Academic/Professional Letters of Recommendation (LORs) on official letterheads.",
                "If you have a study gap, assemble official salary certificates and bank credit statements.",
            ],
            critical_warning="Never use generic copy-pasted SOPs; visa officers run strict plagiarism and AI detection.",
        ),
        RoadmapMilestone(
            step_number=3,
            month_timeline="Month 4",
            phase_title="Application Submission & Scholarship Filing",
            tasks=[
                "Submit direct online applications to shortlisted Dream, Target, and Safe institutions.",
                "Apply for early-bird international tuition discounts and departmental graduate assistantships.",
                "Track application IDs and official portal statuses.",
            ],
            critical_warning=None,
        ),
        RoadmapMilestone(
            step_number=4,
            month_timeline="Month 5",
            phase_title="Offer Verification & Deposit Payment",
            tasks=[
                "Receive conditional/unconditional offer letters.",
                "Run offer letters through Ethos AI Offer Letter Fraud Scanner to verify authenticity.",
                "Pay initial university tuition deposit via authorized Bangladesh Bank foreign currency remittance (Student File).",
            ],
            critical_warning="Always use authorized banking channels (Student File) to pay tuition. Avoid informal Hundi/cash transfers.",
        ),
        RoadmapMilestone(
            step_number=5,
            month_timeline="Month 6",
            phase_title="Bank Solvency & Proof of Funds Holding",
            tasks=[
                "For Germany: Open Blocked Account (€11,904) and transfer funds via authorized bank.",
                "For UK: Maintain 28-day continuous funds holding rule in approved bank before CAS issuance.",
                "For USA: Prepare official Bank Solvency Certificate & Affidavit of Support for Form I-20.",
            ],
            critical_warning="Do not withdraw or touch funds during the mandatory holding period.",
        ),
        RoadmapMilestone(
            step_number=6,
            month_timeline="Month 7–8",
            phase_title="Visa Filing, Biometrics & Pre-Departure",
            tasks=[
                "Complete official visa application (DS-160 for USA, gov.uk for UK, VFS for Germany/Canada/Australia).",
                "Complete mandatory TB test (IOM Bangladesh) and schedule biometrics appointment.",
                "Attend visa interview with clear, concise answers on funding and post-study career goals in Bangladesh.",
                "Book flight and student accommodation upon visa approval.",
            ],
            critical_warning="Be honest and transparent in your visa interview; never claim fraudulent ties or credentials.",
        ),
    ]
