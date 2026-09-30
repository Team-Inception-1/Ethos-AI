from __future__ import annotations

import sys
import os
from pathlib import Path

# Force offline test configuration before app imports, even on developer machines.
os.environ["ENVIRONMENT"] = "test"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GOOGLE_API_KEY"] = ""
os.environ["GOOGLE_VISION_API_KEY"] = ""
os.environ["DATABASE_URL"] = ""
os.environ["OFFLINE_DEMO"] = "false"
os.environ["AI_SERVICE_API_TOKEN"] = "offline-test-token"

# Allow `import app...` when pytest is run from apps/ai-service/ without
# installing the package (keeps things simple for a course project).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import pytest
except ModuleNotFoundError:  # pragma: no cover
    import sys
    from typing import Any

    class _MarkShim:
        def __getattr__(self, name: str) -> Any:
            def _marker(*args: Any, **kwargs: Any) -> Any:
                if len(args) == 1 and callable(args[0]) and not kwargs:
                    return args[0]
                return lambda f: f
            return _marker

    class _PytestShim:
        mark = _MarkShim()

        @staticmethod
        def fixture(func: Any = None, autouse: bool = False) -> Any:
            if func is None:
                return lambda f: f
            return func

        class raises:
            def __init__(self, expected_exception: type[BaseException]) -> None:
                self.expected = expected_exception

            def __enter__(self) -> _PytestShim.raises:
                return self

            def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> bool:
                if exc_type is None or not issubclass(exc_type, self.expected):
                    raise AssertionError(f"Expected exception {self.expected}, but got {exc_type}")
                return True

    pytest = _PytestShim()  # type: ignore[assignment]
    sys.modules["pytest"] = pytest  # type: ignore[assignment]

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
