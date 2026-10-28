// OneDesk — Settings & AI Engine Guide
import { useState } from 'react';
import {
  Brain,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Globe,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function SettingsView() {
  const { currentUser, switchRole, resetDemoData, cases, overlaps } = useApp();

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [testingOllama, setTestingOllama] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'fallback';
    message: string;
    latency?: number;
  }>({ status: 'idle', message: '' });
  const [resetDone, setResetDone] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setTestResult({ status: 'idle', message: 'Pinging Ollama instances…' });
    const startTime = performance.now();

    try {
      // 1. Try Node proxy
      let proxyOk = false;
      try {
        const pResp = await fetch('http://localhost:3001/api/ollama/status', {
          signal: AbortSignal.timeout(3000),
        });
        if (pResp.ok) {
          const pJson = await pResp.json();
          if (pJson.available && pJson.hasModel) {
            proxyOk = true;
          }
        }
      } catch {
        // proxy offline
      }

      // 2. Try direct Ollama
      let directOk = false;
      try {
        const dResp = await fetch('http://localhost:11434/api/tags', {
          signal: AbortSignal.timeout(3000),
        });
        if (dResp.ok) {
          const dJson = await dResp.json();
          directOk = (dJson.models || []).some((m: { name: string }) =>
            m.name.startsWith('nomic-embed-text')
          );
        }
      } catch {
        // direct offline
      }

      const elapsed = Math.round(performance.now() - startTime);

      if (proxyOk || directOk) {
        setTestResult({
          status: 'success',
          message: `Connected successfully! nomic-embed-text is active (${
            proxyOk ? 'Node Proxy :3001' : 'Direct :11434'
          }). Real vector cosine scoring enabled.`,
          latency: elapsed,
        });
      } else {
        setTestResult({
          status: 'fallback',
          message:
            'Ollama service not detected on localhost:11434 or proxy :3001. OneDesk is operating in 100% functional Fallback Mode (Deterministic TF-IDF & Keyword Cosine Matching).',
          latency: elapsed,
        });
      }
    } catch {
      setTestResult({
        status: 'fallback',
        message: 'Could not reach local Ollama daemon. Fallback heuristic engine active.',
      });
    } finally {
      setTestingOllama(false);
    }
  };

  const handleReset = () => {
    resetDemoData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const exportBackupJson = () => {
    const data = { cases, overlaps, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onedesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & System Configuration</h1>
          <p className="page-subtitle">
            Local AI setup guide, role management, data controls, and Vercel cloud deployment readiness.
          </p>
        </div>
      </div>

      {/* ── Section 1: AI Engine Setup Guide ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-badge" style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
              <Brain size={18} className="text-violet" />
            </div>
            <div>
              <span className="card-title">AI Engine Setup Guide (Local Ollama nomic-embed-text)</span>
              <p className="card-subtitle">
                How to configure private, zero-cloud on-device embeddings for AICTE cross-bureau overlap detection
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTestOllama}
            disabled={testingOllama}
          >
            {testingOllama ? <div className="spinner spinner-sm" /> : <Zap size={14} />}
            Test AI Connection
          </button>
        </div>

        <div className="card-body">
          {/* Test Status Banner */}
          {testResult.status !== 'idle' && (
            <div
              className={`alert ${
                testResult.status === 'success' ? 'alert-success' : 'alert-warning'
              }`}
              style={{ marginBottom: 20 }}
            >
              {testResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <div>
                <strong>
                  {testResult.status === 'success' ? 'AI Connection Verified' : 'Operating in Standalone Fallback'}
                </strong>
                <div style={{ fontSize: '0.82rem', marginTop: 3 }}>
                  {testResult.message}{' '}
                  {testResult.latency !== undefined && (
                    <span style={{ opacity: 0.8 }}>({testResult.latency}ms ping)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            OneDesk features a dual-engine architecture. For maximum privacy during government evaluations, it
            runs completely on-device without calling external paid APIs or sending student grievances to cloud LLMs.
          </p>

          <div className="ai-steps-grid">
            {/* Step 1 */}
            <div className="ai-step-card">
              <div className="step-number-badge">1</div>
              <div className="step-title">Install Ollama Daemon</div>
              <p className="step-desc">
                Download and install the lightweight Ollama runtime for Windows, Linux, or macOS.
              </p>
              <div className="terminal-box">
                <code># Windows / Mac: download from website</code>
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="step-link"
                >
                  ollama.ai <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="ai-step-card">
              <div className="step-number-badge">2</div>
              <div className="step-title">Pull Embedding Model</div>
              <p className="step-desc">
                Pull the ultra-fast <code>nomic-embed-text</code> 768-dim vector model (~270MB).
              </p>
              <div className="terminal-box">
                <code>ollama run nomic-embed-text</code>
                <button
                  className="btn-copy-code"
                  onClick={() => copyToClipboard('ollama run nomic-embed-text', 'c1')}
                >
                  {copiedCmd === 'c1' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="ai-step-card">
              <div className="step-number-badge">3</div>
              <div className="step-title">Start OneDesk with Proxy</div>
              <p className="step-desc">
                Launches the Vite UI (:5173) and Node Ollama proxy server (:3001) concurrently.
              </p>
              <div className="terminal-box">
                <code>npm start</code>
                <button className="btn-copy-code" onClick={() => copyToClipboard('npm start', 'c2')}>
                  {copiedCmd === 'c2' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          <div className="fallback-explanation-box">
            <div className="fallback-title">
              <Shield size={15} className="text-cyan" />
              100% Vercel Cloud & Air-Gapped Resiliency Guarantee
            </div>
            <p className="fallback-text">
              If Ollama is not installed or when deployed live to Vercel, OneDesk automatically engages its built-in
              <strong> Deterministic Keyword & TF-IDF Cosine Heuristic Engine</strong>. Evaluators can test real-time
              cross-bureau overlap detection, match confidence scores, evidence indicators, and human review workflows
              with 0 dependencies and 0 setup friction!
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Active Persona & Access Control ──────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-badge" style={{ background: 'rgba(6, 182, 212, 0.12)' }}>
              <Shield size={18} className="text-cyan" />
            </div>
            <div>
              <span className="card-title">Session Profile & Role Matrix</span>
              <p className="card-subtitle">
                Active access credentials and jurisdictional authority within AICTE
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={switchRole}>
            Switch to {currentUser?.role === 'admin' ? 'Bureau Officer (User)' : 'Director General (Admin)'}
          </button>
        </div>

        <div className="card-body">
          <div className="session-card-grid">
            <div className="session-profile-card">
              <div className="session-avatar">{currentUser?.avatar}</div>
              <div className="session-meta">
                <div className="session-name">{currentUser?.name}</div>
                <div className="session-title">{currentUser?.title}</div>
                <div className="session-badge-row">
                  <span className={`badge ${currentUser?.role === 'admin' ? 'badge-confirmed' : 'badge-inprocess'}`}>
                    Role: {currentUser?.role === 'admin' ? 'Administrator' : 'Bureau Officer'}
                  </span>
                  <span className="badge badge-disposed">{currentUser?.bureau}</span>
                </div>
              </div>
            </div>

            <div className="permissions-matrix-card">
              <div className="matrix-title">Assigned Privileges</div>
              <ul className="permissions-list">
                <li>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>Central Complaint Register: View & Search all records</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>Lodge Live Complaints with instantaneous overlap check</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>Human-in-the-Loop Overlap Review: Confirm / Dismiss pairs</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>
                    {currentUser?.role === 'admin'
                      ? 'Full Triage Authority: Overrule status across all 6 bureaus'
                      : 'Zonal Triage: Update notes and statuses for assigned bureau'}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>Download CSV and Analytical Reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Data Controls & Vercel Readiness ─────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <Globe size={18} className="text-emerald" />
            </div>
            <div>
              <span className="card-title">Data Management & Live Deployment</span>
              <p className="card-subtitle">
                Demonstration reset, JSON backup, and Vercel hosting readiness
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="data-actions-row">
            <div className="data-action-item">
              <div>
                <strong>Restore Standard Baseline Dataset</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Reset all complaints and overlap candidates back to the curated 12-case national scenario.
                </p>
              </div>
              <button
                className={`btn btn-secondary ${resetDone ? 'btn-success' : ''}`}
                onClick={handleReset}
              >
                {resetDone ? (
                  <>
                    <Check size={14} /> Reset Complete
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} /> Reset Demo Data
                  </>
                )}
              </button>
            </div>

            <div className="data-action-item" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div>
                <strong>Export Local State as JSON</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Download a snapshot of current in-browser cases, audit trail, and overlap decisions.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={exportBackupJson}>
                <Download size={14} /> Export JSON
              </button>
            </div>
          </div>

          {/* Vercel Badge */}
          <div className="vercel-readiness-banner">
            <div className="vercel-badge-left">
              <Globe size={16} className="text-cyan" />
              <span>
                <strong>Vercel Deployment Status:</strong> Ready for 1-click zero-config deploy. Pure client-side SPA
                architecture with persistent local storage.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
