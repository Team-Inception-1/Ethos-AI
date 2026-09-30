"""Durability/concurrency checks run only against an explicitly supplied test DB.

CI must migrate its disposable PostgreSQL database, then set TEST_DATABASE_URL.
These tests never read DATABASE_URL or connect to a developer's live database.
"""
import os
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest

from app.services.agency_risk_store import PostgresAgencyRiskStore


@pytest.fixture
def risk_database():
    url = os.environ.get('TEST_DATABASE_URL')
    if not url:
        pytest.skip('TEST_DATABASE_URL must point to a migrated disposable database')
    import psycopg
    agency = 'test-risk-' + str(uuid4())
    yield url, agency
    with psycopg.connect(url) as connection:
        connection.execute('DELETE FROM "AgencyRiskState" WHERE "agencyId" = %s', (agency,))


def test_risk_survives_new_store_and_parallel_writers(risk_database):
    url, agency = risk_database

    def record(_):
        return PostgresAgencyRiskStore(url).record_event(agency, 'complaint', 80, 'Offline integration test')

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(record, range(12)))
    score = PostgresAgencyRiskStore(url).get_score(agency)
    assert score.flag_count == 12
    assert len(score.recent_events) == 12
    assert score.risk_score == round(80 * (1 - 0.65 ** 12), 2)


def test_failed_event_insert_rolls_back_state(risk_database):
    url, agency = risk_database
    store = PostgresAgencyRiskStore(url)
    store.record_event(agency, 'complaint', 50, 'Initial event')
    # PostgreSQL text columns reject NUL bytes; the state update must roll back.
    with pytest.raises(Exception):
        store.record_event(agency, 'complaint', 100, 'Invalid\x00event')
    score = PostgresAgencyRiskStore(url).get_score(agency)
    assert score.flag_count == 1
    assert score.risk_score == 17.5
