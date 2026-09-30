# CivicLens — Constituency Accountability & Civic Transparency Platform

> **"See the Issue. Track the Action. Verify the Resolution."**

CivicLens is a production-quality, citizen-centric civic accountability platform built for municipal constituencies. It connects citizens, municipal authorities, field workers, elected representatives, and public viewers into an integrated, auditable civic resolution journey.

---

## 🏛️ The Civic Problem & The CivicLens Solution

### Traditional Grievance Systems vs. CivicLens
| Legacy Systems | CivicLens Accountability Platform |
| :--- | :--- |
| Citizens don't know which department is responsible | **Smart Authority Routing Engine** automatically matches Category + Ward to department |
| Complaints vanish into administrative black holes | **Real-time Immutable Timeline** logs every event, actor, and timestamp |
| Authorities mark tickets "Resolved" without fixing the problem | **Citizen Resolution Verification Protocol** — Tickets CANNOT be silently closed without citizen confirmation |
| Recurring infrastructure failures are treated as isolated events | **Spatial Recurring Issue Detection** automatically clusters nearby repeated complaints |
| Representative offices lack constituency-wide operational visibility | **Constituency Oversight Dashboard** displays real aggregated data (0 political bias) |
| Public infrastructure tenders remain opaque | **Public Project Transparency** links budgets, expenditures, and ground works |

---

## 🚀 Key Features by User Role

### 1. Citizen
- **6-Step Guided Reporting**: Category selection, detailed description, severity assessment, client-side photo compression, interactive OpenStreetMap pin drop, and real-time duplicate detection.
- **Unique Tracking Code**: e.g., `CL-2026-000101`.
- **My Complaints Portal**: Filter by All, Active, Resolved, Reopened, and Escalated.
- **Citizen Resolution Verification**: When an authority marks work resolved, citizens inspect and choose **"Completely Resolved"** (closes ticket) or **"Partially / Not Resolved"** (reopens ticket with rebuttal photo).
- **Official Escalation**: Escalate SLA-breached or recurring complaints to the Zonal Municipal Commissioner.

### 2. Department Officer
- **Department Queue**: Real-time intake for Roads, Sanitation, Drainage, Water, and Electrical divisions.
- **Field Worker Dispatch**: Assign tasks to field depot technicians with work notes.
- **Resolution Certification**: Upload official resolution photographs and completion notes before submitting for citizen verification.

### 3. Field Worker (Mobile-First)
- **Assigned Tasks**: Mobile task list with GPS location, directions link, and hazard details.
- **On-Site Progress**: Upload site photos, log field notes, and mark "Field Work Completed".

### 4. Representative Office (Constituency Oversight)
- **Constituency Health Metrics**: Total issues, verified resolution rate, and average response times.
- **Automated Spatial Clustering**: Detects recurring civic failure spots (<400m).
- **Category & Ward Charts**: Visual distribution of municipal workloads.
- **Strictly No Political Biases**: Pure civic transparency data.

### 5. Administrator & System Audit
- **Master Data Management**: Departments, jurisdictions/wards, issue categories, and routing rules.
- **Immutable Audit Trail**: Logs every action, role, timestamp, and metadata.
- **Demo State Reset**: Instant reset button to restore sample demonstration state.

### 6. Public Viewer
- **Public OpenStreetMap**: Leaflet map with status color-coded pins (anonymized citizen data).
- **Public Issues Explorer**: Filterable ledger of civic issues.
- **Public Project Transparency**: Monitored municipal infrastructure projects with budget expenditure progress bars (clearly labeled *Demo Data*).
- **AI Civic Assistant & Guide**: Free, rule-based bilingual chatbot (English & Tamil).

---

## 🛠️ Technology Stack (100% Free-Tier Compatible)

- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (Professional Civic Navy Theme)
- **Maps**: OpenStreetMap + Leaflet (No paid Google Maps API)
- **Charts**: Recharts (Free & open-source SVG charts)
- **Icons**: Lucide React
- **Database**: PostgreSQL / Supabase with Row Level Security (RLS) policies
- **Intelligence**: Deterministic rule-based civic engine (Zero paid API dependencies)
- **Dual-Engine Architecture**: Operates seamlessly with live Supabase credentials or offline in-browser persistent demonstration store!

---

## 🔑 Pre-Configured Demo Credentials

Switch between roles instantly using the top **Demo Role Bar**:
| Role | Demo User | Email | Division / Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | Dinesh Karthik | `citizen@civiclens.gov` | Ward 175 - Velachery |
| **Roads Officer** | Er. Meenakshi Sundaram | `officer.roads@civiclens.gov` | Roads & Bridges Dept |
| **Sanitation Officer** | Er. Arulmozhi Varman | `officer.sanitation@civiclens.gov` | Solid Waste Management |
| **Field Technician** | Kumaravel P. | `worker.kumar@civiclens.gov` | Velachery Field Depot |
| **Constituency MLA** | Hon. K. Rajendran | `mla.constituency@civiclens.gov` | Velachery Constituency HQ |
| **System Administrator** | Chief Administrator | `admin@civiclens.gov` | Civic Technology Cell |

---

## 🎬 Complete Demonstration Walkthrough

1. **Citizen reports issue**:
   - Go to `/report`. Select **Roads & Potholes**. Enter title: *"Deep crater on Main Road"*.
   - Upload sample photo, confirm location on OpenStreetMap, and submit.
   - System generates code (e.g. `CL-2026-000113`) and auto-routes to **Roads & Bridges Department**.

2. **Officer dispatches crew**:
   - Switch role to **Roads Officer**.
   - Open `/dashboard` and find the newly routed complaint.
   - Click **"Assign Tech"** and select **Kumaravel P. (Field Tech)**.

3. **Field worker inspects**:
   - Switch role to **Field Worker**.
   - Open `/dashboard`. Click **"Update Progress & Photo"** on the assigned task.
   - Add field observation, toggle **"Mark Field Task Completed"**, and save.

4. **Officer marks resolved**:
   - Switch back to **Roads Officer**.
   - Click **"Resolve"** on the complaint, enter official repair notes, and submit.
   - Status changes to **Resolved (Awaiting Citizen Verification)**.

5. **Citizen verifies outcome**:
   - Switch back to **Citizen**. Notice the prominent green verification banner on `/my-complaints` or the complaint page.
   - Click **"Verify Resolution"**:
     - Selecting **"Completely Resolved"** officially moves status to **Closed**.
     - Selecting **"Partially / Not Resolved"** reopens the ticket with a rebuttal photo!

---

## 🔌 Complete REST API Catalog (22 Endpoints)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate with email/password; creates session cookie |
| `/api/auth/register` | `POST` | Citizen account registration with ward and language preferences |
| `/api/auth/logout` | `POST` | Clear session cookie |
| `/api/auth/me` | `GET` | Get current authenticated user profile |
| `/api/auth/reset-password` | `POST` | Initiate password recovery workflow |
| `/api/issues` | `GET`, `POST` | Search/filter complaints, check duplicates, create complaint with auto-routing |
| `/api/issues/[id]` | `GET`, `PATCH` | Retrieve full complaint details with timeline/evidence; update status |
| `/api/issues/[id]/assign` | `POST` | Department Officer assigns field worker |
| `/api/issues/[id]/field-work` | `POST` | Field technician submits work updates & completion proof |
| `/api/issues/[id]/resolve` | `POST` | Officer marks complaint resolved with official notes |
| `/api/issues/[id]/verify` | `POST` | Citizen verifies resolution (closes or reopens ticket) |
| `/api/issues/[id]/escalate` | `POST` | Escalate SLA-breached/recurring issue to Commissioner |
| `/api/analytics/constituency` | `GET` | Real mathematical aggregate statistics across wards & categories |
| `/api/analytics/recurring` | `GET` | Spatial clustering (<400m) for recurring civic failures |
| `/api/departments` | `GET` | List all municipal departments |
| `/api/jurisdictions` | `GET` | List all constituency wards & zones |
| `/api/categories` | `GET` | List all issue categories with SLA targets |
| `/api/projects` | `GET` | List monitored public infrastructure projects |
| `/api/projects/[id]` | `GET` | Public project detailed budget and status view |
| `/api/notifications` | `GET`, `PATCH` | Fetch and mark user notifications read |
| `/api/audit-logs` | `GET` | Immutable system audit log trail |
| `/api/admin/seed` | `POST` | Reset database to pristine demo seed state |

---

## 🗄️ Database Architecture & Free-Tier Cloud Deployment

CivicLens includes a dual-engine architecture:
1. **Local Persistent DB Engine** (`src/data/server_db.json`): Zero configuration needed! Automatically saves every CRUD operation to an ACID-like local JSON database with full audit logging and spatial calculation.
2. **Supabase PostgreSQL Cloud**:
   - Create a free project at [supabase.com](https://supabase.com).
   - In Supabase SQL Editor, run `supabase/schema.sql` (creates tables, RLS policies, indexes, and triggers) and `supabase/seed.sql` (populates Chennai South wards and sample issues).
   - Configure credentials in `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
     SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
     DATABASE_MODE="supabase"
     ```

---

## 📦 Local Development

```bash
# Clone and enter project
cd civiclens

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

