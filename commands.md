# 🚀 Ethos AI — Service Run Commands & Cheatsheet

This guide contains all terminal commands to run the **Frontend (Next.js)**, **AI Microservice (FastAPI)**, and **Prisma Studio (Prisma UI for Database)** locally.

---

## ⚡ Quick Reference Table

| Service | Port | Local URL | Working Directory | Main Command |
|---|---|---|---|---|
| **Frontend (Next.js)** | `3000` | [http://localhost:3000](http://localhost:3000) | `apps/web` | `npm run dev` |
| **AI Microservice** | `8001` | [http://localhost:8001](http://localhost:8001)<br/>Docs: [http://localhost:8001/docs](http://localhost:8001/docs) | `apps/ai-service` | `uvicorn app.main:app --reload --port 8001` |
| **Prisma Studio (DB UI)**| `5555` | [http://localhost:5555](http://localhost:5555) | Root (`Ethos-AI`) | `npx prisma studio` |

---

## 🖥️ 1. Frontend (Next.js 15 + React 19)

### Run Development Server

**Option A — From `apps/web` directory (Recommended):**
```powershell
cd apps/web
npm run dev
```

**Option B — Directly from project root:**
```powershell
npm --prefix apps/web run dev
```

> The web app will be available at **[http://localhost:3000](http://localhost:3000)**.

### First-Time Setup / Dependency Install
```powershell
cd apps/web
npm install
```

### Production Build & Start
```powershell
cd apps/web
npm run build
npm run start
```

---

## 🤖 2. AI Microservice (FastAPI + Python)

### Run Microservice Server

**Option A — Windows PowerShell (with Virtual Environment):**
```powershell
cd apps/ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

*(Note: If PowerShell complains about script execution policy, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*

**Option B — Direct execution without activating venv (Windows):**
```powershell
cd apps/ai-service
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

**Option C — One-liner directly from project root:**
```powershell
.\apps\ai-service\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps/ai-service --reload --port 8001
```

**Option D — Windows Command Prompt (cmd.exe):**
```cmd
cd apps\ai-service
.\.venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8001
```

**Option E — Linux / macOS (Bash):**
```bash
cd apps/ai-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

### Endpoints
- **Service Root / Health**: [http://localhost:8001/health](http://localhost:8001/health)
- **Interactive Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc Documentation**: [http://localhost:8001/redoc](http://localhost:8001/redoc)

### First-Time Setup (if resetting virtual environment)
```powershell
cd apps/ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

### Run Tests
```powershell
cd apps/ai-service
.\.venv\Scripts\Activate.ps1
pytest
```

---

## 🗄️ 3. Prisma Studio ("Prism UI" for Database)

Prisma Studio is the visual editor and dashboard for your PostgreSQL database (Neon).

### Launch Prisma Studio (Run from Project Root)

```powershell
npx prisma studio
```

> Prisma Studio will open automatically at **[http://localhost:5555](http://localhost:5555)**.

### Custom Port (if 5555 is occupied)
```powershell
npx prisma studio --port 5556
```

### Useful Prisma Companion Commands (From Project Root)

- **Generate Prisma Client:**
  ```powershell
  npx prisma generate
  ```
- **Push schema changes directly to Neon Database:**
  ```powershell
  npx prisma db push
  ```
- **Create and apply a new migration:**
  ```powershell
  npx prisma migrate dev --name <migration_name>
  ```
- **Check migration status:**
  ```powershell
  npx prisma migrate status
  ```
- **Format schema file (`prisma/schema.prisma`):**
  ```powershell
  npx prisma format
  ```
- **Seed the database:**
  ```powershell
  npx ts-node prisma/seed.ts
  ```

---

## 🪟 4. How to Run All 3 Services Concurrently

To run all 3 services at the same time, open **3 separate terminal windows/tabs**:

### Terminal 1: Frontend
```powershell
cd "d:\Ethos AI\Ethos-AI\apps\web"
npm run dev
```

### Terminal 2: AI Microservice
```powershell
cd "d:\Ethos AI\Ethos-AI\apps\ai-service"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

### Terminal 3: Prisma UI (Studio)
```powershell
cd "d:\Ethos AI\Ethos-AI"
npx prisma studio
```

---

## 🚀 5. One-Click Launch Script (Windows PowerShell)

Run this single command from your project root in PowerShell to automatically spawn all 3 services in separate windows:

```powershell
# Launch Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Ethos AI\Ethos-AI\apps\web'; npm run dev"

# Launch AI Microservice
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Ethos AI\Ethos-AI\apps\ai-service'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8001"

# Launch Prisma Studio
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Ethos AI\Ethos-AI'; npx prisma studio"
```
