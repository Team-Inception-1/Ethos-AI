"""
Runtime configuration for the Ethos AI microservice.

All AI/LLM provider keys are read from environment variables ONLY.
Never hardcode a key here or anywhere else in this service — see
ETHOS_AI_CONTEXT.md §7 (Security) and §10 (Instructions to the Coding Agent).

Local dev: copy `.env.example` to `.env` and fill in your own key.
CI/Prod:   set `GEMINI_API_KEY` as a GitHub Actions / deployment secret.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- LLM provider -------------------------------------------------
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-flash-latest"

    # --- OCR / Vision provider (Optional fallback) ---------------------
    google_vision_api_key: str | None = None

    # --- Service metadata ----------------------------------------------
    service_name: str = "ethos-ai-service"
    environment: str = "development"
    ai_service_api_token: str | None = None
    ai_allowed_origins: list[str] = []
    offline_demo: bool = False
    database_url: str | None = None
    max_json_bytes: int = 1024 * 1024

    # --- Upload limits ---------------------------------------------------
    max_upload_bytes: int = 20 * 1024 * 1024  # 20 MB, matches AIToolsPage upload hint

    @property
    def llm_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def google_vision_configured(self) -> bool:
        return bool(self.google_vision_api_key)

    @property
    def deterministic_allowed(self) -> bool:
        return self.environment == "test" or self.offline_demo


@lru_cache
def get_settings() -> Settings:
    return Settings()
