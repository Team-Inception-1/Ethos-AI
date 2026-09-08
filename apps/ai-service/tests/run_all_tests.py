"""
Offline test runner to execute all unit and API tests in environments without pytest installed.
"""
from __future__ import annotations

import asyncio
import inspect
import sys
import traceback
from pathlib import Path

# Add root of ai-service to path
SERVICE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVICE_ROOT))

import tests.conftest  # setup pytest and environment shims
import app.main  # load app and shim
from fastapi.testclient import TestClient
from app.llm.fake_provider import FakeAgreementLLM
from app.llm.fake_scam_provider import FakeScamLLM
from app.services.agreement_analysis import AgreementAnalysisService
from app.services.scam_classifier import ScamClassifierService
from app.services.agency_risk_store import AgencyRiskStore
from app.services.offer_letter_fraud import OfferLetterFraudDetector
from app.config import Settings


def get_fixtures() -> dict:
    fake_llm = FakeAgreementLLM()
    fake_scam = FakeScamLLM()
    return {
        "fake_llm": fake_llm,
        "fake_scam_llm": fake_scam,
        "analysis_service": AgreementAnalysisService(llm=fake_llm),
        "scam_classifier_service": ScamClassifierService(llm=fake_scam),
        "detector": OfferLetterFraudDetector(),
        "client": TestClient(app.main.app),
        "settings_no_key": Settings(gemini_api_key=None),
        "settings_with_key": Settings(gemini_api_key="dummy-key-for-tests", gemini_model="gemini-3.6-flash"),
    }


def run_test_module(mod_name: str) -> tuple[int, int, list[str]]:
    mod = __import__(f"tests.{mod_name}", fromlist=["*"])
    fixtures = get_fixtures()
    passed = 0
    failed = 0
    errors: list[str] = []

    for attr in dir(mod):
        if attr.startswith("test_"):
            func = getattr(mod, attr)
            if callable(func):
                sig = inspect.signature(func)
                kwargs = {}
                for param in sig.parameters:
                    if param in fixtures:
                        kwargs[param] = fixtures[param]

                try:
                    if inspect.iscoroutinefunction(func):
                        asyncio.run(func(**kwargs))
                    else:
                        func(**kwargs)
                    passed += 1
                    print(f"  [PASS] {mod_name}.{attr}")
                except Exception as exc:
                    failed += 1
                    err_msg = f"  [FAIL] {mod_name}.{attr}: {exc}\n{traceback.format_exc()}"
                    errors.append(err_msg)
                    print(err_msg)

    return passed, failed, errors


def main() -> int:
    test_modules = [
        "test_offer_letter_analysis",
        "test_offer_letter_api",
        "test_text_extraction",
        "test_scam_rules",
        "test_scam_classifier",
        "test_scam_api",
        "test_agreement_analysis",
        "test_agency_risk_store",
        "test_api",
        "test_llm_factory",
        "test_scam_llm_factory",
    ]

    total_passed = 0
    total_failed = 0
    all_errors: list[str] = []

    print("=" * 60)
    print("RUNNING ALL ETHOS AI TEST SUITES")
    print("=" * 60)

    for mod in test_modules:
        print(f"\n--- Testing module: {mod} ---")
        p, f, errs = run_test_module(mod)
        total_passed += p
        total_failed += f
        all_errors.extend(errs)

    print("\n" + "=" * 60)
    print(f"TEST SUMMARY: {total_passed} PASSED, {total_failed} FAILED")
    print("=" * 60)

    if all_errors:
        print("\nFailures:")
        for e in all_errors:
            print(e)
        return 1

    print("\nALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
