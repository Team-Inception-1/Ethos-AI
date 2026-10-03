from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.config import Settings, get_settings
from app.llm.factory import get_agreement_llm
from app.llm.scam_factory import get_scam_llm
from app.llm.counselor_factory import get_counselor_llm
from app.services.agency_risk_store import PostgresAgencyRiskStore


def test_service_authentication_required():
    client = TestClient(app)
    assert client.get('/health').status_code == 200
    assert client.get('/api/ai/counselor/countries').status_code == 401
    assert client.get('/api/ai/counselor/countries', headers={'Authorization': 'Bearer wrong'}).status_code == 401


def test_missing_token_fails_closed(monkeypatch):
    monkeypatch.setattr(get_settings(), 'ai_service_api_token', None)
    assert TestClient(app).get('/api/ai/counselor/countries').status_code == 503


def test_request_limits_and_cors():
    client = TestClient(app, headers={'Authorization': 'Bearer offline-test-token'})
    result = client.post('/api/ai/analyze-agreement/text', json={'agreement_text': 'x' * 100_001})
    assert result.status_code == 422
    result = client.post('/api/ai/analyze-agreement/text', content=b'x' * (1024 * 1024 + 1))
    assert result.status_code == 413
    result = client.get('/api/ai/counselor/countries', headers={'Origin': 'https://attacker.test'})
    assert 'access-control-allow-origin' not in result.headers


@pytest.mark.parametrize('factory', [get_agreement_llm, get_scam_llm, get_counselor_llm])
def test_missing_production_provider_never_returns_fake(factory):
    with pytest.raises(HTTPException) as error:
        factory(Settings(environment='production', offline_demo=False, gemini_api_key=None))
    assert error.value.status_code == 503


def test_seeded_scholar_data_requires_explicit_demo(monkeypatch):
    monkeypatch.setattr(get_settings(), 'environment', 'production')
    client = TestClient(app, headers={'Authorization': 'Bearer offline-test-token'})
    assert client.post('/api/ai/scholar/search', json={}).status_code == 503


def test_product_funding_guide_is_available_in_production(monkeypatch):
    monkeypatch.setattr(get_settings(), 'environment', 'production')
    client = TestClient(app, headers={'Authorization': 'Bearer offline-test-token'})
    assert client.get('/api/ai/scholar/guide').status_code == 200


def test_storage_failure_never_returns_clean_risk_score():
    def unavailable(*args, **kwargs):
        raise OSError('private connection details')
    store = PostgresAgencyRiskStore('unused', connect=unavailable)
    with pytest.raises(HTTPException) as error:
        store.get_score('agency')
    assert error.value.status_code == 503
    assert 'private' not in error.value.detail
