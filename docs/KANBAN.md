# 📋 Ethos AI — Team Kanban Board

> Repository: [`Team-Inception-1/Ethos-AI`](https://github.com/Team-Inception-1/Ethos-AI)  
> Purpose: Task distribution by member with direct mapping to evaluation criteria.

## 👥 Team Members

| Member | Role | GitHub |
|---|---|---|
| **Tasin** | Backend & Integration Lead | `@tasinofficial` |
| **Prova** | Frontend, UX & QA Lead | `@prova` |

---

## 🧭 Kanban Columns

### 📥 Backlog

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-13 | Add Bangla voice assistant for guardian updates | Tasin + Prova | 1, 2, 7 |
| K-14 | Add real-time dispute chat between student and agency | Tasin | 1, 2, 3 |
| K-15 | Add production payment gateway integration (SSLCommerz/bKash) | Tasin | 3 |

### 📝 To Do

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-08 | Build PostgreSQL schema + Prisma migrations + seed data | Tasin | 3 |
| K-09 | Connect frontend pages to real API client (remove mock data) | Prova | 2, 3, 5 |
| K-10 | Add end-to-end happy-path test for full student workflow | Prova + Tasin | 2, 4, 5 |

### 🚀 In Progress

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-04 | Implement JWT auth + RBAC middleware + guardian linking API | Tasin | 1, 3, 5 |
| K-05 | Implement directory filters and agency comparison workflow | Prova | 1, 2, 7 |
| K-06 | Implement application stage tracking + document vault | Tasin | 1, 2, 3 |
| K-07 | Implement escrow milestone flow + immutable ledger entries | Tasin | 1, 2, 3 |

### 🔍 Review / QA

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-11 | Accessibility pass (labels, focus states, contrast, mobile nav) | Prova | 7 |
| K-12 | Code quality pass (types, validation, error handling, duplication) | Tasin | 5 |

### ✅ Done

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-01 | Project setup, folder structure, baseline architecture docs | Tasin | 8 |
| K-02 | UI design system (glassmorphism components + theme support) | Prova | 7 |
| K-03 | Initial README with setup instructions and module overview | Prova + Tasin | 8 |

---

## 🔗 End-to-End Workflow Coverage

The board supports this integrated flow across criteria:
1. Student/parent auth and linking (**K-04**)  
2. Agency discovery and comparison (**K-05**)  
3. Application submission and status progression (**K-06**)  
4. Escrow milestone payment and ledger records (**K-07**)  
5. Final validation through integration testing (**K-10**)

---

## ✅ Criteria Coverage Summary

| Criterion | Covered By |
|---|---|
| 1. Core Features Implemented | K-04, K-05, K-06, K-07 |
| 2. Feature Integration & Workflow | K-05, K-06, K-07, K-10 |
| 3. Backend / Database Functionality | K-04, K-06, K-07, K-08, K-09 |
| 4. Git & Team Collaboration | K-10 (shared workflow validation), PR review process |
| 5. Code Quality & SWE Practices | K-09, K-12 |
| 7. UI/UX & Usability | K-02, K-05, K-11 |
| 8. Project Organization & Documentation | K-01, K-03, this Kanban document |
