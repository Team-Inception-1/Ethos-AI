# Ethos AI — AI Microservice (`apps/ai-service`)

FastAPI microservice hosting the AI/OCR/LLM workloads, kept isolated from the
Node.js core API per `ETHOS_AI_CONTEXT.md` §10.

Currently implemented:

- **Module 5.8 — Fake Document Detection** (Issue [#22](https://github.com/Team-Inception-1/Ethos-AI/issues/22) / K-21)
  - `POST /api/ai/analyze-offer-letter` — multipart upload (PDF / image / .txt)
  - `POST /api/ai/analyze-offer-letter/text` — JSON body, raw offer letter text
- **Module 5.9 — Smart Agreement Analyzer** (Issue [#16](https://github.com/Team-Inception-1/Ethos-AI/issues/16))
  - `POST /api/ai/analyze-agreement` — multipart upload (PDF / image / .txt)
  - `POST /api/ai/analyze-agreement/text` — JSON body, raw agreement text
- **Module 5.10 — Scam Alert System** (Issue [#23](https://github.com/Team-Inception-1/Ethos-AI/issues/23))
  - `POST /api/ai/scan-content` — scan free text for predatory/scam claims
  - `GET /api/ai/agencies/{agency_id}/risk-score` — rolling risk score for an agency
  - `POST /api/ai/agencies/{agency_id}/risk-events` — record a complaint/review-sentiment event
- `GET /health`

Not yet implemented here (owned by other Kanban issues — see `docs/KANBAN.md`):
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

Tests run fully offline against deterministic fakes (`FakeAgreementLLM`,
`FakeScamLLM`) — no API key or network access required. The real Gemini
providers are exercised only by manual smoke tests (see below), since they
require a live key.

## API contract (for #25 — wiring the frontend)

### `POST /api/ai/analyze-offer-letter`

`multipart/form-data`:
| field | type | notes |
|---|---|---|
| `file` | file | PDF, image (png/jpg/jpeg/webp/bmp/tiff), or `.txt` — max 20MB |
| `sender_email` | string (optional) | Sender email from communication or envelope |
| `expected_university` | string (optional) | University name expected by the student/parent |

### `POST /api/ai/analyze-offer-letter/text`

```json
{
  "text": "Offer letter text...",
  "sender_email": "admissions@utoronto.ca",
  "expected_university": "University of Toronto"
}
```

### Response (both endpoints)

```json
{
  "riskScore": 15,
  "verdict": "genuine",
  "flags": [
    {
      "code": "OFFICIAL_DOMAIN_VERIFIED",
      "message": "Verified sender domain 'utoronto.ca' matches official registry for University of Toronto.",
      "severity": "info",
      "points": 0
    }
  ]
}
```

- **Risk Score (0–100)**: Deterministic rollup of structural checks, academic domain checks, and predatory claim detection.
- **Verdict Thresholds**:
  - `0 – 25`: `genuine`
  - `26 – 65`: `suspicious`
  - `66 – 100`: `fake`

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

### `POST /api/ai/scan-content`

```json
{
  "text": "We offer a 100% Visa Guarantee! Only 2 seats left, act now! Pay cash only.",
  "source": "agency_profile",
  "language": "en",
  "agency_id": "agt-001"
}
```

`source` and `agency_id` are both optional. `source` is purely informational
(e.g. `"agency_profile"`, `"chat_message"`, `"agreement"`). If `agency_id` is
provided and any flags are found, the scan also records a `scan` event
against that agency's rolling risk score.

Response:

```json
{
  "flags": [
    { "tag": "100% Visa Guarantee", "category": "guarantee_claim", "severity": "danger", "source": "rule", "matched_text": "100% Visa Guarantee", "message_en": "..." }
  ],
  "severity": "danger",
  "model_used": "gemini | fake"
}
```

Detection is two-tier: a 14-pattern rule-based pre-filter (`app/services/scam_rules.py`,
covering guarantee claims, urgency/pressure tactics, unverifiable credentials,
and payment pressure — exceeds the DoD's ≥10 requirement) always runs first,
then an LLM (`ScamLLM`) escalation pass catches paraphrased/subtler scam
language the regexes can't anticipate. `flags[].source` is `"rule"` or
`"llm"` so the frontend/audit trail can tell which tier caught each flag. If
the LLM tier fails (network/quota/bad key), the endpoint degrades gracefully
to rule-only results rather than erroring out.

### `GET /api/ai/agencies/{agency_id}/risk-score`

```json
{
  "agency_id": "agt-001",
  "risk_score": 29.75,
  "flag_count": 1,
  "last_updated": "2026-08-31T06:28:54.405831Z",
  "recent_events": [
    { "source": "scan", "weight": 85.0, "reason": "Content scan (agency_profile) flagged: ...", "occurred_at": "2026-08-31T06:28:54.350624Z" }
  ]
}
```

`risk_score` is a 0–100 rolling exponential-moving-average across all
recorded events for that agency (see `app/services/agency_risk_store.py`).
Agencies with no recorded events default to a clean `0` score rather than a
404, so every agency on the Directory can render a badge immediately.

### `POST /api/ai/agencies/{agency_id}/risk-events`

Lets the core Node API (which owns complaint/review data — this service
never touches that DB directly, per `ETHOS_AI_CONTEXT.md` §10) push a
non-scan event into the same rolling score:

```json
{ "source": "complaint", "weight": 70.0, "reason": "Student complaint: undisclosed fee" }
```

Storage for the risk store is in-memory/process-local for this course
project — see the module docstring in `agency_risk_store.py` for the
swap-to-DB path once #14's Prisma schema lands.

## Manual live smoke test (requires a real `GEMINI_API_KEY`)

```bash
export GEMINI_API_KEY=your-key-here
uvicorn app.main:app --port 8001 &
curl -s -X POST http://localhost:8001/api/ai/analyze-agreement/text \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/sample_request.json | jq .
```
