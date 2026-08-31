from __future__ import annotations

import sys
from pathlib import Path

# Allow `import app...` when pytest is run from apps/ai-service/ without
# installing the package (keeps things simple for a course project).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from app.config import Settings
from app.llm.fake_provider import FakeAgreementLLM
from app.llm.fake_scam_provider import FakeScamLLM
from app.services.agreement_analysis import AgreementAnalysisService
from app.services.scam_classifier import ScamClassifierService

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def load_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text(encoding="utf-8")


@pytest.fixture
def fake_llm() -> FakeAgreementLLM:
    return FakeAgreementLLM()


@pytest.fixture
def analysis_service(fake_llm: FakeAgreementLLM) -> AgreementAnalysisService:
    return AgreementAnalysisService(llm=fake_llm)


@pytest.fixture
def settings_no_key() -> Settings:
    return Settings(gemini_api_key=None)


@pytest.fixture
def settings_with_key() -> Settings:
    return Settings(gemini_api_key="dummy-key-for-tests", gemini_model="gemini-3.6-flash")


@pytest.fixture
def fake_scam_llm() -> FakeScamLLM:
    return FakeScamLLM()


@pytest.fixture
def scam_classifier_service(fake_scam_llm: FakeScamLLM) -> ScamClassifierService:
    return ScamClassifierService(llm=fake_scam_llm)
