// OneDesk — Enterprise Command Center Overview Dashboard
import { useMemo, useState } from 'react';
import {
  FileStack,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  computeMetrics,
  formatDate,
  statusLabel,
  statusColor,
  priorityLabel,
  priorityColor,
} from '../utils/helpers';
import type { ViewName } from './Sidebar';
import type { Bureau } from '../types';

interface OverviewProps {
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

const ALL_BUREAUS: Bureau[] = [
  'Regulation Bureau (RB)',
  'Public Grievance Redressal Cell (PGRC)',
  'Approval Bureau',
  'Anti-Ragging Cell',
  'Grievance Cell',
  'Faculty Affairs Bureau',
  'Infrastructure Bureau',
  'Examination Bureau',
];

export function Overview({ onNavigate }: OverviewProps) {
  const { cases, overlaps } = useApp();

  const metrics = useMemo(() => computeMetrics(cases), [cases]);
  const pendingOverlaps = overlaps.filter(o => o.reviewDecision === 'pending').length;

  // Monthly complaint counts for SVG sparkline / area chart
  const trendData = [
    { month: 'May', count: 1 },
    { month: 'Jun', count: 3 },
    { month: 'Jul', count: 2 },
    { month: 'Aug', count: 5 },
    { month: 'Sep', count: 8 },
    { month: 'Oct', count: cases.length },
  ];

  // Bureau workload distribution
  const bureauData = useMemo(() => {
    return ALL_BUREAUS.map(bureau => {
      const bCases = cases.filter(c => c.bureau === bureau);
      const active = bCases.filter(c => c.status !== 'disposed').length;
      return {
        bureau,
        total: bCases.length,
        active,
        pct: cases.length > 0 ? Math.round((bCases.length / cases.length) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [cases]);

  // Urgent cases requiring immediate attention
  const urgentCases = useMemo(() => {
    return cases
      .filter(c => c.status !== 'disposed' && (c.priority === 'urgent' || c.status === 'overdue'))
      .slice(0, 4);
  }, [cases]);

  // Recent case activity (sorted descending by received date)
  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
      .slice(0, 5);
  }, [cases]);

  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(null);

  return (
    <div className="page-content">
      {/* Page Title & Status */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Executive Command Center</h1>
          <p className="page-subtitle">
            Consolidated regulatory intelligence and multi-bureau grievance monitoring across India
          </p>
        </div>
        <div className="live-pulse-badge">
          <span className="dot-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* ── Callout Banner: Review Potential Overlaps ───────────────────────── */}
      <div className="overlap-hero-banner">
        <div className="overlap-banner-content">
          <div className="overlap-banner-icon">
            <GitBranch size={24} className="text-violet" />
          </div>
          <div className="overlap-banner-text">
            <div className="overlap-banner-title">
              <span>Cross-Bureau Overlap Engine</span>
              <span className="badge badge-overlap-count">{pendingOverlaps} Pending Review</span>
            </div>
            <p className="overlap-banner-desc">
              Heuristic and semantic models have detected {pendingOverlaps} potential duplicate or co-occurring
              investigations involving common institutions across AICTE bureaus.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary overlap-banner-btn"
          onClick={() => onNavigate('overlap-watch')}
        >
          Review Potential Overlaps <ArrowRight size={15} />
        </button>
      </div>

      {/* ── KPI Command Metrics Grid ────────────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-header">
            <span className="kpi-label">Total Complaints</span>
            <div className="kpi-icon-pill"><FileStack size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value">{metrics.total}</span>
            <span className="kpi-trend positive"><TrendingUp size={12} /> +18% MoM</span>
          </div>
          <div className="kpi-sub">Across 6 AICTE divisions</div>
        </div>

        <div className="kpi-card kpi-open">
          <div className="kpi-header">
            <span className="kpi-label">Active / Open</span>
            <div className="kpi-icon-pill text-cyan"><Clock size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value">{metrics.openCases}</span>
            <span className="kpi-sub-pill">{metrics.pending} New</span>
          </div>
          <div className="kpi-sub">Ongoing investigations</div>
        </div>

        <div className="kpi-card kpi-awaiting">
          <div className="kpi-header">
            <span className="kpi-label">Awaiting Triage</span>
            <div className="kpi-icon-pill text-amber"><AlertCircle size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value">{metrics.awaitingAction}</span>
            <span className="kpi-sub-pill amber">SLA Watch</span>
          </div>
          <div className="kpi-sub">Pending initial acknowledgment</div>
        </div>

        <div className="kpi-card kpi-disposed">
          <div className="kpi-header">
            <span className="kpi-label">Resolved / Disposed</span>
            <div className="kpi-icon-pill text-emerald"><CheckCircle2 size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value">{metrics.disposed}</span>
            <span className="kpi-trend positive"><Sparkles size={12} /> Closed</span>
          </div>
          <div className="kpi-sub">Corrective actions certified</div>
        </div>

        <div className="kpi-card kpi-overdue">
          <div className="kpi-header">
            <span className="kpi-label">SLA Overdue</span>
            <div className="kpi-icon-pill text-rose"><AlertTriangle size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value text-rose">{metrics.overdue}</span>
            <span className="kpi-trend negative">Urgent</span>
          </div>
          <div className="kpi-sub">Exceeded statutory window</div>
        </div>

        <div className="kpi-card kpi-rate">
          <div className="kpi-header">
            <span className="kpi-label">Resolution Rate</span>
            <div className="kpi-icon-pill text-violet"><BarChart2 size={16} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-value">{metrics.resolutionRate}%</span>
            <div className="kpi-progress-ring">
              <div
                className="kpi-ring-bar"
                style={{ width: `${metrics.resolutionRate}%` }}
              />
            </div>
          </div>
          <div className="kpi-sub">Historical disposal velocity</div>
        </div>
      </div>

      {/* ── Charts & Visualizations Row ─────────────────────────────────────── */}
      <div className="dashboard-charts-grid">
        {/* Trend Area Chart (Custom Responsive SVG) */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <span className="card-title">Complaint Intake Velocity</span>
              <p className="card-subtitle">Cumulative case registrations over current evaluation cycle</p>
            </div>
            <div className="reporting-tag">AY 2026-27</div>
          </div>

          <div className="card-body">
            <div className="svg-chart-container">
              <svg viewBox="0 0 500 180" className="trend-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="rgba(255,255,255,0.12)" />

                {/* Shaded Area */}
                <path
                  d="M 50 145 L 130 125 L 210 135 L 290 100 L 370 65 L 450 35 L 450 150 L 50 150 Z"
                  fill="url(#violetGradient)"
                />

                {/* Line Path */}
                <path
                  d="M 50 145 L 130 125 L 210 135 L 290 100 L 370 65 L 450 35"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {[
                  { cx: 50, cy: 145, label: 'May', val: 1 },
                  { cx: 130, cy: 125, label: 'Jun', val: 3 },
                  { cx: 210, cy: 135, label: 'Jul', val: 2 },
                  { cx: 290, cy: 100, label: 'Aug', val: 5 },
                  { cx: 370, cy: 65, label: 'Sep', val: 8 },
                  { cx: 450, cy: 35, label: 'Oct', val: cases.length },
                ].map((pt, idx) => (
                  <g
                    key={pt.label}
                    onMouseEnter={() => setActiveChartPoint(idx)}
                    onMouseLeave={() => setActiveChartPoint(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r={activeChartPoint === idx ? 6 : 4}
                      fill="#06b6d4"
                      stroke="#0e1118"
                      strokeWidth="2"
                    />
                    <text x={pt.cx} y="168" fill="#94a3b8" fontSize="11" textAnchor="middle">
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>

              {activeChartPoint !== null && (
                <div className="chart-hover-tooltip">
                  {trendData[activeChartPoint].month}: {trendData[activeChartPoint].count} complaints registered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority & Triage Distribution */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <span className="card-title">Priority Breakdown</span>
              <p className="card-subtitle">Active investigations by urgency level</p>
            </div>
          </div>

          <div className="card-body">
            <div className="priority-bars-stack">
              <div className="priority-row">
                <div className="priority-label-group">
                  <span className="dot-priority urgent" />
                  <span className="priority-text">Urgent Priority</span>
                </div>
                <span className="priority-count-badge urgent">{metrics.priorityBreakdown.urgent} cases</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill urgent"
                  style={{
                    width: `${metrics.openCases > 0 ? (metrics.priorityBreakdown.urgent / metrics.openCases) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="priority-row">
                <div className="priority-label-group">
                  <span className="dot-priority high" />
                  <span className="priority-text">High Priority</span>
                </div>
                <span className="priority-count-badge high">{metrics.priorityBreakdown.high} cases</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill high"
                  style={{
                    width: `${metrics.openCases > 0 ? (metrics.priorityBreakdown.high / metrics.openCases) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="priority-row">
                <div className="priority-label-group">
                  <span className="dot-priority medium" />
                  <span className="priority-text">Medium Priority</span>
                </div>
                <span className="priority-count-badge medium">{metrics.priorityBreakdown.medium} cases</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill medium"
                  style={{
                    width: `${metrics.openCases > 0 ? (metrics.priorityBreakdown.medium / metrics.openCases) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="priority-row">
                <div className="priority-label-group">
                  <span className="dot-priority low" />
                  <span className="priority-text">Low Priority</span>
                </div>
                <span className="priority-count-badge low">{metrics.priorityBreakdown.low} cases</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill low"
                  style={{
                    width: `${metrics.openCases > 0 ? (metrics.priorityBreakdown.low / metrics.openCases) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bureau Workload Distribution ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <span className="card-title">Bureau & Cell Caseload</span>
            <p className="card-subtitle">Workload distribution across all specialized AICTE divisions</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('register')}>
            View in Register →
          </button>
        </div>

        <div className="card-body">
          <div className="bureau-bars-grid">
            {bureauData.map(b => (
              <div key={b.bureau} className="bureau-bar-item">
                <div className="bureau-bar-header">
                  <span className="bureau-name">{b.bureau}</span>
                  <div className="bureau-count-group">
                    <span className="bureau-active-count">{b.active} active</span>
                    <span className="bureau-total-count">({b.total} total)</span>
                  </div>
                </div>
                <div className="bureau-track">
                  <div className="bureau-fill" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Split: Urgent Cases vs Recent Activity ──────────────────── */}
      <div className="dashboard-bottom-grid">
        {/* Urgent Attention Cases */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <AlertTriangle size={16} className="text-rose" />
              <span className="card-title">Urgent Attention Required</span>
            </div>
            <span className="card-subtitle" style={{ margin: 0 }}>
              {urgentCases.length} prioritized
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {urgentCases.length === 0 ? (
              <div className="empty-state-sm">No critical SLA escalations at this time.</div>
            ) : (
              <div className="urgent-list">
                {urgentCases.map(c => (
                  <div
                    key={c.id}
                    className="urgent-row-item"
                    onClick={() => onNavigate('case-detail', c.id)}
                  >
                    <div className="urgent-info">
                      <div className="urgent-title-row">
                        <span className="case-id-tag">{c.id}</span>
                        <span className={`badge ${priorityColor(c.priority)}`}>
                          {priorityLabel(c.priority)}
                        </span>
                        <span className={`badge ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                      </div>
                      <div className="urgent-inst-name">{c.institutionName}</div>
                      <div className="urgent-bureau-cat">
                        {c.bureau} · {c.category}
                      </div>
                    </div>
                    <ArrowRight size={14} className="urgent-arrow" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Clock size={16} className="text-cyan" />
              <span className="card-title">Recent Case Activity</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('activity-log')}>
              Full Trail →
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="recent-activity-list">
              {recentCases.map(c => (
                <div
                  key={c.id}
                  className="activity-feed-row"
                  onClick={() => onNavigate('case-detail', c.id)}
                >
                  <div className="feed-avatar">
                    <Building2 size={13} />
                  </div>
                  <div className="feed-content">
                    <div className="feed-top-line">
                      <span className="feed-case-id">{c.id}</span>
                      <span className="feed-inst">{c.institutionName}</span>
                    </div>
                    <div className="feed-action-text">{c.latestAction}</div>
                    <div className="feed-meta">
                      {c.bureau} · {formatDate(c.receivedDate)} · {c.assignedOfficer}
                    </div>
                  </div>
                  <span className={`badge badge-sm ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
