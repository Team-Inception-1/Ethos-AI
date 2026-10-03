# 🌐 Ethos AI — Web Application (Next.js 16)

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Tests-205_Passing-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

**The student, parent, and agency web client for Ethos AI — protecting Bangladeshi students and parents from predatory study-abroad consultancies.**

</div>

---

## 🏗️ Architecture Overview

The web layer is built as a high-performance Next.js 16 App Router application with Turbopack, connecting to Neon Serverless PostgreSQL and the dedicated Python FastAPI AI microservice.

```mermaid
flowchart LR
    Client["Browser / Client"] --> NextApp["Next.js 16 App Router (Port 3000)"]
    NextApp --> RouteGuards["Auth & Role Guards (RBAC)"]
    RouteGuards --> PrismaORM["Prisma ORM (Poisha Precision)"]
    PrismaORM --> NeonDB[("Neon PostgreSQL")]
    NextApp --> S3Vault["Private S3 Document Vault"]
    NextApp --> AIMicroservice["FastAPI AI Microservice (Port 8001)"]
```

### Core Subsystems:
1. **Directory & Agency Comparison (`/directory`, `/compare`)**: Side-by-side fee schedules, government license verification badges (`MOE-BD-*`), and refund terms.
2. **Milestone Escrow Ledger (`/dashboard/payments`)**: 64-bit integer poisha precision (`1 BDT = 100 Poisha`), multi-gateway sandbox adapter (`bKash`, `Nagad`, `SSLCOMMERZ`), signed callbacks, and SHA-256 chained transaction receipts.
3. **Application & Document Vault (`/dashboard/documents`, `/dashboard/applications`)**: Private S3-compatible document storage with authenticated streaming proxy and MIME validation.
4. **AI Counselor & Scholar Finder (`/dashboard/counselor`, `/dashboard/scholar-finder`)**: University matching, GPA/IELTS academic counseling, and research funding discovery.
5. **International Student Hub (`/dashboard/community`)**: Country-specific discussion channels (Germany, Canada, UK, USA, Australia) and verified peer messaging.
6. **Platform Governance (`/admin`)**: Independent escrow dispute arbitration, agency audit reviews, and scam alert broadcasts.

---

## 🛠️ Environment Variables Configuration

Copy `.env.example` to `.env.local` before starting:

```bash
cp .env.example .env.local
```

### Key Configuration Keys:

| Variable | Description | Example / Recommended Dev Value |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:password@localhost:5432/ethos` |
| `NEON_AUTH_BASE_URL` | Neon Auth host URL | `https://your-neon-auth-host.example/auth` |
| `NEON_AUTH_COOKIE_SECRET` | Session cookie secret (min 32 characters) | `replace-with-at-least-32-random-characters` |
| `ENABLE_DEMO_AUTH` | Enable local demo credentials without external OAuth | `true` (for local development) |
| `AWS_ENDPOINT_URL_S3` | S3-compatible private document vault endpoint | `https://your-storage-endpoint.example` |
| `ENABLE_LOCAL_PRIVATE_STORAGE` | Store document uploads locally if S3 is unconfigured | `false` |
| `AI_SERVICE_URL` | Internal FastAPI microservice endpoint | `http://127.0.0.1:8001` |
| `AI_SERVICE_API_TOKEN` | Bearer token authenticating internal AI requests | `replace-with-a-long-random-service-token` |
| `NEXT_PUBLIC_OFFLINE_DEMO` | Enable offline mock data when remote services are down | `true` (for local evaluation) |
| `ETHOS_PAYMENT_MODE` | Payment gateway mode (`sandbox` or `disabled`) | `sandbox` |
| `ETHOS_PAYMENT_SANDBOX_SECRET` | HMAC SHA-256 signature secret for gateway callbacks | `replace-with-at-least-32-random-characters` |

---

## 🚀 Running the Web Application

### 1. Install Dependencies & Generate Prisma Client
```bash
# In apps/web:
npm install
npm run db:generate
```

### 2. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build & Start
```bash
npm run build
npm run start
```

---

## 🧪 Testing & Quality Gates

The web application includes comprehensive unit, integration, and security regression suites:

```bash
# Run all Vitest unit and integration tests (205+ tests)
npm run test

# Watch mode
npm run test:watch

# TypeScript strict type checking
npx tsc --noEmit

# ESLint code quality gate
npm run lint

# End-to-end browser tests (Playwright)
npm run test:e2e
```

---

## 🛡️ Security Policies
- **Monetary Precision**: All currency is handled in Poisha (`BigInt`) to prevent IEEE-754 floating-point rounding errors.
- **CSRF & Origin Protection**: All state-changing mutation endpoints (`POST`, `PUT`, `DELETE`) require explicit same-origin validation (`sameOrigin(request)`).
- **Private Storage**: Documents in the vault are never publicly readable; all access requires server-side relationship authorization guards.
