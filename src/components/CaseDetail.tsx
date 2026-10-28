// OneDesk — Enterprise Case Dossier & Audit Log
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  GitBranch,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Save,
  Shield,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDate,
  formatDateTime,
  statusLabel,
  statusColor,
  priorityLabel,
  priorityColor,
  daysUntilDeadline,
} from '../utils/helpers';
import type { CaseStatus, CasePriority } from '../types';
import type { ViewName } from './Sidebar';

const STATUS_OPTIONS: CaseStatus[] = ['pending', 'in-process', 'disposed', 'overdue'];
const PRIORITY_OPTIONS: CasePriority[] = ['urgent', 'high', 'medium', 'low'];

interface CaseDetailProps {
  caseId: string;
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

export function CaseDetail({ caseId, onNavigate }: CaseDetailProps) {
  const { cases, overlaps, updateCase, appendAuditEvent, currentUser } = useApp();
  const caseItem = cases.find(c => c.id === caseId);

  const [newStatus, setNewStatus] = useState<CaseStatus | ''>('');
  const [newPriority, setNewPriority] = useState<CasePriority | ''>('');
  const [newAction, setNewAction] = useState('');
  const [newNote, setNewNote] = useState('');
  const [actorName, setActorName] = useState(currentUser?.name || 'Compliance Officer');
  const [saved, setSaved] = useState(false);

  if (!caseItem) {
    return (
      <div className="page-content">
        <button className="back-btn" onClick={() => onNavigate('register')}>
          <ArrowLeft size={15} /> Back to Register
        </button>
        <div className="empty-state">
          <div className="empty-icon">
            <AlertCircle size={26} />
          </div>
          <div className="empty-title">Case record not found</div>
          <div className="empty-desc">Reference {caseId} does not exist in the active dataset.</div>
        </div>
      </div>
    );
  }

  // Cross-bureau overlaps involving this case
  const relatedOverlaps = overlaps.filter(o => o.caseAId === caseItem.id || o.caseBId === caseItem.id);

  const daysLeft = daysUntilDeadline(caseItem.expectedDisposalDate);

  function handleSave() {
    if (!newAction.trim()) return;

    const updates: { status?: CaseStatus; priority?: CasePriority } = {};
    if (newStatus && newStatus !== caseItem!.status) {
      updates.status = newStatus;
    }
    if (newPriority && newPriority !== caseItem!.priority) {
      updates.priority = newPriority;
    }

    if (Object.keys(updates).length > 0) {
      updateCase(caseItem!.id, updates);
    }

    appendAuditEvent(caseItem!.id, {
      actor: actorName.trim() || currentUser?.name || 'Compliance Officer',
      action: newAction.trim(),
      note: newNote.trim() || undefined,
    });

    setNewStatus('');
    setNewPriority('');
    setNewAction('');
    setNewNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => onNavigate('register')}>
        <ArrowLeft size={15} /> Back to Complaint Register
      </button>

      {/* Header Profile Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="profile-header">
          <div className="profile-avatar">{caseItem.id.replace(/^CASE-\d{4}-/, '')}</div>
          <div className="profile-info">
            <div className="profile-title-row">
              <span className="profile-name">{caseItem.id}</span>
              <span className={`badge ${priorityColor(caseItem.priority)}`}>
                Priority: {priorityLabel(caseItem.priority)}
              </span>
              <span className={`badge ${statusColor(caseItem.status)}`}>{statusLabel(caseItem.status)}</span>
              <span className="badge badge-disposed">{caseItem.bureau}</span>
            </div>

            <div className="profile-meta">
              <div className="profile-meta-item">
                <Building2 size={14} className="text-violet" />
                <button
                  className="btn-text-link"
                  onClick={() => onNavigate('institution-profile', caseItem.institutionId)}
                >
                  {caseItem.institutionName} ({caseItem.institutionId})
                </button>
              </div>
              <div className="profile-meta-item">
                <Shield size={14} className="text-cyan" />
                <span>Jurisdiction: {caseItem.region} Regional Office</span>
              </div>
              <div className="profile-meta-item">
                <User size={14} className="text-muted" />
                <span>Officer: {caseItem.assignedOfficer}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-bureau Overlap Alert Callout (if any overlaps exist) */}
      {relatedOverlaps.length > 0 && (
        <div className="overlap-case-callout" style={{ marginBottom: 20 }}>
          <div className="overlap-callout-icon">
            <GitBranch size={20} className="text-violet" />
          </div>
          <div className="overlap-callout-body">
            <div className="overlap-callout-title">
              <span>Potential Overlapping Cases – Coordination Required ({relatedOverlaps.length} connection)</span>
              <span className="badge badge-alert">Coordination Required</span>
            </div>
            <p className="overlap-callout-desc">
              This case has been matched with other AICTE complaints concerning{' '}
              <strong>{caseItem.institutionName}</strong> or thematic subject matter.
            </p>
            <div className="overlap-links-row">
              {relatedOverlaps.map(ovl => {
                const otherId = ovl.caseAId === caseItem.id ? ovl.caseBId : ovl.caseAId;
                return (
                  <button
                    key={ovl.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('overlap-watch')}
                  >
                    Inspect Link with {otherId} (Decision: {ovl.reviewDecision.toUpperCase()}) →
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Triage Form */}
      <div className="case-detail-grid">
        {/* Left Column: Dossier Details & Timeline */}
        <div className="case-left-col">
          {/* Key Dates & SLA Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">SLA & Disposal Benchmarks</span>
            </div>
            <div className="card-body">
              <div className="case-dates-grid">
                <div className="date-tile">
                  <div className="date-tile-label">Received Date</div>
                  <div className="date-tile-val">{formatDate(caseItem.receivedDate)}</div>
                </div>
                <div className="date-tile">
                  <div className="date-tile-label">Target Disposal</div>
                  <div className="date-tile-val">{formatDate(caseItem.expectedDisposalDate)}</div>
                </div>
                <div className="date-tile">
                  <div className="date-tile-label">SLA Window</div>
                  <div className={`date-tile-val ${daysLeft < 0 ? 'text-rose' : daysLeft < 15 ? 'text-amber' : ''}`}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}
                  </div>
                </div>
                <div className="date-tile">
                  <div className="date-tile-label">Complainant Group</div>
                  <div className="date-tile-val">{caseItem.complainantType || 'Student / Faculty'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Narrative */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Complaint Narrative & Allegations</span>
              <span className="cat-chip">{caseItem.category}</span>
            </div>
            <div className="card-body">
              <p className="case-narrative-text">{caseItem.description}</p>
              <div className="case-latest-banner">
                <strong>Current Status Quo:</strong> {caseItem.latestAction}
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Clock size={16} className="text-violet" />
                <span className="card-title">Chronological Audit History ({caseItem.auditHistory.length})</span>
              </div>
            </div>
            <div className="card-body">
              <div className="audit-timeline-flow">
                {caseItem.auditHistory.map((ev, index) => (
                  <div key={ev.id} className="audit-flow-item">
                    <div className="flow-indicator">
                      <div className="flow-dot" />
                      {index < caseItem.auditHistory.length - 1 && <div className="flow-line" />}
                    </div>
                    <div className="flow-content">
                      <div className="flow-header">
                        <span className="flow-actor">{ev.actor}</span>
                        <span className="flow-action">{ev.action}</span>
                        <span className="flow-time">{formatDateTime(ev.timestamp)}</span>
                      </div>
                      {ev.note && <div className="flow-note">{ev.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case Management & Triage Actions */}
        <div className="case-right-col">
          <div className="card sticky-card">
            <div className="card-header">
              <div className="card-title-group">
                <Layers size={16} className="text-cyan" />
                <span className="card-title">Triage & Status Update</span>
              </div>
            </div>

            <div className="card-body">
              {saved && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <CheckCircle2 size={16} />
                  <span>Case status and audit event saved!</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Update Case Status</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as CaseStatus | '')}
                >
                  <option value="">Keep current: {statusLabel(caseItem.status)}</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      Change to: {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Update Triage Priority</label>
                <select
                  className="form-control"
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as CasePriority | '')}
                >
                  <option value="">Keep current: {priorityLabel(caseItem.priority)}</option>
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>
                      Change to: {priorityLabel(p)} Priority
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Statutory Action / Update *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Inquiry committee submitted report"
                  value={newAction}
                  onChange={e => setNewAction(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Internal Officer Note (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Private regulatory remarks or findings..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Officer Signature / Actor Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={actorName}
                  onChange={e => setActorName(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleSave}
                disabled={!newAction.trim()}
              >
                <Save size={15} /> Save Regulatory Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
