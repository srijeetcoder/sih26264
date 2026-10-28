# OneDesk — GitHub Push & Deployment Guide with Working AI
> **Smart India Hackathon 2026** | **Problem Statement:** SIH26264  
> **Team:** ZenCoderz | **Project:** OneDesk (AICTE Cross-Bureau Case Monitoring Dashboard)  
> **Remote Repository:** `https://github.com/srijeetcoder/sih26264.git`

---

## 📌 Section 1: Push Project to GitHub

Open PowerShell or Command Prompt in the project folder (`e:\LAST HOPE`) and execute the following commands in order:

```bash
# 1. Initialize Git repository if not already initialized
git init

# 2. Add remote origin (if already added, git remote set-url origin https://github.com/srijeetcoder/sih26264.git)
git remote add origin https://github.com/srijeetcoder/sih26264.git 2>$null; if ($LASTEXITCODE -ne 0) { git remote set-url origin https://github.com/srijeetcoder/sih26264.git }

# 3. Stage all files (respecting .gitignore: node_modules & dist are ignored)
git add .

# 4. Commit all files
git commit -m "feat(onedesk): complete SIH26264 working prototype with Ollama AI overlap watch and multi-bureau dashboard"

# 5. Set branch name to main
git branch -M main

# 6. Push to GitHub
git push -u origin main
```

> **Note on Authentication:** If prompted for GitHub credentials:
> - Username: `srijeetcoder`
> - Password: Use your **GitHub Personal Access Token (classic)** with `repo` scope (generate at *GitHub -> Settings -> Developer Settings -> Personal Access Tokens*).

---

## 📌 Section 2: Zero-Config Deployment on Vercel

OneDesk is built with Vite + React + TypeScript and is 100% pre-configured for Vercel with SPA routing in `vercel.json`.

### Option A: Via Vercel Web Dashboard (Easiest)
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **"Add New Project"**.
3. Import your repository: **`srijeetcoder/sih26264`**.
4. Configure Project settings (Vercel automatically detects these):
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**.
6. Within 45 seconds, your live production URL (e.g., `https://sih26264.vercel.app`) will be ready!

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Run deployment
vercel --prod
```

---

## 📌 Section 3: How the AI Engine Works (Dual Architecture)

OneDesk includes an institutional-grade cross-bureau overlap detection engine that works in **two complementary modes**:

```
                       ┌──────────────────────────────┐
                       │   Case Comparison Trigger   │
                       └──────────────┬───────────────┘
                                      │
                   Is local Ollama available on :11434?
                                     / \
                               YES  /   \  NO / VERCEL HOSTED
                                   /     \
                                  ▼       ▼
    ┌───────────────────────────────┐   ┌───────────────────────────────┐
    │     Local AI Neural Engine    │   │  Deterministic Heuristic AI   │
    │  - Ollama (nomic-embed-text)  │   │  - Jaccard Token N-Gram Match │
    │  - 768-dim Semantic Vectors   │   │  - TF-IDF Cosine Similarity   │
    │  - Cosine Distance Threshold  │   │  - Exact Institution ID Match │
    └──────────────┬────────────────┘   └──────────────┬────────────────┘
                   │                                   │
                   └─────────────────┬─────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Ranked Overlap Dossier    │
                      │  Evidence + Similarity Score │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │  Human-in-the-Loop Review   │
                      │  Confirm / Reject / Defer    │
                      └──────────────────────────────┘
```

### 1. Mode A: Local Neural AI (Ollama `nomic-embed-text`)
When running locally for hackathon demonstration:
1. Install [Ollama](https://ollama.ai).
2. Pull the embedding model in your terminal:
   ```bash
   ollama pull nomic-embed-text
   ```
3. Start the OneDesk unified server:
   ```bash
   npm start
   ```
   *(This starts Vite on `http://localhost:5173` and the Express Ollama Proxy on `http://localhost:3001`)*.
4. When you open **Potential Overlaps** and click **Run Semantic Overlap Scan**, OneDesk communicates with Ollama, extracts 768-dimensional embeddings for case descriptions, calculates vector cosine similarity, and highlights cross-bureau overlaps.

### 2. Mode B: Standalone Web & Cloud Fallback (Zero Setup)
When deployed on Vercel or when Ollama is not installed:
- OneDesk automatically activates its **Deterministic TF-IDF & Keyword Cosine Matcher**.
- Evaluators can review the exact matching algorithm, similarity scoring, and human audit trail without having to install anything locally.
- **Zero failure rate during jury evaluation.**

---

## 📌 Section 4: Testing & Verification Checklist

| Test Item | Action | Expected Result |
| :--- | :--- | :--- |
| **Authentication** | Click *"Sign In as Admin"* | Loads Executive Command Center as Dr. Rajesh Verma (HQ Admin) |
| **Role Switcher** | Open user dropdown -> click *"Switch Persona"* | Toggles between DG Admin and Zonal Officer |
| **Lodge Complaint** | Click `+ Lodge Complaint` button | Modal opens; screening for cross-bureau matches occurs on submit |
| **Overlap Watch** | Click `Potential Overlaps` in sidebar | Shows 2 pending candidate overlaps with evidence cards and decision controls |
| **Human Review** | Click *"Confirm Overlap"* or *"Reject"* | Decision recorded, badge updates, and event is logged in Activity Log |
| **Institution 360°** | Click `Institutions` -> select any college | Shows 360° profile, tabbed cases, and consolidated cross-bureau timeline |
| **Reports & Export** | Click `Reports` -> click *"Export CSV"* | PapaParse exports clean CSV file formatted for AICTE reporting |
| **Reset Data** | Click *"Reset Data"* in topbar | Restores standard SIH national evaluation sample instantly |

---

## 👥 SIH 2026 Team ZenCoderz
- **Project:** OneDesk
- **Problem Code:** SIH26264 (AICTE)
- **Tagline:** *One institution. One shared view. Coordinated action.*
