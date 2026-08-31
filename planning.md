Below is a **clean, end-to-end product + engineering blueprint for the Annotex project**, following _exactly_ the structure you listed.  
This is written so you can **directly reuse sections** in your lab report, PPT, or design doc.

---

# **ANNOTEX — Product & Technical Blueprint**

---

## 1️⃣ Goal

### Why am I making this?

High-quality labeled data is critical for machine learning systems, but existing labeling platforms:

- Lack transparency in contributor performance

- Provide delayed or opaque payouts

- Offer limited visibility into data quality

Annotex is built to **create a transparent, incentive-driven data labeling workflow** with measurable quality metrics.

---

### Who is it for?

- **Dataset creators / researchers** who need labeled data

- **Students / contributors** who want fair, trackable rewards

- **ML teams** who care about dataset quality and accountability

---

### What gives it value?

- Transparent task completion and payouts

- Real-time analytics on label quality

- Low barrier to participation

- Clear linkage between contribution and reward

---

## 2️⃣ User Stories (User Perspective)

### Contributor (Annotator)

1. As a user, I can sign up and log in

2. I can view available labeling tasks

3. I can select a task and read instructions

4. I can submit labels for a task

5. I can see whether my label was accepted or rejected

6. I can track how many tasks I’ve completed

7. I can view my earnings history

8. I can connect my crypto wallet

9. I can receive payouts after task validation

---

### Admin / Task Creator

1. As an admin, I can create labeling tasks

2. I can upload datasets

3. I can define reward per task

4. I can configure validation rules (majority vote, thresholds)

5. I can monitor task progress

6. I can view label quality metrics

7. I can view contributor performance analytics

8. I can trigger payouts

9. I can deactivate low-quality contributors

---

### System-Level

1. The system validates labels automatically

2. The system updates dashboards in real time

---

## 3️⃣ Data

### Core Entities

**User**

- user_id

- role (admin / contributor)

- wallet_address

- total_earnings

**Task**

- task_id

- dataset_reference

- label_type

- reward_amount

- status

**Label**

- label_id

- task_id

- user_id

- value

- time_taken

- accepted_flag

**Payout**

- payout_id

- user_id

- amount

- transaction_reference

- timestamp

---

### Relationships

- One user → many labels

- One task → many labels

- Labels → aggregated into quality metrics

- Accepted labels → payouts

---

## 4️⃣ Nail the MVP

### Absolute Must-Haves

- User authentication

- Task creation

- Label submission

- Label validation

- Payout trigger

- Basic dashboards

### Explicitly Removed (Out of Scope)

- Reputation algorithms

- Auto-labeling with ML

- Advanced moderation

- DAO governance

- Custom smart contracts

📌 MVP goal: **End-to-end working loop**

---

## 5️⃣ Basic Wireframe (Conceptual)

### Screens

- Login / Register

- Task List

- Labeling Screen

- Earnings Dashboard

- Admin Analytics Dashboard

Paper sketches first → code later  
No pixel perfection in MVP.

---

## 6️⃣ Future Scope

### Planned Extensions

- ML-assisted pre-labeling

- Contributor reputation scores

- Advanced fraud detection

- Multi-chain payouts

- Dataset export for ML pipelines

### Trade-offs Made

- No custom smart contracts (simplicity)

- Devnet / testnet usage only

- Centralized validation logic for MVP

---

## 7️⃣ Specific Components

### Architecture (High-Level)

- Frontend → Backend API

- Backend → Database

- Backend → Blockchain RPC

- Backend → Metrics Aggregation

- Frontend → Visualization APIs

---

### Frontend

- Task interface

- Label submission

- Dashboards

- Wallet connect

---

### Backend

- Authentication

- Task management

- Label validation logic

- Metrics computation

- Payout trigger logic

---

### Database

- Stores users, tasks, labels, payouts

- Supports aggregation queries

---

### Core Technical Components

- REST APIs

- Metrics engine

- Visualization layer

- Containerized services

---

## 8️⃣ Stack

### Chosen Stack (Simple & Safe)

**Frontend**

- React

- Chart.js / Recharts

**Backend**

- FastAPI / Node.js

- REST architecture

**Database**

- PostgreSQL

**Blockchain Integration**

- Wallet adapters

- Existing token transfer APIs

**DevOps**

- Docker

- Docker Compose

- GitHub Actions (optional)

---

### Deployment Feasibility

- Local + cloud deployable

- No specialized infrastructure

- Single-command startup using Docker Compose

---

## 9️⃣ Overall Development Begins

### Create Skeleton

- `/frontend`

- `/backend`

- `/db`

- `/docker-compose.yml`

- Git version control

---

### Database & Models

- Define schema

- Create ORM models

- Seed basic data

---

### Backend Routes

- `/auth/*`

- `/tasks/*`

- `/labels/*`

- `/metrics/*`

- `/payouts/*`

---

### Frontend Interface

- Fetch tasks

- Submit labels

- Render charts

- Show earnings

---

## 🔟 Automated Deployment & Testing

### Testing Strategy

- Unit tests for validation logic

- API tests for endpoints

- Manual UI verification for MVP

### Deployment

- Docker build for frontend + backend

- Docker Compose for local orchestration

- CI pipeline for linting & builds

---

## ✅ Final Summary (What You’ve Actually Built)

Annotex is:

- A **full-stack data labeling platform**

- With **transparent analytics**

- **Crypto-based incentive payouts**

- **Containerized deployment**

- Clear MVP scope

- Strong academic justification

If you want next, I can:

- Convert this into a **lab report format**

- Create a **PPT-ready architecture explanation**

- Help you split this into **3-member responsibilities**

- Draft **evaluation rubric mapping**

---

## 1️⃣1️⃣ Current Implementation Snapshot (Living Status)

This section is the source of truth for future contributors and LLM agents.

### Last Updated

- Date: **2026-03-22**
- Branch at update time: **test-jest**
- Goal completed in this cycle: **PR 1 (Backend Jest + ESM runtime stabilization)**

### What Is Confirmed Working

**Backend runtime and build**

- TypeScript backend build succeeds (`npm --prefix backend run build`)
- Prisma client generation succeeds
- Backend app boots with current Express + Prisma stack

**Backend tests (real code path)**

- Auth route tests and auth service tests run against a real Postgres container
- Test suites pass end-to-end (no fake repository mocking)
- Jest ESM execution is stabilized via Node VM modules in backend npm scripts

**Jest exit stability**

- Previous issue: "Jest did not exit one second after the test run has completed"
- Fixed by explicitly closing both Prisma client and underlying pg pool in teardown path

### Key Engineering Decisions Captured

1. **Use ESM-aware Jest config** for this backend (`ts-jest/presets/default-esm` + ESM transform)
2. **Use real DB integration path for auth tests** (Prisma + Docker Postgres)
3. **Do not use fake repository mocks** for auth flow validation
4. **Close all database handles** (Prisma + pool) to prevent hanging Jest process
5. **Keep test logs quiet but production logs intact** via test-environment logger behavior

### Practical Runbook (Local)

1. Start DB container:
 - `POSTGRES_USER=annotex POSTGRES_PASSWORD=annotex POSTGRES_DB=annotex_db docker compose up -d db`
2. Sync DB schema to current Prisma models:
 - `cd backend && DATABASE_URL="postgresql://annotex:annotex@localhost:5433/annotex_db?schema=public" npx prisma db push --force-reset --accept-data-loss`
3. Run backend tests:
 - `DATABASE_URL="postgresql://annotex:annotex@localhost:5433/annotex_db?schema=public" npm --prefix backend run test -- --runInBand`
4. Rebuild backend:
 - `npm --prefix backend run build`

### Known Caveats / Notes

- Existing historical Prisma migration SQL in repo may not match current Prisma models. Use `db push --force-reset` for local test DB alignment during active development.
- Blockchain service routes are present, but wallet/private-key values must be valid for payout execution paths.
- Current frontend is auth + dashboard shell ready, but task list/submission UI still needs the next implementation PR.

### Recommended Next PR Sequence (After PR 1)

1. **PR 2:** Expand backend tests for tasks + labels (real DB path)
2. **PR 3:** Complete full docker-compose orchestration (frontend + backend + db)
3. **PR 4:** Replace dashboard placeholders with real task listing and fetch flow
4. **PR 5:** Implement label submission UI + API integration
5. **PR 6:** Sync README and backend docs to actual architecture and runbooks

### Definition of Done for Current Cycle

- Backend tests execute instead of failing at parser/runtime init
- Existing auth tests run end-to-end with real Prisma + Postgres
- Jest process exits cleanly after test completion
