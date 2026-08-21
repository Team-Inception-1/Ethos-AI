# 📋 Ethos AI — Team Kanban Board

> Repository: [`Team-Inception-1/Ethos-AI`](https://github.com/Team-Inception-1/Ethos-AI)  
> Purpose: Task distribution by member with direct mapping to evaluation criteria.

## 👥 Team Members

| Member | Role | GitHub |
|---|---|---|
| **Tasin** | Backend & Security Lead | `@tasinofficial` |
| **Sudiip Paul** | Full-Stack Feature Developer | `@SudiipPaul` |
| **Sourav G** | Frontend & UX Developer | `@Souravg223` |
| **Jannat Ferdo** | QA, Testing & Documentation | `@jannatferdo` |
| **Taha Mim Tasfa** | Integration & DevOps Developer | `@Taha-Mim-Tasfa` |

---

## 🧭 Kanban Columns

### 📥 Backlog

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-16 | Add real-time chat between student and agency | Tasin | 1, 2 |
| K-17 | Add AI agreement clause highlighter for refund risks | Sudiip Paul | 1, 3 |
| K-18 | Add Bangla guardian summary cards and voice playback | Sourav G | 1, 7 |
| K-19 | Prepare demo script + walkthrough checklist for evaluation | Jannat Ferdo | 4, 8 |
| K-20 | Add deployment pipeline checks (lint/test/build) for PRs | Taha Mim Tasfa | 4, 5 |

### 📝 To Do

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-11 | Build PostgreSQL schema + Prisma migrations + seed data | Tasin | 3 |
| K-12 | Connect frontend pages to real API client (remove mock data) | Sudiip Paul | 2, 3, 5 |
| K-13 | Complete accessibility pass (labels, contrast, keyboard nav) | Sourav G | 7 |

### 🚀 In Progress

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-06 | Implement JWT auth + RBAC middleware + guardian linking API | Tasin | 1, 3, 5 |
| K-07 | Implement application stage tracking + document vault | Sudiip Paul | 1, 2, 3 |
| K-08 | Implement directory filters and agency comparison workflow | Sourav G | 1, 2, 7 |
| K-09 | Add end-to-end workflow test: register → apply → escrow → status | Jannat Ferdo | 2, 4, 5 |
| K-10 | Implement escrow milestone flow + immutable ledger entries | Taha Mim Tasfa | 1, 2, 3 |

### 🔍 Review / QA

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-14 | Code quality pass (strict typing, validation, error handling) | Jannat Ferdo | 5 |
| K-15 | Verify API reliability and edge-case behavior for payment/doc flows | Taha Mim Tasfa | 3, 5 |

### ✅ Done

| Task ID | Task | Assignee | Criteria |
|---|---|---|---|
| K-01 | Project setup, folder structure, architecture context document | Tasin | 8 |
| K-02 | Initial auth/profile shell and role switching screens | Sudiip Paul | 1, 7 |
| K-03 | UI design system (glassmorphism components + theming) | Sourav G | 7 |
| K-04 | Repository README with setup and module overview | Jannat Ferdo | 8 |
| K-05 | Base scripts for issue/project workflow and repo hygiene | Taha Mim Tasfa | 4, 8 |

---

## ⚖️ Equal Task Distribution Summary

| Member | Assigned Tasks | Task IDs |
|---|---:|---|
| **Tasin** | **4** | K-01, K-06, K-11, K-16 |
| **Sudiip Paul** | **4** | K-02, K-07, K-12, K-17 |
| **Sourav G** | **4** | K-03, K-08, K-13, K-18 |
| **Jannat Ferdo** | **4** | K-04, K-09, K-14, K-19 |
| **Taha Mim Tasfa** | **4** | K-05, K-10, K-15, K-20 |

All five team members now have equal ownership by task count.

---

## 🔗 End-to-End Workflow Coverage

The board supports this integrated flow across criteria:
1. Student/parent auth and linking (**K-06**)  
2. Agency discovery and comparison (**K-08**)  
3. Application submission and status progression (**K-07**)  
4. Escrow milestone payment and ledger records (**K-10**)  
5. Final validation through integration testing (**K-09**)

---

## ✅ Criteria Coverage Summary

| Criterion | Covered By |
|---|---|
| 1. Core Features Implemented | K-06, K-07, K-08, K-10, K-16, K-17, K-18 |
| 2. Feature Integration & Workflow | K-07, K-08, K-09, K-10, K-12, K-16 |
| 3. Backend / Database Functionality | K-06, K-07, K-10, K-11, K-12, K-15, K-17 |
| 4. Git & Team Collaboration | K-05, K-09, K-19, K-20 |
| 5. Code Quality & SWE Practices | K-06, K-09, K-12, K-14, K-15, K-20 |
| 7. UI/UX & Usability | K-02, K-03, K-08, K-13, K-18 |
| 8. Project Organization & Documentation | K-01, K-04, K-05, K-19, this Kanban document |
