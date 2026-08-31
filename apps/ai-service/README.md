# Ethos AI — AI Microservice (`apps/ai-service`)

FastAPI microservice hosting the AI/OCR/LLM workloads, kept isolated from the
Node.js core API per `ETHOS_AI_CONTEXT.md` §10.

Currently implemented:

- **Module 5.9 — Smart Agreement Analyzer** (Issue [#16](https://github.com/Team-Inception-1/Ethos-AI/issues/16))
  - `POST /api/ai/analyze-agreement` — multipart upload (PDF / image / .txt)
  - `POST /api/ai/analyze-agreement/text` — JSON body, raw agreement text
  - `GET /health`

Not yet implemented here (owned by other Kanban issues — see `docs/KANBAN.md`):
- Offer-letter OCR fraud detection (Module 5.8, Issue #22, @Souravg223)
- Scam alert risk classifier (Module 5.10, Issue #23, @tasinofficial)
- AI Counselor recommendation engine (Module 5.18, Issue #24, @Souravg223)

## Setup

```bash
cd apps/ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in GEMINI_API_KEY
```

System dependency for OCR fallback (scanned PDFs / images):

```bash
# Debian/Ubuntu
sudo apt-get install -y tesseract-ocr poppler-utils
```

## Run

```bash
uvicorn app.main:app --reload --port 8001
```

## Test

```bash
pytest
```

Tests run fully offline against a deterministic `FakeAgreementLLM` — no API
key or network access required. `GeminiAgreementLLM` itself is exercised
only by a manual smoke test (see below), since it requires a live key.

## API contract (for #25 — wiring the frontend)

### `POST /api/ai/analyze-agreement`

`multipart/form-data`:
| field | type | notes |
|---|---|---|
| `file` | file | PDF, image (png/jpg/webp/bmp/tiff), or `.txt` — max 20MB |
| `declared_pricing` | string (JSON) | JSON array of `DeclaredFee` objects (see below). Defaults to `[]` |
| `language` | string | `"en"` (default) or `"bn"` |

```json
// declared_pricing example
[
  { "service_name": "Application processing", "amount_poisha": 6500000, "when_charged": "on_signup", "refundable": false, "conditions": "Non-refundable after 7 days" }
]
```

### `POST /api/ai/analyze-agreement/text`

```json
{
  "agreement_text": "...",
  "declared_pricing": [ /* same shape as above */ ],
  "language": "en"
}
```

### Response (both endpoints)

```json
{
  "clauses": [
    { "clause_type": "fee", "quote": "...", "amount_poisha": 6500000, "summary_en": "..." }
  ],
  "flags": [
    { "tag": "Hidden Fee", "severity": "danger", "clause_type": "fee", "message_en": "...", "related_quote": "...", "amount_poisha": 500000 }
  ],
  "verdict": "clear | needs_review | high_risk",
  "model_used": "gemini | fake",
  "truncated": false
}
```

`flags[].severity` maps directly to the existing `Badge` variants in
`AIToolsPage.tsx` (`info` / `warning` / `danger`), so the frontend swap in #25
should be close to a 1:1 replacement of the mocked `clauses` array.

## Manual live smoke test (requires a real `GEMINI_API_KEY`)

```bash
export GEMINI_API_KEY=your-key-here
uvicorn app.main:app --port 8001 &
curl -s -X POST http://localhost:8001/api/ai/analyze-agreement/text \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/sample_request.json | jq .
```
