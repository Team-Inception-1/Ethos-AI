"""
One-shot live smoke test for GeminiAgreementLLM.

Run in CI (or locally) with a real GEMINI_API_KEY set to confirm the actual
Gemini call works end-to-end — separate from the offline pytest suite, which
only exercises FakeAgreementLLM.

Intentionally prints ONLY pass/fail + a small structural summary (clause
count, clause types found) — never the raw API key, and never the full
LLM response text — so this is safe to run in a CI log.

Usage:
    export GEMINI_API_KEY=...
    python3 scripts/smoke_test_gemini.py
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.llm.gemini_provider import GeminiAgreementLLM  # noqa: E402
from app.llm.base import LLMError  # noqa: E402

SAMPLE_AGREEMENT = """
SERVICE AGREEMENT

This agreement is between Bright Future Consultancy ("the Agency") and the Student.

1. FEES: The total service fee for this application package is Tk 65,000, payable in
two installments.

2. In addition, a documentation charge of Tk 5,000 will apply per submitted application.

3. REFUND POLICY: A partial refund may be issued at the Agency's discretion, subject to
a reasonable processing fee, if the Student withdraws the application.

4. CANCELLATION: Either party may terminate this agreement with 14 days written notice.

5. LIABILITY: The Agency is not liable for visa rejection caused by incomplete or false
information provided by the Student.
"""


async def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("SKIP: GEMINI_API_KEY not set in this environment.")
        return 0

    model = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
    llm = GeminiAgreementLLM(api_key=api_key, model=model)

    print(f"Calling live Gemini API (model={model})...")
    try:
        clauses = await llm.extract_clauses(SAMPLE_AGREEMENT)
    except LLMError as exc:
        print(f"FAIL: Gemini call raised LLMError: {exc}")
        return 1
    except Exception as exc:  # pragma: no cover
        print(f"FAIL: unexpected error: {exc}")
        return 1

    if not clauses:
        print("FAIL: Gemini call succeeded but returned zero clauses (expected several).")
        return 1

    found_types = sorted({c.clause_type.value for c in clauses})
    print(f"PASS: received {len(clauses)} clause(s). Types found: {found_types}")

    expected_types = {"fee", "refund", "cancellation", "liability"}
    missing = expected_types - set(found_types)
    if missing:
        print(f"WARN: expected clause types not found: {sorted(missing)} (non-fatal)")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
