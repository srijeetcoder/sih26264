// OneDesk — Institutions List & 360° Profile Pages
import { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  MapPin,
  FileText,
  ArrowLeft,
  GitBranch,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAMPLE_INSTITUTIONS } from '../data/sampleData';
import {
  formatDate,
  formatDateTime,
  statusLabel,
  statusColor,
  priorityLabel,
  priorityColor,
} from '../utils/helpers';
import type { ViewName } from './Sidebar';

interface InstitutionsProps {
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

export function Institutions({ onNavigate }: InstitutionsProps) {
  const { cases } = useApp();
  const [search, setSearch] = useState('');

  // Discover all distinct institutions from cases + SAMPLE_INSTITUTIONS
  const allInstitutions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; region: string }>();

    for (const inst of SAMPLE_INSTITUTIONS) {
      map.set(inst.id, { id: inst.id, name: inst.name, region: inst.region });
    }

    for (const c of cases) {
      if (!map.has(c.institutionId)) {
        map.set(c.institutionId, {
          id: c.institutionId,
          name: c.institutionName,
          region: c.region || 'Central',
        });
      }
    }

    return Array.from(map.values()).map(inst => {
      const instCases = cases.filter(c => c.institutionId === inst.id);
      const activeBureaus = [...new Set(instCases.map(c => c.bureau))];
      const hasOverdue = instCases.some(c => c.status === 'overdue');
      const urgentCount = instCases.filter(c => c.priority === 'urgent' && c.status !== 'disposed').length;

      // Risk level calculation
      let riskLevel: 'high' | 'medium' | 'normal' = 'normal';
      if (activeBureaus.length >= 3 || hasOverdue || urgentCount > 0) {
        riskLevel = 'high';
      } else if (activeBureaus.length >= 2 || instCases.length >= 2) {
        riskLevel = 'medium';
      }

      return {
        ...inst,
        caseCount: instCases.length,
        activeBureaus,
        hasOverdue,
        urgentCount,
        riskLevel,
      };
    });
  }, [cases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allInstitutions;
    const q = search.toLowerCase();
    return allInstitutions.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.region.toLowerCase().includes(q)
    );
  }, [allInstitutions, search]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Institution Directory</h1>
          <p className="page-subtitle">
            Consolidated 360° oversight for {allInstitutions.length} technical universities and polytechnics
          </p>
        </div>
      </div>

      <div className="card filter-bar-card" style={{ marginBottom: 20 }}>
        <div className="filter-bar-content">
          <div className="filter-search-field" style={{ maxWidth: 380 }}>
            <Search size={15} className="filter-search-icon" />
            <input
              id="institutions-search"
              type="text"
              className="form-control filter-input"
              placeholder="Search by institution name, permanent ID, or region…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="institutions-card-grid">
        {filtered.map(inst => (
          <div
            key={inst.id}
            className="institution-grid-card"
            onClick={() => onNavigate('institution-profile', inst.id)}
          >
            <div className="inst-card-top">
              <div className="inst-avatar-circle">{inst.name[0]}</div>
              <div className="inst-header-text">
                <div className="inst-card-name">{inst.name}</div>
                <div className="inst-card-sub">
                  <span className="inst-id-tag">{inst.id}</span>
                  <span className="inst-region-tag">
                    <MapPin size={11} /> {inst.region}
                  </span>
                </div>
              </div>
              {inst.riskLevel === 'high' && (
                <span className="badge badge-alert" title="Multiple cross-bureau investigations active">
                  High Scrutiny
                </span>
              )}
            </div>

            <div className="inst-metrics-row">
              <div className="inst-metric-pill">
                <FileText size={13} className="text-violet" />
                <span>{inst.caseCount} Case{inst.caseCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="inst-metric-pill">
                <GitBranch size={13} className="text-cyan" />
                <span>{inst.activeBureaus.length} Bureau{inst.activeBureaus.length !== 1 ? 's' : ''}</span>
              </div>
              {inst.hasOverdue && (
                <div className="inst-metric-pill rose">
                  <AlertTriangle size={13} />
                  <span>SLA Overdue</span>
                </div>
              )}
            </div>

            <div className="inst-bureaus-tags">
              {inst.activeBureaus.map(b => (
                <span key={b} className="bureau-pill">
                  {b}
                </span>
              ))}
            </div>

            <div className="inst-card-footer">
              <span className="inst-footer-link">Open 360° Profile</span>
              <ArrowRight size={14} className="inst-footer-arrow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 360° Consolidated Institution Profile ────────────────────────────────────

interface InstitutionProfileProps {
  institutionId: string;
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

export function InstitutionProfile({ institutionId, onNavigate }: InstitutionProfileProps) {
  const { cases, overlaps } = useApp();
  const [activeTab, setActiveTab] = useState<'cases' | 'overlaps' | 'history'>('cases');

  // Find institution info from SAMPLE_INSTITUTIONS or derive from cases
  const instCases = cases.filter(c => c.institutionId === institutionId);
  const sampleInst = SAMPLE_INSTITUTIONS.find(i => i.id === institutionId);

  const institutionName =
    sampleInst?.name || instCases[0]?.institutionName || 'Technical Institution';
  const region = sampleInst?.region || instCases[0]?.region || 'Central';

  const activeBureaus = [...new Set(instCases.map(c => c.bureau))];

  // Overlaps involving this institution's cases
  const instCaseIds = new Set(instCases.map(c => c.id));
  const institutionOverlaps = overlaps.filter(
    o => instCaseIds.has(o.caseAId) || instCaseIds.has(o.caseBId)
  );

  // Full chronological audit history across all cases for this institution
  const fullHistory = useMemo(() => {
    const events = instCases.flatMap(c =>
      c.auditHistory.map(evt => ({ ...evt, caseId: c.id, bureau: c.bureau }))
    );
    return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [instCases]);

  if (instCases.length === 0 && !sampleInst) {
    return (
      <div className="page-content">
        <button className="back-btn" onClick={() => onNavigate('institutions')}>
          <ArrowLeft size={15} /> Back to Institutions
        </button>
        <div className="empty-state">
          <div className="empty-icon">
            <Building2 size={26} />
          </div>
          <div className="empty-title">Institution records not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => onNavigate('institutions')}>
        <ArrowLeft size={15} /> Back to Institution Directory
      </button>

      {/* Hero 360° Institutional Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="profile-header">
          <div className="profile-avatar">{institutionName[0]}</div>
          <div className="profile-info">
            <div className="profile-title-row">
              <span className="profile-name">{institutionName}</span>
              <span className="badge badge-disposed">AICTE Permanent ID: {institutionId}</span>
              {activeBureaus.length >= 2 && (
                <span className="badge badge-alert">
                  ⚠️ Potential Overlapping Cases – Coordination Required ({activeBureaus.length} Bureaus)
                </span>
              )}
            </div>

            <div className="profile-meta">
              <div className="profile-meta-item">
                <MapPin size={13} className="text-violet" />
                <span>{region} Regional Office</span>
              </div>
              <div className="profile-meta-item">
                <FileText size={13} className="text-cyan" />
                <span>{instCases.length} total regulatory cases on record</span>
              </div>
              <div className="profile-meta-item">
                <GitBranch size={13} className="text-emerald" />
                <span>{institutionOverlaps.length} cross-bureau overlap link(s) flagged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bureau Tags Bar */}
        <div style={{ padding: '0 24px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
            Involved Divisions:
          </span>
          {activeBureaus.map(b => (
            <span key={b} className="bureau-chip">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <FileText size={14} />
          Cases Dossier ({instCases.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'overlaps' ? 'active' : ''}`}
          onClick={() => setActiveTab('overlaps')}
        >
          <GitBranch size={14} />
          Potential Overlaps ({institutionOverlaps.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={14} />
          Unified 360° Audit Trail ({fullHistory.length})
        </button>
      </div>

      {/* Tab 1: Cases Table */}
      {activeTab === 'cases' && (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Bureau</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th>Received</th>
                  <th>SLA Deadline</th>
                </tr>
              </thead>
              <tbody>
                {instCases.map(c => (
                  <tr
                    key={c.id}
                    className="table-row-hover"
                    onClick={() => onNavigate('case-detail', c.id)}
                  >
                    <td>
                      <span className="case-id-badge">{c.id}</span>
                    </td>
                    <td>
                      <span className="bureau-chip">{c.bureau}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{c.category}</td>
                    <td>
                      <span className={`badge ${priorityColor(c.priority)}`}>
                        {priorityLabel(c.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td className="table-officer">{c.assignedOfficer}</td>
                    <td className="table-date">{formatDate(c.receivedDate)}</td>
                    <td className="table-date">{formatDate(c.expectedDisposalDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Institution Overlaps */}
      {activeTab === 'overlaps' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cross-Bureau Connections for {institutionName}</span>
          </div>
          <div className="card-body">
            {institutionOverlaps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <GitBranch size={26} />
                </div>
                <div className="empty-title">No candidate overlaps for this institution</div>
                <div className="empty-desc">
                  Deterministic and semantic models have not identified any co-occurring complaints.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {institutionOverlaps.map(ovl => (
                  <div key={ovl.id} className="overlap-card">
                    <div className="overlap-card-header">
                      <div className="overlap-cases">
                        <span
                          className="case-id-highlight"
                          onClick={() => onNavigate('case-detail', ovl.caseAId)}
                        >
                          {ovl.caseAId}
                        </span>
                        <span className="overlap-separator">⇄</span>
                        <span
                          className="case-id-highlight"
                          onClick={() => onNavigate('case-detail', ovl.caseBId)}
                        >
                          {ovl.caseBId}
                        </span>
                      </div>
                      <span className={`badge badge-method`}>{ovl.matchMethod}</span>
                      <span className="badge badge-review">{ovl.reviewDecision.toUpperCase()}</span>
                    </div>
                    <div className="overlap-evidence">{ovl.evidence}</div>
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate('overlap-watch')}
                      >
                        Open in Overlap Intelligence Center →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Unified 360° History */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Consolidated Institutional Audit Timeline</span>
          </div>
          <div className="card-body">
            <div className="audit-timeline-flow">
              {fullHistory.map((evt, idx) => (
                <div key={`${evt.caseId}-${evt.id}`} className="audit-flow-item">
                  <div className="flow-indicator">
                    <div className="flow-dot" />
                    {idx < fullHistory.length - 1 && <div className="flow-line" />}
                  </div>
                  <div className="flow-content">
                    <div className="flow-header">
                      <span className="flow-actor">{evt.actor}</span>
                      <span className="flow-action">{evt.action}</span>
                      <span className="case-id-badge" style={{ fontSize: '0.7rem' }}>
                        {evt.caseId} ({evt.bureau})
                      </span>
                      <span className="flow-time">{formatDateTime(evt.timestamp)}</span>
                    </div>
                    {evt.note && <div className="flow-note">{evt.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
