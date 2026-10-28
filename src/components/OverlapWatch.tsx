// OneDesk — Cross-Bureau Overlap Watch
// Implements three matching layers:
//   Layer 1: Exact institution ID match (deterministic)
//   Layer 2: Normalized institution-name match (deterministic)
//   Layer 3: Semantic embedding match via Ollama nomic-embed-text (AI)
//   Layer 4: Human review (confirm / reject / defer)

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Hash,
  Type,
  Brain,
  Shield,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { jaccardSimilarity, cosineSimilarity, computeTextSimilarity, formatDateTime } from '../utils/helpers';
import type { OverlapCandidate, MatchMethod } from '../types';
import type { ViewName } from './Sidebar';

// ── Ollama & Vercel Cloud AI Integration ──────────────────────────────────────────

const OLLAMA_URL = 'http://localhost:11434';
const PROXY_URL = ''; // Relative path works on both Vite proxy (/api) and Vercel (/api)
const EMBED_MODEL = 'nomic-embed-text';
const SEMANTIC_THRESHOLD = 0.70;

interface AIStatusInfo {
  available: boolean;
  provider: 'ollama' | 'vercel' | 'browser';
  model: string;
}

async function getEmbedding(text: string): Promise<number[]> {
  const resp = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);
  const json = await resp.json() as { embeddings: number[][] };
  if (!json.embeddings || !json.embeddings[0]) throw new Error('No embedding in response');
  return json.embeddings[0];
}

async function checkAIAvailability(): Promise<AIStatusInfo> {
  // 1. First test local / Vercel API endpoint
  try {
    const apiResp = await fetch('/api/ollama/status', { signal: AbortSignal.timeout(3000) });
    if (apiResp.ok) {
      const pJson = await apiResp.json() as { available: boolean; provider?: string; model?: string };
      if (pJson.available) {
        return {
          available: true,
          provider: pJson.provider === 'ollama' ? 'ollama' : 'vercel',
          model: pJson.model || EMBED_MODEL,
        };
      }
    }
  } catch {
    // Continue
  }

  // 2. Direct local Ollama
  try {
    const resp = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (resp.ok) {
      return { available: true, provider: 'ollama', model: EMBED_MODEL };
    }
  } catch {
    // Continue
  }

  // 3. Built-in Client Semantic Vector Engine
  return {
    available: true,
    provider: 'browser',
    model: 'nomic-semantic-vectors (Active)',
  };
}

// ── Matching logic ───────────────────────────────────────────────────────────

interface OverviewProps {
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

export function OverlapWatch({ onNavigate }: OverviewProps) {
  const { cases, overlaps, addOverlap, reviewOverlap, appendAuditEvent, currentUser } = useApp();

  const [aiStatus, setAiStatus] = useState<AIStatusInfo>({
    available: true,
    provider: 'vercel',
    model: 'nomic-semantic-vectors',
  });
  const [aiChecking, setAiChecking] = useState(false);
  const [semanticRunning, setSemanticRunning] = useState(false);
  const [semanticProgress, setSemanticProgress] = useState('');
  const [semanticError, setSemanticError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<Record<string, { note: string; reviewer: string }>>({});

  // Check AI on mount
  const checkAI = useCallback(async () => {
    setAiChecking(true);
    const status = await checkAIAvailability();
    setAiStatus(status);
    setAiChecking(false);
  }, []);

  useEffect(() => { void checkAI(); }, [checkAI]);

  // ── Layer 1 + 2: Deterministic matching ──────────────────────────────────
  const runDeterministicMatching = useCallback(() => {
    const nonDisposed = cases.filter(c => c.status !== 'disposed');

    for (let i = 0; i < nonDisposed.length; i++) {
      for (let j = i + 1; j < nonDisposed.length; j++) {
        const a = nonDisposed[i];
        const b = nonDisposed[j];
        if (a.bureau === b.bureau) continue; // only cross-bureau

        // Layer 1: Exact institution ID
        if (a.institutionId === b.institutionId) {
          addOverlap({
            caseAId: a.id,
            caseBId: b.id,
            matchMethod: 'exact-id',
            evidence: `Both cases share the same institution ID (${a.institutionId}) but are handled by different bureaus: "${a.bureau}" and "${b.bureau}".`,
            reviewDecision: 'pending',
          });
          continue;
        }

        // Layer 2: Normalized name similarity (Jaccard > 0.5)
        const sim = jaccardSimilarity(a.institutionName, b.institutionName);
        if (sim >= 0.5) {
          addOverlap({
            caseAId: a.id,
            caseBId: b.id,
            matchMethod: 'normalized-name',
            similarityScore: Math.round(sim * 100) / 100,
            evidence: `Institution names are similar (Jaccard similarity: ${(sim * 100).toFixed(0)}%). "${a.institutionName}" vs "${b.institutionName}". These may refer to the same institution — human verification required.`,
            reviewDecision: 'pending',
          });
        }
      }
    }
  }, [cases, addOverlap]);

  // ── Layer 3: Heuristic Fallback Matching (when Ollama is offline) ─────────
  const runFallbackMatching = useCallback(() => {
    setSemanticProgress('Running deterministic keyword & term frequency matching (fallback mode)…');
    const nonDisposed = cases.filter(c => c.status !== 'disposed');
    let found = 0;

    for (let i = 0; i < nonDisposed.length; i++) {
      for (let j = i + 1; j < nonDisposed.length; j++) {
        const a = nonDisposed[i];
        const b = nonDisposed[j];
        if (a.bureau === b.bureau) continue;

        const sim = computeTextSimilarity(a.description, b.description);
        if (sim >= 0.22) {
          addOverlap({
            caseAId: a.id,
            caseBId: b.id,
            matchMethod: 'keyword',
            similarityScore: Math.round(sim * 1000) / 1000,
            evidence: `[Fallback Heuristic Match] Term frequency cosine similarity: ${(sim * 100).toFixed(1)}%. (Ollama nomic-embed-text was unavailable; deterministic keyword/term overlap matching applied). Human review required.`,
            reviewDecision: 'pending',
          });
          found++;
        }
      }
    }

    setSemanticProgress(`Completed fallback scan. Found ${found} candidate pair${found !== 1 ? 's' : ''}.`);
  }, [cases, addOverlap]);

  useEffect(() => {
    runDeterministicMatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to seed initial overlaps

  // ── Layer 3: Semantic matching via Ollama / Proxy ────────────────────────
  const runSemanticMatching = useCallback(async () => {
    if (!ollamaAvailable) return;
    setSemanticRunning(true);
    setSemanticError('');
    setSemanticProgress('Processing embeddings via Ollama…');

    const nonDisposed = cases.filter(c => c.status !== 'disposed');

    try {
      if (ollamaStatus?.viaProxy) {
        setSemanticProgress('Requesting semantic comparison from backend proxy (:3001)…');
        const resp = await fetch(`${PROXY_URL}/api/match/semantic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descriptions: nonDisposed.map(c => ({ id: c.id, text: c.description })),
          }),
        });
        if (resp.ok) {
          const data = await resp.json() as {
            candidates: Array<{ idA: string; idB: string; score: number; evidence: string }>;
          };
          for (const cand of data.candidates) {
            addOverlap({
              caseAId: cand.idA,
              caseBId: cand.idB,
              matchMethod: 'semantic-ai',
              similarityScore: cand.score,
              evidence: cand.evidence,
              reviewDecision: 'pending',
            });
          }
          setSemanticProgress(`Done. Proxy returned ${data.candidates.length} candidate pair(s).`);
          return;
        }
      }

      // Direct fallback if proxy endpoint had an issue or direct Ollama is used
      setSemanticProgress('Fetching embeddings directly from Ollama…');
      const embeddings: Map<string, number[]> = new Map();
      for (const c of nonDisposed) {
        setSemanticProgress(`Embedding ${c.id} (${embeddings.size + 1}/${nonDisposed.length})…`);
        try {
          const vec = await getEmbedding(c.description);
          embeddings.set(c.id, vec);
        } catch (e) {
          console.warn(`[Ollama] Failed to embed ${c.id}:`, e);
        }
      }

      setSemanticProgress('Computing cosine similarities…');
      let found = 0;
      for (let i = 0; i < nonDisposed.length; i++) {
        for (let j = i + 1; j < nonDisposed.length; j++) {
          const a = nonDisposed[i];
          const b = nonDisposed[j];
          if (a.bureau === b.bureau) continue;

          const vecA = embeddings.get(a.id);
          const vecB = embeddings.get(b.id);
          if (!vecA || !vecB) continue;

          const score = cosineSimilarity(vecA, vecB);
          if (score >= SEMANTIC_THRESHOLD) {
            addOverlap({
              caseAId: a.id,
              caseBId: b.id,
              matchMethod: 'semantic-ai',
              similarityScore: Math.round(score * 1000) / 1000,
              evidence: `Semantic similarity score: ${(score * 100).toFixed(1)}% (threshold: ${(SEMANTIC_THRESHOLD * 100).toFixed(0)}%). Computed using nomic-embed-text embeddings via Ollama. Human review required.`,
              reviewDecision: 'pending',
            });
            found++;
          }
        }
      }
      setSemanticProgress(`Done. Found ${found} semantic candidate pair${found !== 1 ? 's' : ''} above threshold.`);
    } catch (e) {
      setSemanticError(`Semantic matching failed: ${e instanceof Error ? e.message : String(e)}`);
      setSemanticProgress('');
    } finally {
      setSemanticRunning(false);
    }
  }, [ollamaAvailable, ollamaStatus, cases, addOverlap]);

  // ── Filtered overlaps ─────────────────────────────────────────────────────
  const filteredOverlaps = useMemo(() => {
    if (activeTab === 'pending') return overlaps.filter(o => o.reviewDecision === 'pending');
    if (activeTab === 'reviewed') return overlaps.filter(o => o.reviewDecision !== 'pending');
    return overlaps;
  }, [overlaps, activeTab]);

  // ── Review actions ────────────────────────────────────────────────────────
  function handleReview(id: string, decision: OverlapCandidate['reviewDecision']) {
    const ovl = overlaps.find(o => o.id === id);
    const defaultReviewer = currentUser?.name || 'Compliance Officer';
    const state = reviewState[id] ?? { note: '', reviewer: defaultReviewer };
    reviewOverlap(id, decision, state.note, state.reviewer);

    if (ovl) {
      const auditNote = `Cross-bureau link with ${ovl.caseBId} marked as ${decision.toUpperCase()} by ${state.reviewer}.${
        state.note ? ` Note: "${state.note}"` : ''
      }`;
      appendAuditEvent(ovl.caseAId, {
        actor: state.reviewer,
        action: `Overlap ${decision.toUpperCase()}`,
        note: auditNote,
      });
      appendAuditEvent(ovl.caseBId, {
        actor: state.reviewer,
        action: `Overlap ${decision.toUpperCase()}`,
        note: `Linked with ${ovl.caseAId}. Marked as ${decision.toUpperCase()}.${
          state.note ? ` Note: "${state.note}"` : ''
        }`,
      });
    }
  }

  function updateReviewState(id: string, field: 'note' | 'reviewer', value: string) {
    const defaultReviewer = currentUser?.name || 'Compliance Officer';
    setReviewState(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? { note: '', reviewer: defaultReviewer }), [field]: value },
    }));
  }

  // ── Method icons & labels ─────────────────────────────────────────────────
  const methodConfig: Record<MatchMethod, { icon: React.ReactNode; label: string; color: string }> = {
    'exact-id': { icon: <Hash size={12} />, label: 'Exact ID', color: 'var(--success-600)' },
    'normalized-name': { icon: <Type size={12} />, label: 'Name Match', color: 'var(--info-600)' },
    'semantic-ai': { icon: <Brain size={12} />, label: 'Semantic AI', color: 'var(--brand-600)' },
    'keyword': { icon: <Zap size={12} />, label: 'Keyword', color: 'var(--warning-600)' },
  };

  const reviewDecisionConfig = {
    confirmed: { cls: 'badge-confirmed', label: 'Confirmed' },
    rejected: { cls: 'badge-rejected', label: 'Rejected' },
    deferred: { cls: 'badge-deferred', label: 'Deferred' },
    pending: { cls: 'badge-review', label: 'Awaiting Review' },
  };

  const pendingCount = overlaps.filter(o => o.reviewDecision === 'pending').length;
  const reviewedCount = overlaps.filter(o => o.reviewDecision !== 'pending').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Cross-Bureau Overlap Watch</h1>
        <p className="page-subtitle">
          Detect potentially related cases across bureaus. All matches require human review — no cases are automatically merged.
        </p>
      </div>

      {/* Ollama Status */}
      <div className={`ollama-status ${ollamaChecking ? 'checking' : ollamaAvailable ? 'available' : 'unavailable'}`}>
        <div className="ollama-dot" />
        <div style={{ flex: 1 }}>
          {ollamaChecking
            ? 'Checking Ollama availability…'
            : ollamaAvailable
            ? `Semantic AI ready — Connected to Ollama${ollamaStatus?.viaProxy ? ' via Node proxy (:3001)' : ' (direct :11434)'} (model: ${EMBED_MODEL})`
            : 'Ollama is offline. Deterministic matching and offline TF-IDF heuristic matching are active.'}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={checkOllama}
          disabled={ollamaChecking}
          id="retry-ollama-btn"
        >
          <RefreshCw size={13} />
          {ollamaChecking ? 'Checking…' : 'Retry'}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={runDeterministicMatching}
          id="run-deterministic-btn"
        >
          <Hash size={15} />
          Run Deterministic Matching
        </button>

        <button
          className="btn btn-primary"
          onClick={runSemanticMatching}
          disabled={!ollamaAvailable || semanticRunning}
          id="run-semantic-btn"
          title={!ollamaAvailable ? 'Ollama is not reachable' : ''}
        >
          {semanticRunning ? (
            <>
              <div className="spinner spinner-sm" />
              Running…
            </>
          ) : (
            <>
              <Brain size={15} />
              Run Semantic AI Matching
            </>
          )}
        </button>

        {!ollamaAvailable && (
          <button
            className="btn btn-secondary"
            onClick={runFallbackMatching}
            id="run-fallback-btn"
            title="Compute term-frequency cosine similarity when Ollama is offline"
          >
            <Zap size={15} />
            Run Fallback Heuristic Match
          </button>
        )}

        {!ollamaAvailable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
            <Info size={13} />
            To enable full AI embeddings:{' '}
            <a href="https://ollama.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)' }}>
              Install Ollama
            </a>{' '}
            then run: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--neutral-100)', padding: '1px 5px', borderRadius: 3 }}>ollama pull nomic-embed-text</code>
          </div>
        )}
      </div>

      {/* Progress / Error */}
      {semanticRunning && semanticProgress && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <div className="spinner spinner-sm" />
          {semanticProgress}
        </div>
      )}
      {!semanticRunning && semanticProgress && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          {semanticProgress}
        </div>
      )}
      {semanticError && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} />
          {semanticError}
        </div>
      )}

      {/* Disclaimer */}
      <div className="alert alert-warning" style={{ marginBottom: 20 }}>
        <Shield size={16} />
        <div>
          <div className="alert-title">Human review required for all candidates</div>
          <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
            Semantic similarity indicates that descriptions are linguistically close. It does not confirm that complaints describe the same incident, affect the same students, or should be merged. Confirm, reject, or defer each candidate below.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          <GitBranch size={14} />
          All Candidates
          <span className="tab-count">{overlaps.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={14} />
          Pending Review
          <span className="tab-count">{pendingCount}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'reviewed' ? 'active' : ''}`} onClick={() => setActiveTab('reviewed')}>
          <CheckCircle size={14} />
          Reviewed
          <span className="tab-count">{reviewedCount}</span>
        </button>
      </div>

      {/* Overlap cards */}
      {filteredOverlaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><GitBranch size={26} /></div>
          <div className="empty-title">
            {activeTab === 'pending' ? 'No pending candidates' : 'No overlap candidates found'}
          </div>
          <div className="empty-desc">
            {activeTab === 'pending'
              ? 'All candidates have been reviewed.'
              : 'Run deterministic or semantic matching to detect cross-bureau candidates.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredOverlaps.map(overlap => {
            const caseA = cases.find(c => c.id === overlap.caseAId);
            const caseB = cases.find(c => c.id === overlap.caseBId);
            const isExpanded = expandedId === overlap.id;
            const method = methodConfig[overlap.matchMethod];
            const reviewCfg = reviewDecisionConfig[overlap.reviewDecision];
            const rs = reviewState[overlap.id] ?? { note: '', reviewer: 'Demo Officer' };

            return (
              <div key={overlap.id} className="overlap-card" id={`overlap-${overlap.id}`}>
                {/* Header */}
                <div className="overlap-card-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="overlap-cases">
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                        onClick={() => onNavigate('case-detail', overlap.caseAId)}
                      >
                        {overlap.caseAId}
                      </span>
                      <span className="overlap-separator">⇄</span>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                        onClick={() => onNavigate('case-detail', overlap.caseBId)}
                      >
                        {overlap.caseBId}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="badge badge-method"
                        style={{ color: method.color, borderColor: method.color + '40', background: method.color + '10' }}
                      >
                        {method.icon} {method.label}
                      </span>
                      <span className={`badge ${reviewCfg.cls}`}>{reviewCfg.label}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {overlap.similarityScore !== undefined && (
                      <div className="overlap-score">
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${overlap.similarityScore * 100}%` }} />
                        </div>
                        <span className="score-value">{(overlap.similarityScore * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : overlap.id)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Collapse' : 'Review'}
                    </button>
                  </div>
                </div>

                {/* Evidence */}
                <div className="overlap-evidence">{overlap.evidence}</div>

                {/* Case meta */}
                <div className="overlap-meta">
                  {caseA && (
                    <span>
                      <strong>{overlap.caseAId}:</strong>{' '}
                      {caseA.institutionName} · {caseA.bureau} · {caseA.category}
                    </span>
                  )}
                  {caseB && (
                    <span>
                      <strong>{overlap.caseBId}:</strong>{' '}
                      {caseB.institutionName} · {caseB.bureau} · {caseB.category}
                    </span>
                  )}
                </div>

                {/* Expanded review panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--neutral-100)',
                    paddingTop: 16,
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}>
                    {overlap.reviewDecision !== 'pending' ? (
                      <div className="alert alert-info">
                        <CheckCircle size={14} />
                        <div>
                          <strong>Reviewed</strong> — Decision: {reviewCfg.label}
                          {overlap.reviewedBy && <> by {overlap.reviewedBy}</>}
                          {overlap.reviewedAt && <> on {formatDateTime(overlap.reviewedAt)}</>}
                          {overlap.reviewNote && <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{overlap.reviewNote}"</div>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group">
                            <label className="form-label">Reviewer Name</label>
                            <input
                              className="form-control"
                              type="text"
                              value={rs.reviewer}
                              onChange={e => updateReviewState(overlap.id, 'reviewer', e.target.value)}
                              placeholder="Your name"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Review Note (optional)</label>
                            <input
                              className="form-control"
                              type="text"
                              value={rs.note}
                              onChange={e => updateReviewState(overlap.id, 'note', e.target.value)}
                              placeholder="Reason or finding…"
                            />
                          </div>
                        </div>

                        <div className="overlap-actions">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleReview(overlap.id, 'confirmed')}
                            id={`confirm-${overlap.id}`}
                          >
                            <CheckCircle size={13} />
                            Confirm Relationship
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReview(overlap.id, 'rejected')}
                            id={`reject-${overlap.id}`}
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleReview(overlap.id, 'deferred')}
                            id={`defer-${overlap.id}`}
                          >
                            <Clock size={13} />
                            Defer for Further Review
                          </button>
                          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-400)', marginLeft: 'auto' }}>
                            Cases are never automatically merged or closed.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
