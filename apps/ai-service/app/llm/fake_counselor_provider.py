"""
Offline, deterministic mock implementation of `CounselorLLM`.

Handles English and Bangla queries deterministically for testing, development,
and CI environments where live LLM API keys are not provided.
"""
from __future__ import annotations

import re
from typing import Tuple

from app.schemas import CounselorChatMessage, CounselorEvaluationRequest
from .counselor_base import CounselorLLM


def is_bangla_text(text: str) -> bool:
    """Detects if text contains Bengali Unicode characters (\u0980-\u09FF)."""
    return bool(re.search(r"[\u0980-\u09FF]", text))


class FakeCounselorProvider(CounselorLLM):
    name: str = "fake_counselor"

    async def chat(
        self,
        messages: list[CounselorChatMessage],
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "auto",
    ) -> tuple[str, list[str], str, list[dict] | None]:
        if not messages:
            return (
                "Hello! I am your Ethos AI Study-Abroad Counselor. How can I assist your study plans today?",
                ["How much bank balance do I need for Germany?", "Can I apply with a 2-year study gap?"],
                "en",
                None,
            )

        last_user_msg = ""
        for m in reversed(messages):
            if m.role.value == "user":
                last_user_msg = m.content
                break

        # Determine language
        bangla_check = is_bangla_text(last_user_msg)
        detected_lang = "bn" if (language == "bn" or bangla_check) else "en"
        print(f"DEBUG: last_user_msg={repr(last_user_msg)}, language={repr(language)}, bangla_check={bangla_check}, detected_lang={detected_lang}")
        query_lower = last_user_msg.lower()

        # Context snippets
        gpa_str = f"{profile_context.gpa}/{profile_context.max_gpa}" if profile_context else "3.2/4.0"
        budget_str = f"৳{profile_context.budget_yearly_bdt_lakh} Lakh" if profile_context else "৳20 Lakh"
        gap_years = profile_context.study_gap_years if profile_context else 0

        # Deterministic responses
        if detected_lang == "bn":
            if any(k in query_lower or k in last_user_msg for k in ["জার্মানি", "germany", "ব্লকড", "blocked"]):
                reply = (
                    f"জার্মানিতে পাবলিক বিশ্ববিদ্যালয়ে সাধারণত কোনো টিউশন ফি নেই (শুধু সেমিস্টার ফি প্রায় €২৫০-€৪০০)। "
                    f"তবে ভিসা পাওয়ার জন্য বাধ্যতামূলকভাবে একটি ব্লকড অ্যাকাউন্ট খুলতে হবে, যেখানে €১১,৯০৪ ইউরো (প্রায় ১৬.৫ লাখ টাকা) "
                    f"জমা রাখতে হয়। আপনার বর্তমান বাজেট {budget_str} দিয়ে জার্মানি একটি চমৎকার ও সাশ্রয়ী বিকল্প।"
                )
                suggestions = [
                    "জার্মানিতে ইংরেজি মাধ্যমে কি কি কোর্স আছে?",
                    "আইইএলটিএস ছাড়া জার্মানিতে আবেদন করা সম্ভব?",
                    "ভিএফএস ঢাকা অ্যাপয়েন্টমেন্ট পেতে কত সময় লাগে?",
                ]
            elif any(k in query_lower or k in last_user_msg for k in ["গ্যাপ", "gap", "স্টাডি গ্যাপ"]):
                reply = (
                    f"আপনার বর্তমান প্রোফাইলে {gap_years} বছরের স্টাডি গ্যাপ রয়েছে। "
                    f"যুক্তরাজ্য, যুক্তরাষ্ট্র এবং মালয়েশিয়ায় চাকরির অভিজ্ঞতা (নিয়োগপত্র, পে-স্লিপ, ট্যাক্স ডকুমেন্ট) থাকলে ২-৫ বছরের গ্যাপ "
                    f"সহজেই গ্রহণ করে। তবে কোনো অবস্থাতেই এজেন্সির পরামর্শে জাল বা ভুয়া এক্সপেরিয়েন্স সার্টিফিকেট বানাবেন না; "
                    f"বরং আসল অভিজ্ঞতা কীভাবে আপনার ভবিষ্যৎ কোর্সের সাথে সম্পর্কিত তা স্টেটমেন্ট অফ পারপাসে (SOP) পরিষ্কারভাবে উপস্থাপন করুন।"
                )
                suggestions = [
                    "যুক্তরাজ্যে কোন বিশ্ববিদ্যালয়গুলো স্টাডি গ্যাপ গ্রহণ করে?",
                    "স্টাডি গ্যাপ জাস্টিফাই করতে কি কি ডকুমেন্ট লাগবে?",
                    "ভিসা ইন্টারভিউতে স্টাডি গ্যাপ নিয়ে কি প্রশ্ন করা হয়?",
                ]
            elif any(k in query_lower or k in last_user_msg for k in ["ব্যাংক", "টাকা", "সলভেন্সি", "খরচ", "solvency", "bank"]):
                reply = (
                    f"ভিসা প্রসেসিংয়ের ক্ষেত্রে ব্যাংক সলভেন্সি অত্যন্ত গুরুত্বপূর্ণ। "
                    f"যুক্তরাজ্যের জন্য প্রায় ২৮-৩০ লাখ টাকা একটানা ২৮ দিন ব্যাংকে রাখতে হয়। "
                    f"যুক্তরাষ্ট্রের জন্য I-20 তে উল্লেখিত সম্পূর্ণ ১ বছরের টিউশন ও লিভিং কস্ট (প্রায় ৩৫-৪০ লাখ টাকা) দেখাতে হবে। "
                    f"সবসময় প্রথম রক্তের আত্মীয় (পিতা/মাতা) কে স্পন্সর হিসেবে রাখুন এবং তাদের আয়কর নথিপত্র হালনাগাদ রাখুন।"
                )
                suggestions = [
                    "কোন ব্যাংকগুলোর স্টেটমেন্ট অ্যাম্বাসি অনুমোদন করে?",
                    "পিতা-মাতা ছাড়া অন্য কেউ কি স্পন্সর হতে পারবে?",
                    "স্টুডেন্ট ফাইল খোলার নিয়ম কি?",
                ]
            else:
                reply = (
                    f"ধন্যবাদ আপনার প্রশ্নের জন্য। আপনার একাডেমিক ফলাফল (GPA {gpa_str}) এবং বাজেট ({budget_str}) অনুযায়ী "
                    f"আমরা আপনার জন্য ড্রিম, টার্গেট এবং সেফ ইউনিভার্সিটির তালিকা প্রস্তুত করেছি। "
                    f"মনে রাখবেন, কোনো কনসালটেন্সি এজেন্সির '১০০% ভিসা গ্যারান্টি' বা 'অফার লেটার কনফার্ম' জাতীয় কথায় প্রতারিত হবেন না। "
                    f"ইথোস এআই সব সময় নিরপেক্ষ তথ্য দিয়ে আপনার পাশে আছে।"
                )
                suggestions = [
                    "আমার বাজেটের মধ্যে সবচেয়ে ভালো দেশ কোনটি?",
                    "স্কলারশিপ পাওয়ার জন্য কি কি প্রস্তুতি নিতে হবে?",
                    "ভিসা রিজেকশনের প্রধান কারণগুলো কি কি?",
                ]
        else:
            # English responses
            if any(k in query_lower for k in ["germany", "blocked account", "tuition"]):
                reply = (
                    f"In Germany, almost all public universities charge zero tuition fees (only a nominal semester contribution of €250–€400). "
                    f"However, to obtain your national student visa, you must deposit €11,904 EUR (~৳16.5 Lakh BDT) into an authorized Blocked Account "
                    f"(such as Fintiba, Expatrio, or Coracle). Based on your annual budget of {budget_str}, Germany offers a very high return on investment."
                )
                suggestions = [
                    "Which German universities offer English-taught master's?",
                    "What is the current German visa appointment wait time in Dhaka?",
                    "Can I work part-time while studying in Germany?",
                ]
            elif any(k in query_lower for k in ["gap", "study gap"]):
                reply = (
                    f"Regarding study gaps: having a gap of {gap_years} years is manageable if you provide genuine documentation. "
                    f"Countries like the UK, USA, and Malaysia are open to gaps of 2 to 5 years when backed by bona fide employment records, "
                    f"appointment letters, and bank salary slips. Never resort to forged employment letters from dishonest consultancies; "
                    f"visa officers conduct strict background checks and will issue 5-to-10 year bans for fraudulent papers."
                )
                suggestions = [
                    "How do I explain a study gap in my Statement of Purpose?",
                    "Which UK universities accept up to 5 years study gap?",
                    "Does Canada accept study gaps for post-graduate diplomas?",
                ]
            elif any(k in query_lower for k in ["bank", "solvency", "funds", "cost", "budget"]):
                reply = (
                    f"Proof of financial solvency is a critical component of your visa file. "
                    f"For the UK, you must satisfy the 28-day continuous holding rule (tuition balance + 9 months living costs = ~৳28 Lakh BDT). "
                    f"For the USA, you need to prove available liquid funds for the first year of the I-20 (~৳35-40 Lakh BDT). "
                    f"Always maintain funds in schedule A commercial banks under your parents' names with verifiable tax returns."
                )
                suggestions = [
                    "Which banks are approved for UK and Canada visa in Bangladesh?",
                    "How do I open a student file for foreign remittance?",
                    "Can elder brother or uncle sponsor my overseas education?",
                ]
            else:
                reply = (
                    f"Based on your profile (GPA {gpa_str}, Budget: {budget_str}), "
                    f"you have strong prospects for higher education abroad. "
                    f"I recommend maintaining a balanced portfolio of Dream, Target, and Safe institutions. "
                    f"Avoid agencies offering '100% visa guarantees' or unverified backchannel promises — "
                    f"Ethos AI ensures all steps are transparent, verified, and milestone-tracked."
                )
                suggestions = [
                    "What are the best scholarship opportunities for Bangladeshi students?",
                    "How early should I start applying for Fall 2026 intake?",
                    "What documents are needed to verify an offer letter?",
                ]

        return reply, suggestions, detected_lang, None

    async def audit_sop(
        self,
        sop_text: str,
        target_university: str | None = None,
        target_country: str | None = None,
        target_program: str | None = None,
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "en",
    ) -> dict:
        """Deterministic offline SOP audit for testing."""
        # Detect some basic clichés
        cliche_phrases = [
            "since childhood", "from a young age", "passionate about",
            "globalized world", "give back to my country", "esteemed university",
            "broaden my horizons", "dream of mine", "always wanted to",
        ]
        sop_lower = sop_text.lower()
        found_cliches = [p for p in cliche_phrases if p in sop_lower]
        cliche_count = len(found_cliches)

        findings = []
        for phrase in found_cliches:
            findings.append({
                "category": "cliche",
                "severity": "warning",
                "quote": phrase,
                "issue": f"The phrase '{phrase}' is overused in SOPs and weakens your narrative.",
                "suggestion": f"Replace '{phrase}' with a specific, personal anecdote or concrete example.",
                "paragraph_ref": None,
            })

        # Check university alignment
        uni_score = 30
        if target_university and target_university.lower() in sop_lower:
            uni_score = 70
            findings.append({
                "category": "university_alignment",
                "severity": "info",
                "quote": target_university,
                "issue": "Good — you mention the target university by name.",
                "suggestion": "Strengthen by mentioning specific professors, labs, or unique programs.",
                "paragraph_ref": None,
            })
        else:
            findings.append({
                "category": "university_alignment",
                "severity": "danger",
                "quote": "(no mention found)",
                "issue": "Your SOP does not mention the target university by name.",
                "suggestion": f"Add specific references to {target_university or 'your target university'}'s programs, faculty, or research.",
                "paragraph_ref": None,
            })

        # Visa intent check
        visa_keywords = ["return", "bangladesh", "family", "career back", "contribute", "home country"]
        visa_hits = sum(1 for k in visa_keywords if k in sop_lower)
        visa_score = min(100, visa_hits * 20 + 10)

        if visa_hits < 2:
            findings.append({
                "category": "visa_intent",
                "severity": "warning",
                "quote": "(insufficient homeland ties)",
                "issue": "Your SOP lacks clear statements about returning to Bangladesh after studies.",
                "suggestion": "Add a paragraph about your post-study career plans in Bangladesh, family ties, or community contributions.",
                "paragraph_ref": None,
            })

        overall = max(0, min(100, 80 - cliche_count * 10 + (visa_score // 5) + (uni_score // 5)))
        verdict = "strong" if overall >= 70 else ("needs_work" if overall >= 45 else "weak")

        return {
            "overall_score": overall,
            "verdict": verdict,
            "findings": findings,
            "cliche_count": cliche_count,
            "visa_intent_score": visa_score,
            "university_alignment_score": uni_score,
            "summary": f"Your SOP scores {overall}/100. {'Strong narrative with good specifics.' if overall >= 70 else 'Needs improvement — reduce clichés and add university-specific details.'}",
            "improved_excerpt": None,
            "model_used": self.name,
        }
