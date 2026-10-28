# OneDesk — AICTE Cross-Bureau Case Monitoring Dashboard
> **Smart India Hackathon 2026** | **Problem Statement:** SIH26264  
> **Theme:** Smart Automation | **Organization:** AICTE  
> **Team:** ZenCoderz  
> *"One institution. One shared view. Coordinated action."*

---

## 🏛️ Executive Summary & Problem Context

The All India Council for Technical Education (**AICTE**) regulates thousands of technical engineering, polytechnic, management, and pharmacy institutions across India through multiple specialized divisions:
- **Approval Bureau**: Intake capacity authorizations, affiliation compliance, new program approvals.
- **Finance Bureau**: Fee regulation caps, tuition disputes, student refund mandates, grant audits.
- **Faculty Affairs Bureau**: Minimum teacher-student cadre ratios, 7th CPC salary compliance.
- **Infrastructure Bureau**: Laboratory safety standards, building approvals, fire NOC verification.
- **Anti-Ragging Cell**: Zero-tolerance statutory anti-ragging compliance and inquiry directives.
- **Examination Bureau**: Delays in consolidated grade cards, diploma certifications, re-evaluations.

### The Problem (SIH26264)
In traditional operations, complaints submitted by students, parents, faculty, or audit teams enter administrative silos. A single engineering college might simultaneously face:
1. An unapproved faculty retrenchment dispute in **Faculty Affairs**,
2. An illegal fee retention complaint in **Grievance Cell**, and
3. An intake expansion request pending review in the **Approval Bureau**.

Without a consolidated view, approvals may be renewed while serious investigations are underway in another cell.

### The Solution: OneDesk
**OneDesk** unifies complaints across all AICTE divisions into an intuitive single pane of glass, providing:
1. **Consolidated Institution Profiles**: Complete institutional history across every bureau.
2. **AI-Assisted Cross-Bureau Overlap Watch**: Automatically detects related, duplicate, or co-occurring complaints using local semantic embeddings and deterministic similarity.
3. **Transparent Human-in-the-Loop Review**: AI never makes unilateral decisions. Human officers review, confirm, or dismiss overlaps with mandatory audit logging.
4. **SLA Monitoring & Exportable Reports**: Real-time resolution metrics and CSV exports for AICTE executive meetings.

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| **Cinematic Role-Based Auth** | Enter as **Director General (Admin)** for full regulatory triage, or as **Zonal Officer (User)** with 1-click presets or custom credentials. |
| **Live Complaint Lodging** | Add new live cases with instantaneous automated screening for potential cross-bureau overlaps across the active registry. |
| **Unified 360° Institution Profile** | View all historical complaints, active alerts, and bureau involvements for any institution in one place. |
| **Central Complaint Register** | Multi-attribute filtering (bureau, status, priority), live instant search, pagination, and slide-out preview drawer. |
| **Case Detail & Audit Timeline** | Comprehensive case dossier with timeline tracking, bureau remarks, status update controls, and action logs. |
| **Smart Overlap Watch Engine** | Detects cross-bureau case connections using local Ollama semantic embeddings (`nomic-embed-text`) with automatic TF-IDF fallback. |
| **Human-in-the-Loop Workflow** | Review proposed links, verify evidence scores, add officer rationale, and mark cases as "Confirmed Link" or "False Positive". |
| **Activity Log & System Audit** | Chronological immutable cross-system audit trail capturing every officer action, status update, and AI review decision. |
| **Executive Reports & CSV Export** | Bureau breakdown charts, SLA compliance counters, and standardized CSV export via PapaParse. |
| **100% Vercel & Offline Resilience** | Zero paid APIs or cloud dependencies required. Works 100% standalone in the browser with `localStorage` persistence. |

---

## 🔐 Credentials & Login Guide

OneDesk includes an authentication screen with role routing:

| Persona | Role | Default Username | Permissions |
| :--- | :--- | :--- | :--- |
| **Dr. Rajesh Verma** | Director General (Admin) | `admin` | Full triage authority across all 6 bureaus, AI overlap overrule, executive reports |
| **Shri Rajiv Nair** | Regional Officer (User) | `user` | Zonal triage, submit bureau notes, review assigned cases, lodge complaints |

> **Login Logic:** Any username containing `admin` (case-insensitive) logs in with **Admin** privileges. Any other username (e.g. `user`, `officer`, or your name) logs in as **Bureau Officer**. Any password is accepted for demonstration testing.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- *(Optional for AI)* **Ollama** installed locally (`https://ollama.ai`)

### 1. Installation
In the project root directory:
```bash
npm install
```

### 2. Run the Development Server
You can launch both the frontend and proxy server together:
```bash
# Start Vite frontend (:5173) and Express Ollama proxy (:3001) concurrently:
npm start
```

Or run the frontend only:
```bash
npm run dev
```

Open your browser at:  
👉 **http://localhost:5173**

---

## 🧠 AI Setup Guide (Local Ollama nomic-embed-text)

OneDesk features a private on-premises AI engine:

### Step 1: Install Ollama
Download and install Ollama from [ollama.ai](https://ollama.ai).

### Step 2: Pull the Embedding Model
Open your terminal and run:
```bash
ollama run nomic-embed-text
```
This downloads the lightweight (~270MB) 768-dimensional embedding model running locally on port `11434`.

### Step 3: Verify Connection in OneDesk
Navigate to **Settings** -> Click **Test AI Connection**.  
OneDesk will test both the Node backend proxy (`:3001`) and direct Ollama (`:11434`) and report real-time ping latency.

### 🛡️ Offline & Vercel Fallback Guarantee
If Ollama is not installed or when running live on Vercel:
OneDesk automatically engages its built-in **Deterministic Keyword & TF-IDF Cosine Heuristic Matcher**. Evaluators can test the entire overlap detection, similarity score computation, and human review workflow without installing Ollama or running a backend!

---

## 🌐 Deploy to Vercel (100% Working Production Build)

OneDesk is pre-configured for instant zero-config deployment on Vercel:

1. Push your repository to GitHub / GitLab.
2. In the Vercel Dashboard, click **Add New Project** -> Select your repo.
3. Keep default settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **Deploy**.

The bundled [vercel.json](file:///e:/LAST%20HOPE/vercel.json) ensures client-side routing works smoothly across all tabs.

---

## 📁 Project Directory Structure

```
├── public/
│   └── favicon.svg           # OneDesk SVG emblem icon
├── server/
│   └── index.js              # Express proxy for Ollama embeddings & cosine scoring (:3001)
├── src/
│   ├── components/
│   │   ├── ActivityLog.tsx   # Cross-bureau chronological system audit trail
│   │   ├── AuthScreen.tsx    # Cinematic dark landing & authentication screen
│   │   ├── CaseDetail.tsx    # Detailed case dossier, status updates & audit log
│   │   ├── Institutions.tsx  # Institution directory & 360° consolidated profile
│   │   ├── LodgeComplaintModal.tsx # Live complaint registration with overlap screening
│   │   ├── OverlapWatch.tsx  # AI & Heuristic cross-bureau overlap detection center
│   │   ├── Overview.tsx      # Executive command center with KPI & SVG intake trends
│   │   ├── Register.tsx      # Searchable, filterable complaint register with slide-out drawer
│   │   ├── Reports.tsx       # Bureau resolution stats, overdue SLA, CSV export & print
│   │   ├── Settings.tsx      # AI setup guide, connection tester, role matrix & data reset
│   │   ├── Sidebar.tsx       # Collapsible navigation drawer with badge counters
│   │   └── Topbar.tsx        # Global search, notification popover & persona switcher
│   ├── context/
│   │   └── AppContext.tsx    # Global state, auth, live complaint addition & notifications
│   ├── data/
│   │   └── sampleData.ts     # Curated mock dataset of AICTE institutions & cases
│   ├── store/
│   │   └── persistence.ts   # LocalStorage synchronization layer
│   ├── types/
│   │   └── index.ts          # TypeScript domain models (Case, Institution, User, Overlap)
│   ├── utils/
│   │   └── helpers.ts        # Similarity math, date formatting, badge utilities, CSV
│   ├── App.tsx               # View routing and modal state coordinator
│   ├── index.css             # Ultra-premium dark enterprise design system
│   └── main.tsx              # React DOM entry point
├── index.html                # HTML entry point with Inter & JetBrains Mono fonts
├── package.json              # Project dependencies & scripts
├── tsconfig.json             # TypeScript compiler configuration
├── vercel.json               # SPA route rewrite configuration for Vercel
└── vite.config.ts            # Vite configuration
```

---

## 👥 SIH 2026 Team ZenCoderz
- **Challenge:** SIH26264 (AICTE)
- **Status:** Functional Prototype Built & Verified
- **License:** MIT
