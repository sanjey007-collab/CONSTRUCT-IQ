# ConstructIQ — AI Construction Resource Operations Agent

> **"ConstructIQ turns construction data into intelligent resource decisions."**

ConstructIQ is an enterprise AI-powered construction resource optimization platform that predicts material shortages and excess across active projects, discovers opportunities to redistribute resources internally, compares procurement alternatives, and recommends policy-controlled actions.

---

## 1. Product Overview

Construction contractors manage materials across multiple projects, suppliers, yards, and schedules. Data is fragmented across spreadsheets, ERPs, BOQs, and site notes. Consequently, an organization often faces:
* **Project A:** Holding idle excess material (idle capital, degradation, scrap loss).
* **Project B:** Facing an upcoming critical shortage (schedule work stoppage, delayed concrete pour).
* **Project C:** Issuing expensive spot emergency purchase orders.

ConstructIQ acts as an intelligent optimization and decision layer on top of existing construction systems:

```
OBSERVE ➔ UNDERSTAND ➔ FORECAST ➔ DETECT IMBALANCE ➔ FIND ALTERNATIVES ➔ OPTIMIZE ➔ RECOMMEND ➔ CHECK POLICY ➔ EXECUTE / REQUEST APPROVAL ➔ VERIFY ➔ LEARN
```

---

## 2. Key Features

* **Deterministic Material Forecasting**: Projections calculated across 7, 14, 30, and 60-day horizons factoring in scheduled activities, historical burn rates, and minimum safety buffers.
* **Imbalance Detection Radar**: Automatically flags critical material deficits before site stoppages occur, and detects verified surplus that exceeds scheduled demand.
* **Cross-Project Matching Engine**: Quantifies economics and schedule impact for four distinct options:
  * **Option A**: Inter-site road transfer from verified surplus site.
  * **Option B**: Inter-site transfer to alternate recipient site.
  * **Option C**: Direct commercial supplier reorder.
  * **Option D**: Split urgent transfer + standard mill procurement.
* **Autonomous Policy Engine**:
  * **GREEN (Autonomous)**: Read-only telemetry, shortage detection, dashboard analytics.
  * **YELLOW (Approval Required)**: Inter-site transfers (<= ₹50,000) and standard reorders (<= ₹25,000).
  * **RED (Human Executive Only)**: High-value transactions, unverified vendors, safety-critical structural materials.
* **AI Operations Agent & Controlled Tools**: 17 domain tools executed under strict validation. Uses Google's **Gemini 3.8 Flash** via the `google-genai` SDK for natural language reasoning, with an automatic deterministic domain fallback when offline.
* **Approval Center**: Full transparent decision breakdown (*What happened*, *Why*, *Alternatives*, *Cost*, *Savings*, *Risk*, *Policy Status*) with 1-click execution that updates yard inventories and resolves shortages in real time.
* **Executive ROI Analytics**: Quantified material savings, scrap loss avoidance, emergency fee avoidance, and platform ROI multiple tracking.
* **CSV Import Wizard**: Schema validation, data preview, and column mapping for BOMs, inventory counts, and consumption logs.
* **Audit Trail**: Comprehensive, immutable compliance logging of all user and agent actions with context payloads and IP addresses.

---

## 3. Architecture & Tech Stack

```
+---------------------------------------------------------------------------------------+
|                                    ConstructIQ UI                                     |
|                   Next.js 14+ App Router, TypeScript, Tailwind CSS                    |
|       Dashboard | Projects | Materials | Inventory | Shortages | Surplus | Agent     |
|       Optimization | Approvals | Analytics | Notifications | Audit Logs | CSV Import  |
+------------------------------------------+--------------------------------------------+
                                           | HTTP / REST (JWT Auth)
                                           v
+---------------------------------------------------------------------------------------+
|                                  FastAPI Backend                                      |
|                  Modular Layered Architecture (Python 3.11)                          |
+---------------------------------------------------------------------------------------+
|  API Layer (FastAPI Routers: Auth, Projects, Materials, Inventory, Forecast, Agent)   |
+------------------------------------------+--------------------------------------------+
|  Application & Domain Services Layer                                                  |
|  - Forecasting Engine (7/14/30/60-day deterministic + activity factors)               |
|  - Imbalance Detectors (Shortage & Surplus Analysis)                                  |
|  - Cross-Project Matching Optimizer (Transport vs Procurement vs Split Economics)     |
|  - Policy Engine (Autonomous Green / Approval Yellow / Human-Only Red)                |
|  - ROI Engine & Spend Analytics                                                       |
+------------------------------------------+--------------------------------------------+
|  AI Agent Orchestrator & Tool Registry                                                |
|  - State Machine (Observe -> Detect -> Search -> Compare -> Recommend -> Act)         |
|  - Controlled Backend Tools (17 domain tools)                                         |
|  - Gemini 3.8 Flash + Deterministic Fallback Domain Reasoner                          |
+------------------------------------------+--------------------------------------------+
|  Data Access Layer (SQLAlchemy ORM + SQLite/PostgreSQL Engine + Alembic)              |
+---------------------------------------------------------------------------------------+
```

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
* **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0.
* **Database**: SQLite (local zero-dependency development default) & PostgreSQL (production / Docker).
* **AI Orchestration**: Google GenAI SDK (`google-genai` >= 2.3.0) using `gemini-3.8-flash` with deterministic domain fallback.

---

## 4. Prerequisites

* **Node.js**: v18.17+ or v20+ (Node.js LTS v24.19.0 supported)
* **Python**: 3.11+
* **Git**

---

## 5. Quick Start (Local Run)

### 1. Start Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install email-validator

# Run seed script (automatically creates SQLite db and seeds the Hero scenario)
python -m app.seed_demo_data

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API is live at: `http://127.0.0.1:8000`
* Interactive OpenAPI Swagger docs: `http://127.0.0.1:8000/api/v1/docs`

### 2. Start Frontend

```powershell
cd frontend
npm install
npm run build
npm start -- -p 3000
```
* Frontend Dashboard is live at: `http://localhost:3000`

---

## 6. Demo Credentials & Personas

*(These are development/demo credentials provided for local testing)*

| Role Persona | Email | Password | Access & Responsibilities |
|---|---|---|---|
| **Procurement Manager** | `procurement@constructiq.com` | `demo1234` | Material forecasting, cross-project matching, purchase orders, approval authorization |
| **Project Manager** | `pm@constructiq.com` | `demo1234` | Site schedule milestones, activity demand, shortage mitigation |
| **Company Administrator**| `admin@constructiq.com` | `demo1234` | Full organizational oversight, policy threshold editing |
| **Site Engineer** | `site@constructiq.com` | `demo1234` | Physical yard inventory, receipt records, daily consumption |
| **Finance Director** | `finance@constructiq.com` | `demo1234` | Audit logging, ROI tracking, material expenditure control |
| **Auditor / Viewer** | `viewer@constructiq.com` | `demo1234` | Read-only compliance review |

*Quick Tip*: Use the top-right persona dropdown in the application header to switch roles instantly with a single click.

---

## 7. The Hero Demo Scenario Walkthrough

The platform comes pre-configured with a realistic construction imbalance across Tamil Nadu project sites:

1. **The Problem**:
   * **Project B (Madurai Commercial Complex)** requires **1,400 kg TMT Reinforcement Steel (Fe 550D)** within **7 days** for its raft foundation concrete pour. Available stock is **0 kg**.
   * Supplier standard lead time is **10 days**, creating an acute **3-day work stoppage** and risking ₹45,000 in idle labor penalties.
2. **The Discovery**:
   * **Project A (Chennai Residential Tower)** holds **2,300 kg** on site with only 800 kg scheduled for future slab activities, leaving **1,500 kg of verified actionable surplus**.
3. **The Optimization**:
   * Inter-site road freight transit takes **2 days** (0-day delay, arrives 5 days ahead of concrete pour).
   * Out-of-pocket logistics cost is **₹13,650** (₹11,550 freight + ₹2,100 rigging & QA inspection).
   * Generates **₹48,272 net cash savings** compared to spot rush mill procurement.
4. **The Action**:
   * Autonomy policy flags **YELLOW** (Approval Required).
   * Navigate to **Approval Center** (`/approvals`).
   * Click **"Approve & Execute Transfer"**.
   * ConstructIQ instantly:
     * Creates Transfer Order `TO-2026-CHN-MAD`.
     * Deducts 1,400 kg from Chennai inventory (preserving its safety buffer).
     * Allocates 1,400 kg incoming stock to Madurai.
     * Resolves the shortage radar alert.
     * Records the immutable audit trail.
5. **Resetting the Demo**:
   * Click the **"Reset Demo"** button in the header at any time to restore the baseline Hero Scenario.

---

## 8. Running Automated Tests

Run the complete backend test suite:

```powershell
cd backend
.\venv\Scripts\activate
pytest -v
```

All 13 tests verify:
* Deterministic multi-horizon forecasting (7d, 14d, 30d, 60d)
* Historical daily burn rates and activity factors
* Imbalance detection (shortages and surplus)
* Cross-project transfer vs supplier delay economics
* Autonomy policy routing (Green, Yellow, Red)
* Controlled execution of all 17 agent tools
* FastAPI authentication and REST endpoints

---

## 9. Docker Deployment

To launch the full stack with PostgreSQL in Docker:

```bash
docker-compose up --build
```

Services:
* **Frontend**: `http://localhost:3000`
* **FastAPI Backend**: `http://localhost:8000`
* **PostgreSQL**: `localhost:5432`

---

## 10. AI Configuration (Gemini 3.8 Flash)

ConstructIQ uses Google's latest `gemini-3.8-flash` model via the official `google-genai` SDK for natural-language agent reasoning and conversational explanations.

To enable live Gemini calls:
1. Obtain an API key from Google AI Studio.
2. Set the environment variable in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```
3. When `GEMINI_API_KEY` is not present, ConstructIQ automatically switches to its **Deterministic Domain Reasoner**, ensuring 100% testable, zero-crash demoability in offline or sandbox environments.

---

## 11. Security Notes

* Strict separation of financial calculations: All costs, savings, and inventory values are computed by deterministic Python services, **never** generated or hallucinated by an LLM.
* Passwords hashed using standard `passlib` with `bcrypt`.
* JWT authentication tokens with role and organization claims.
* Full tenant isolation via `org_id` foreign key constraints across all queries.
* Comprehensive audit logging of all data mutations, user sessions, and agent actions.
