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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.agreement import router as agreement_router
from app.routers.scam import router as scam_router
from app.schemas import HealthResponse

settings = get_settings()

app = FastAPI(
    title="Ethos AI — AI Microservice",
    description="FastAPI microservice for OCR fraud detection, agreement analysis, "
    "scam alerts, and the AI Counselor (see ETHOS_AI_CONTEXT.md §5.8-5.11, 5.18).",
    version="0.1.0",
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
app.include_router(scam_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        llm_configured=settings.llm_configured,
    )
