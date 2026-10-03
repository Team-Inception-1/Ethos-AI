# 🚀 Running Ethos AI Services

This guide provides step-by-step instructions to run the **Frontend**, **AI Microservice**, and **Prisma Studio** locally.

---

## 📋 Summary of Services & Ports

| Service | Technology | Path / Directory | Default URL | Command |
|---|---|---|---|---|
| **Frontend Web App** | Next.js 15, React 19 | `apps/web` | `http://localhost:3000` | `npm run dev` |
| **AI Microservice** | FastAPI, Python 3.11 | `apps/ai-service` | `http://localhost:8001` | `uvicorn app.main:app --reload --port 8001` |
| **Prisma Studio** | Prisma GUI | Project Root (`.`) | `http://localhost:5555` | `npx prisma@6 studio` |

---

## 1. 💻 Running the Frontend Web App (`apps/web`)

### Steps:
1. Open a terminal and navigate to `apps/web`:
   ```bash
   cd apps/web
   ```
2. Install dependencies (if not done yet):
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at:  
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 2. 🤖 Running the AI Microservice (`apps/ai-service`)

### Steps:

#### Windows (PowerShell):
```powershell
cd apps/ai-service

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Create .env file (if not exists) and add GEMINI_API_KEY if testing live Gemini API
copy .env.example .env

# Run FastAPI server with hot-reload on port 8001
uvicorn app.main:app --reload --port 8001
```

#### macOS / Linux / Git Bash:
```bash
cd apps/ai-service

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run FastAPI server on port 8001
uvicorn app.main:app --reload --port 8001
```

5. Access the API documentation / OpenAPI UI at:  
   👉 **[http://localhost:8001/docs](http://localhost:8001/docs)**

---

## 3. 🗄️ Running Prisma Studio (Database GUI)

Prisma Studio is a visual editor for data in your PostgreSQL database.

### Prerequisites:
Ensure your `.env` file has a valid `DATABASE_URL` configured (e.g. `DATABASE_URL="postgresql://user:password@localhost:5432/ethos_db"`).

### Steps:
1. Open a terminal at the root directory of the project (`Ethos-AI/`):
   ```bash
   npx prisma@6 studio
   ```
2. Open the visual database dashboard at:  
   👉 **[http://localhost:5555](http://localhost:5555)**

---

## ⚡ Quick Reference: Commands for 3 Terminals

Run each of these commands in a separate terminal window:

### Terminal 1 (Frontend):
```bash
cd apps/web && npm run dev
```

### Terminal 2 (AI Microservice - Windows PowerShell):
```powershell
cd apps/ai-service; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8001
```

### Terminal 3 (Prisma Studio):
```bash
npx prisma@6 studio
```


✅ Terminal 1 — Frontend (from apps/web):
powershell
cd "T:\Ethos AI\Ethos-AI\apps\web"
npm run dev
✅ Terminal 2 — AI Microservice (must activate venv FIRST):
powershell
cd "T:\Ethos AI\Ethos-AI\apps\ai-service"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
⚠️ uvicorn only works after activating the virtual environment with .\.venv\Scripts\Activate.ps1. Without it, PowerShell can't find uvicorn.

✅ Terminal 3 — Prisma Studio (from project root):
powershell
cd "T:\Ethos AI\Ethos-AI"
npx prisma@6 studio