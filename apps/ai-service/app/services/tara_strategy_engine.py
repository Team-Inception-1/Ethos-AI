"""Personalized RA vs TA Funding Strategy & Advisor Engine for Ethos AI ScholarFinder.

Provides institutional funding heuristics, spoken English cutoff analysis (ITA/SPEAK tests),
personalized viability scoring, financial strategy, and academic funding Q&A.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from app.schemas import (
    TARAAdvisorQuestionRequest,
    TARAAdvisorQuestionResponse,
    TARAStrategyRequest,
    TARAStrategyResponse,
)

logger = logging.getLogger(__name__)


def evaluate_tara_strategy(payload: TARAStrategyRequest) -> TARAStrategyResponse:
    """Evaluates student's profile to determine RA vs TA viability, English instructional hurdles,
    tailored cold email pitch, and summer funding protection.
    """
    gpa_val = 3.5
    try:
        gpa_val = float(payload.gpa)
    except (ValueError, TypeError):
        gpa_val = 3.5

    # 1. Calculate RA Viability Score (Driven by research, coding, GPA, and degree goal)
    ra_score = 20  # baseline

    # Research Experience Weight (up to +40)
    exp_weights = {
        "peer_reviewed": 40,
        "preprint_workshop": 30,
        "thesis_only": 20,
        "none": 5,
    }
    ra_score += exp_weights.get(payload.research_experience, 15)

    # Coding / Technical Depth (up to +25)
    coding_weights = {"advanced": 25, "intermediate": 15, "beginner": 5}
    ra_score += coding_weights.get(payload.coding_depth, 10)

    # GPA Weight (up to +15)
    if gpa_val >= 3.8:
        ra_score += 15
    elif gpa_val >= 3.5:
        ra_score += 10
    else:
        ra_score += 5

    # Degree Goal: Direct PhD programs have larger multi-year RA grant allocations
    if payload.degree_goal == "PhD":
        ra_score += 10
    else:
        ra_score += 5

    # 2. Calculate TA Viability Score & Oral English Status (Driven by spoken English & department needs)
    ta_score = 25  # baseline
    speaking = payload.speaking_score
    test_type = payload.english_test_type.lower()
    country = payload.target_country.upper()

    oral_status = "cleared"
    oral_analysis = ""

    # Country-specific English hurdles for Teaching Assistantships
    if "USA" in country or "US" in country:
        is_toefl = "toefl" in test_type
        # USA state laws strictly regulate international TAs
        if (is_toefl and speaking >= 26.0) or (not is_toefl and speaking >= 8.0):
            oral_status = "cleared"
            ta_score += 45
            oral_analysis = (
                f"✅ Full Instructional Clearance: Your speaking score ({speaking}) satisfies strict US state "
                "mandates (TOEFL ≥26 / IELTS ≥8.0). You represent zero departmental liability, meaning the graduate "
                "committee can fund you immediately without provisional testing."
            )
        elif (is_toefl and speaking >= 23.0) or (not is_toefl and speaking >= 7.0):
            oral_status = "borderline"
            ta_score += 25
            oral_analysis = (
                f"⚠️ Provisional / Borderline Zone ({speaking}): You are eligible for graduate admission, but US "
                "state law requires you to pass an on-campus SPEAK test or ITA oral interview during orientation "
                "before teaching introductory recitation sections."
            )
        else:
            oral_status = "restricted_ra_only"
            ta_score = min(ta_score, 35)
            oral_analysis = (
                f"🚫 Direct TA Restriction ({speaking}): Most US R1 departments require TOEFL Speaking ≥23 or IELTS ≥7.0 "
                "for TA appointments. You should aggressively target Research Assistantships (RA) directly from professors' "
                "grants, which have no state instructional speaking mandates."
            )
    elif "CAN" in country:
        if ("toefl" in test_type and speaking >= 25.0) or ("ielts" in test_type and speaking >= 7.5):
            oral_status = "cleared"
            ta_score += 40
            oral_analysis = (
                f"✅ Canadian GTA Qualified: Your speaking score ({speaking}) meets U15 unionized Graduate Teaching Assistant "
                "(GTA) thresholds (typically $45-$52 CAD/hr)."
            )
        elif ("toefl" in test_type and speaking >= 22.0) or ("ielts" in test_type and speaking >= 6.5):
            oral_status = "borderline"
            ta_score += 25
            oral_analysis = (
                f"⚠️ Conditional TA Clearance ({speaking}): Eligible for grading/lab demonstating, but course lecturer "
                "roles may require department interview."
            )
        else:
            oral_status = "restricted_ra_only"
            ta_score = min(ta_score, 40)
            oral_analysis = (
                f"🚫 TA Restricted: Target a Research Assistantship (GRA) under a dedicated supervisor who will guarantee "
                "your minimum departmental stipend."
            )
    else:
        # Germany, Europe, Australia
        if speaking >= 7.0 or speaking >= 24.0:
            oral_status = "cleared"
            ta_score += 35
            oral_analysis = (
                f"✅ European/Australian Research Fellow & Tutor Ready: Qualified for international English-medium "
                "tutorial instruction and lab demonstrator posts."
            )
        else:
            oral_status = "borderline"
            ta_score += 20
            oral_analysis = "Target scientific research staff (HiWi/TV-L E13) positions where technical coding outweighs formal teaching."

    # GPA impact on TA (departments select top academic records to instruct undergrads)
    if gpa_val >= 3.75:
        ta_score += 20
    elif gpa_val >= 3.4:
        ta_score += 10

    # Clamp scores
    ra_score = max(15, min(96, ra_score))
    ta_score = max(15, min(96, ta_score))

    # Formulate Primary Strategic Recommendation
    if ra_score >= 75 and oral_status == "cleared":
        primary_rec = (
            "Dual-Track Advantage: You possess high eligibility for both RA and TA appointments. "
            "Strategy: Lead with your research alignment in cold emails to secure an RA. Explicitly highlight your "
            "cleared speaking score as a safety fallback—this signals to professors that if their grant is delayed, "
            "the department can easily support you on a TA line."
        )
    elif ra_score >= 65 and oral_status != "cleared":
        primary_rec = (
            "Direct RA Focused Route: Because instructional speaking regulations create friction for first-semester TAs, "
            "focus 100% of your energy on faculty research grants (RAs). Emphasize your coding, lab productivity, and thesis "
            "contributions where spoken English mandates do not apply."
        )
    elif ta_score >= 75 and ra_score < 65:
        primary_rec = (
            "Departmental TA Entry -> RA Transition: Your strong academic GPA and cleared speaking credentials make you a "
            "prime candidate for guaranteed departmental TA funding. Use the TA position to secure your visa and 100% tuition "
            "waiver in Semester 1, then transition into a funded research lab for Semester 2."
        )
    else:
        primary_rec = (
            "Hybrid Funding Portfolio: Apply to programs with centralized departmental funding guarantees (common in Canada and "
            "midwestern US R1 universities). Maintain active cold outreach to newer Assistant Professors who recently received "
            "CAREER or initial startup grants."
        )

    # Action Steps
    action_steps = [
        f"Target professors in {payload.target_country} whose recent papers (2024-2026) acknowledge active federal or industry grants.",
        (
            f"Highlight your {payload.coding_depth} technical competencies ({payload.undergrad_major}) in Paragraph 2 of your cold email."
            if payload.coding_depth != "beginner"
            else "Develop a public GitHub repository demonstrating implementations of papers from your target labs."
        ),
        (
            "Mention your oral English score in your outreach: 'I have achieved full instructional English clearance, enabling departmental TA appointment if advantageous.'"
            if oral_status == "cleared"
            else "Prepare for the university's internal SPEAK test during orientation week by practicing mock academic presentations."
        ),
        "Submit your institutional graduate application at least 3 weeks before the priority funding deadline (Dec 1 - Jan 15).",
    ]

    # Cold Pitch Paragraph
    if oral_status == "cleared":
        pitch_paragraph = (
            f"Having completed my {payload.undergrad_major} degree with a GPA of {gpa_val:.2f}/4.00, I bring strong hands-on "
            f"experience in {payload.research_experience.replace('_', ' ')}. Furthermore, I have secured an instructional "
            f"speaking score of {speaking:.1f} ({payload.english_test_type.upper()}), qualifying me for immediate departmental "
            f"Teaching Assistantship (TA) support alongside Research Assistantship (RA) grant funding."
        )
    else:
        pitch_paragraph = (
            f"With a strong foundation in {payload.undergrad_major} (GPA {gpa_val:.2f}/4.00) and dedicated work on my "
            f"undergraduate thesis, my primary objective is to contribute directly as a Graduate Research Assistant (RA) in your lab. "
            f"My technical background enables me to begin contributing to your group's active publications from day one."
        )

    # Summer Funding Strategy
    summer_strategy = (
        "⚠️ The Summer Funding Reality: Teaching Assistantships (TA) are typically 9-month appointments (Aug–May), leaving June–August "
        "unfunded. Solution: (1) Request a Summer Research Assistantship buyout from your advisor using grant funds, (2) Apply for "
        "Curricular Practical Training (CPT) industry research internships ($7,000–$12,000/mo in US tech/biotech), or (3) Apply for summer term teaching."
    )

    negotiation_tip = (
        "Negotiation Formula: If an institution offers you an admission without funding or with partial tuition waiver, write to your prospective PI: "
        "'I am honored by the offer from [University]. Given my research fit with your recent work on [Topic], could we explore a 20-hour/week RA appointment "
        "or departmental TA nomination that would allow me to accept immediately?'"
    )

    return TARAStrategyResponse(
        ra_viability_score=ra_score,
        ta_viability_score=ta_score,
        primary_recommendation=primary_rec,
        oral_english_status=oral_status,
        oral_english_analysis=oral_analysis,
        action_steps=action_steps,
        cold_pitch_paragraph=pitch_paragraph,
        summer_funding_strategy=summer_strategy,
        negotiation_tip=negotiation_tip,
        model_used="Ethos Academic Strategy Heuristic v3.0",
    )


def ask_tara_advisor(payload: TARAAdvisorQuestionRequest) -> TARAAdvisorQuestionResponse:
    """Answers specific student questions on graduate assistantships, stipends, and policies."""
    q_lower = payload.question.lower().strip()

    KNOWLEDGE_BASE: list[dict[str, Any]] = [
        {
            "triggers": ["ms", "master", "master's", "phd only", "can ms get"],
            "answer": (
                "**Can Master's students get full RA or TA funding?**\n\n"
                "**Yes, but with crucial distinctions by country:**\n\n"
                "- **Canada (U15)**: Thesis Master's (M.Sc. / M.A.Sc.) students are almost **always funded** ($22,000–$32,000 CAD/yr). In fact, most Canadian departments will not admit you unless a supervisor guarantees this minimum stipend package.\n"
                "- **USA (R1 Universities)**: Direct PhD applicants are given first priority for departmental funding packages (5-year guarantees). However, MS thesis students frequently secure RAs directly from individual faculty grants or pick up unfilled TA positions in their second semester.\n"
                "- **Germany**: Master's tuition is nearly free (€0–€350/sem). Students fund their living expenses through **HiWi** (Student Research Assistant, 10–20 hrs/week at €13–€17/hr) or working student positions."
            ),
            "takeaway": "In Canada and Germany, MS funding is standard. In the US, apply directly to PhD if funding is mandatory, or secure an RA professor commitment before enrolling.",
            "followups": [
                "How does Canadian supervisor funding differ from US admissions?",
                "What is the hourly rate for HiWi student jobs in Germany?",
            ],
        },
        {
            "triggers": ["lose grant", "grant ends", "professor loses", "funding runs out"],
            "answer": (
                "**What happens to your tuition waiver if your advisor loses their research grant?**\n\n"
                "In almost all US and Canadian graduate programs, if a professor's research grant concludes:\n\n"
                "1. **Departmental Safety Net**: The academic department steps in to transition you to a **Graduate Teaching Assistantship (GTA)** to preserve your 100% tuition remission and monthly paycheck.\n"
                "2. **Departmental Bridge Funding**: Most institutions maintain reserve endowment funds to bridge PhD candidates in good standing for 1–2 semesters.\n"
                "3. **Co-Advising**: You can form a joint committee with a co-advisor whose lab has active grant allocations."
            ),
            "takeaway": "You are never expelled immediately if a grant expires; academic departments almost universally transition funded students to TA lines.",
            "followups": [
                "Does my tuition waiver remain intact when switching from RA to TA?",
                "How do I request departmental bridge funding?",
            ],
        },
        {
            "triggers": ["both", "ta and ra", "40 hours", "simultaneously", "at the same time"],
            "answer": (
                "**Can you work as both an RA and a TA at the same time?**\n\n"
                "**No, with very strict visa and policy limits:**\n\n"
                "- **F-1 Visa (USA) & Study Permit (Canada)**: International students are legally restricted to a maximum of **20 hours per week** of on-campus employment during active fall/spring academic semesters.\n"
                "- A standard full assistantship (Full RA or Full TA) is already formally designated as a 20-hour appointment (0.50 FTE), which confers 100% tuition remission.\n"
                "- However, some departments allow a **Split Appointment** (e.g. 10 hours TA + 10 hours RA) if co-funded by the department and a lab."
            ),
            "takeaway": "F-1 visa regulations cap semester on-campus work at 20 hours/week. A full 20-hour assistantship already grants 100% tuition remission.",
            "followups": [
                "Can international students work off-campus on F-1 visas?",
                "How do split 10h RA + 10h TA appointments work?",
            ],
        },
        {
            "triggers": ["negotiate", "unfunded", "partial", "ask for more", "stipend increase"],
            "answer": (
                "**How to negotiate funding if you received an unfunded or partial admission offer:**\n\n"
                "1. **Never send an aggressive demand**: Frame your letter around research output and lab throughput.\n"
                "2. **Contact the Faculty Member, not the admissions clerk**: Write directly to the professor whose lab aligns with your skills: *'I have been officially admitted to the Graduate Program for Fall 2026. Because my thesis directly addressed [Methodology], I would love to explore whether your lab has an RA opening to support my enrollment.'*\n"
                "3. **Leverage Other Offers**: If University B offered you a full funding package, write to University A: *'University A remains my top choice due to your research on [X]. However, I have received a full graduate assistantship from [University B]. Is there any departmental TA or RA consideration that would make joining your group feasible?'*"
            ),
            "takeaway": "Always negotiate with individual PIs using research fit or competing offers, rather than the central admissions office.",
            "followups": [
                "What is the exact email template to negotiate with a professor?",
                "When is the deadline to accept or decline graduate offers?",
            ],
        },
        {
            "triggers": ["ielts 6.5", "speaking 6.5", "low speaking", "toefl 22", "bad speaking"],
            "answer": (
                "**What if your IELTS speaking is 6.5 or TOEFL speaking is <23?**\n\n"
                "1. **Aggressively Target RA instead of TA**: Research Assistantships are funded by grant PIs and do **not** carry state oral instructional mandates. PIs care about whether your code compiles and your experiments run, not whether you can teach freshman calculus.\n"
                "2. **Target Canada & Europe**: Canadian universities typically set their TA speaking baseline at 6.5 or 7.0, significantly more accessible than the US R1 cutoff of 8.0/26.\n"
                "3. **Plan for the On-Campus SPEAK Test**: If admitted with a provisional TA, you will take an on-campus oral exam. Practicing academic terminology and mock grading usually helps students pass."
            ),
            "takeaway": "Low speaking scores do NOT block RA funding; professors' research grants have no oral English mandates.",
            "followups": [
                "Which US universities accept IELTS 6.5 for graduate admission?",
                "How does the on-campus SPEAK test work?",
            ],
        },
    ]

    # Search for matching knowledge item
    for item in KNOWLEDGE_BASE:
        if any(trig in q_lower for trig in item["triggers"]):
            return TARAAdvisorQuestionResponse(
                answer=item["answer"],
                key_takeaway=item["takeaway"],
                suggested_followups=item["followups"],
                model_used="Ethos Academic Advisor Engine",
            )

    # General Fallback Resolution
    return TARAAdvisorQuestionResponse(
        answer=(
            f"**Regarding your question: \"{payload.question}\"**\n\n"
            "In academic graduate admissions across North America and Europe, assistantships represent an employment contract "
            "where your tuition is waived (100% covered) in exchange for 20 hours/week of teaching (TA) or lab research (RA).\n\n"
            "Key strategic rules:\n"
            "1. **RAs are distributed by individual professors**: Focus on reading recent preprints and demonstrating technical alignment.\n"
            "2. **TAs are distributed by the department committee**: Top undergraduate GPAs and strong spoken English scores are prioritized.\n"
            "3. **Deadline discipline**: Full funding consideration almost universally closes between **December 1 and January 15** for Fall entry."
        ),
        key_takeaway="RAs come from professors' grants; TAs come from the academic department. Priority funding deadlines are Dec 1 – Jan 15.",
        suggested_followups=[
            "Can Master's students get full RA or TA funding?",
            "What if my IELTS speaking is 6.5?",
            "How do I negotiate an RA offer with a professor?",
        ],
        model_used="Ethos Academic Advisor Engine",
    )
