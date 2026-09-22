"""
Ethos AI microservice entrypoint (FastAPI).

Isolated from the Node.js core API per ETHOS_AI_CONTEXT.md §10 — the Node
core API talks to this service over internal REST; it never calls
Tesseract/LLM providers directly.

Run locally:
    uvicorn app.main:app --reload --port 8001

This module mounts the Agreement Analyzer router (#16) and the Scam Alert
router (#23). The OCR fraud-detection router (#22) will be added as a
sibling router under the same `/api/ai` prefix by its owner — see
docs/KANBAN.md for ownership.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.agreement import router as agreement_router
from app.routers.counselor import router as counselor_router
from app.routers.offer_letter import router as offer_letter_router
from app.routers.scam import router as scam_router
from app.routers.scholar_finder import router as scholar_finder_router
from app.schemas import HealthResponse
from app.services.agency_risk_store import get_agency_risk_store
from app.services.seed_demo_risk_events import seed_demo_risk_events

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort demo seeding for the Directory UI (#25) — see
    # app/services/seed_demo_risk_events.py for rationale. Failures here must
    # never prevent the service from starting.
    try:
        await seed_demo_risk_events(get_agency_risk_store())
    except Exception:  # pragma: no cover - best-effort demo seeding only
        logger.exception("Demo risk-event seeding failed at startup; continuing without it")
    yield


app = FastAPI(
    title="Ethos AI — AI Microservice",
    description="FastAPI microservice for OCR fraud detection, agreement analysis, "
    "scam alerts, and the AI Counselor (see ETHOS_AI_CONTEXT.md §5.8-5.11, 5.18).",
    version="0.1.0",
    lifespan=lifespan,
)

# Permissive by default for local dev; tighten `allow_origins` to the deployed
# web app's origin(s) via env/config before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agreement_router)
app.include_router(offer_letter_router)
app.include_router(scam_router)
app.include_router(counselor_router)
app.include_router(scholar_finder_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        llm_configured=settings.llm_configured,
    )
