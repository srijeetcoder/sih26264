// OneDesk — Live Complaint Lodging (Mail-Compose Style Floating Popup)
import { useState } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Building2,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Mail,
  Shield,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAMPLE_INSTITUTIONS } from '../data/sampleData';
import type { Bureau, CasePriority } from '../types';
import { format, addDays } from 'date-fns';

const BUREAUS: Bureau[] = [
  'Regulation Bureau (RB)',
  'Public Grievance Redressal Cell (PGRC)',
  'Approval Bureau',
  'Anti-Ragging Cell',
  'Grievance Cell',
  'Faculty Affairs Bureau',
  'Infrastructure Bureau',
  'Examination Bureau',
];

const COMPLAINANT_TYPES = [
  'Student Body',
  'Faculty Member',
  'Parent Council',
  'State Directorate Inspector',
  'Citizen / Whistleblower',
  'Internal AICTE Audit',
];

interface LodgeComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated?: (caseId: string) => void;
}

export function LodgeComplaintModal({ isOpen, onClose, onCaseCreated }: LodgeComplaintModalProps) {
  const { cases, addCase, currentUser } = useApp();

  // Window states (Mail Compose: docked bottom-right by default, minimizable, maximizable)
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Form states
  const [institutionMode, setInstitutionMode] = useState<'existing' | 'custom'>('existing');
  const [selectedInstId, setSelectedInstId] = useState(SAMPLE_INSTITUTIONS[0].id);
  const [customInstName, setCustomInstName] = useState('');
  const [customInstId, setCustomInstId] = useState('');
  const [region, setRegion] = useState('Southern');

  const [bureau, setBureau] = useState<Bureau>('Regulation Bureau (RB)');
  const [category, setCategory] = useState('Affiliation Compliance');
  const [priority, setPriority] = useState<CasePriority>('high');
  const [complainantType, setComplainantType] = useState(COMPLAINANT_TYPES[0]);
  const [disposalDays, setDisposalDays] = useState(90);
  const [assignedOfficer, setAssignedOfficer] = useState('Dr. Meera Krishnan');
  const [description, setDescription] = useState('');
  const [initialAction, setInitialAction] = useState('Formal notice served to institution administration');

  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Real-time check: does this institution already have active cases in other bureaus?
  const currentInstId = institutionMode === 'existing' ? selectedInstId : customInstId.trim();
  const currentInstName =
    institutionMode === 'existing'
      ? SAMPLE_INSTITUTIONS.find(i => i.id === selectedInstId)?.name || 'Unknown Institute'
      : customInstName.trim() || 'New Technical Institute';

  const otherBureauCases = cases.filter(
    c => c.institutionId === currentInstId && c.status !== 'disposed' && c.bureau !== bureau
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);

    const instId =
      institutionMode === 'existing'
        ? selectedInstId
        : customInstId.trim() || `INST-${Math.floor(1000 + Math.random() * 9000)}`;

    const receivedDate = format(new Date(), 'yyyy-MM-dd');
    const expectedDisposalDate = format(addDays(new Date(), disposalDays), 'yyyy-MM-dd');

    const created = addCase({
      institutionId: instId,
      institutionName: currentInstName,
      region,
      bureau,
      category: category.trim() || 'General Regulatory Grievance',
      priority,
      complainantType,
      assignedOfficer: assignedOfficer.trim() || currentUser?.name || 'Assigned Officer',
      status: 'pending',
      receivedDate,
      expectedDisposalDate,
      latestAction: initialAction.trim() || 'Case registered on AICTE central registry',
      description: description.trim(),
    });

    setCreatedCaseId(created.id);
    setSubmitting(false);
  };

  const handleResetAndClose = () => {
    setCreatedCaseId(null);
    setDescription('');
    setIsMinimized(false);
    setIsMaximized(false);
    onClose();
  };

  const handleLodgeAnother = () => {
    setCreatedCaseId(null);
    setDescription('');
    setCategory('General Compliance');
  };

  // ── Render Minimized State (Gmail bottom docked tab) ─────────────────────────
  if (isMinimized) {
    return (
      <div className="mail-compose-minimized" onClick={() => setIsMinimized(false)}>
        <div className="compose-min-left">
          <Mail size={15} className="text-violet" />
          <span className="compose-min-title">
            Draft: {currentInstName ? currentInstName.slice(0, 26) : 'New Complaint'}
          </span>
          <span className="compose-min-badge">AY 2026-27</span>
        </div>
        <div className="compose-min-controls" onClick={e => e.stopPropagation()}>
          <button
            className="compose-ctrl-btn"
            onClick={() => setIsMinimized(false)}
            title="Restore compose window"
            aria-label="Restore"
          >
            <Maximize2 size={12} />
          </button>
          <button
            className="compose-ctrl-btn"
            onClick={handleResetAndClose}
            title="Discard and close"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render Normal or Maximized Compose Window ────────────────────────────────
  return (
    <div className={`mail-compose-backdrop ${isMaximized ? 'is-maximized-backdrop' : ''}`}>
      <div
        className={`mail-compose-window ${isMaximized ? 'window-maximized' : 'window-docked'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
      >
        {/* Header Bar (Gmail / Webmail Style) */}
        <div className="mail-compose-header">
          <div className="compose-header-left">
            <div className="compose-mail-icon">
              <Mail size={16} />
            </div>
            <div>
              <span id="compose-title" className="compose-header-title">
                New Regulatory Complaint Dossier
              </span>
              <span className="compose-header-pill">AY 2026-27</span>
            </div>
          </div>

          <div className="compose-header-actions">
            <button
              type="button"
              className="compose-ctrl-btn"
              onClick={() => setIsMinimized(true)}
              title="Minimize to bottom dock"
              aria-label="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              className="compose-ctrl-btn"
              onClick={() => setIsMaximized(m => !m)}
              title={isMaximized ? 'Restore docked window' : 'Maximize window'}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              type="button"
              className="compose-ctrl-btn close-btn"
              onClick={handleResetAndClose}
              title="Close window"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Success Confirmation Screen */}
        {createdCaseId ? (
          <div className="compose-success-body">
            <div className="success-icon-badge">
              <CheckCircle2 size={44} className="text-emerald" />
            </div>
            <h3 className="success-title">Complaint Successfully Registered!</h3>
            <p className="success-desc">
              Reference ID <span className="highlight-pill">{createdCaseId}</span> has been logged to the central
              AICTE regulatory repository for <strong>AY 2026-27</strong>.
            </p>

            {otherBureauCases.length > 0 && (
              <div className="success-overlap-notice">
                <AlertTriangle size={16} className="text-amber" />
                <div>
                  <strong>Potential Overlapping Cases Flagged</strong>
                  <p>
                    {currentInstName} already has active proceedings in{' '}
                    {otherBureauCases.map(c => c.bureau).join(', ')}. Coordination between bureaus has been recorded.
                  </p>
                </div>
              </div>
            )}

            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onCaseCreated?.(createdCaseId);
                  handleResetAndClose();
                }}
              >
                Open Case Dossier <ArrowRight size={13} />
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLodgeAnother}>
                <RotateCcw size={13} /> Lodge Another
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleResetAndClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form (Email Compose Styled Rows) */
          <form onSubmit={handleSubmit} className="mail-compose-form">
            <div className="mail-compose-scroll">
              {/* Row 1: To (Institution Selector) */}
              <div className="mail-field-row">
                <span className="mail-field-label">
                  <Building2 size={14} className="text-violet" /> To:
                </span>
                <div className="mail-field-control">
                  <div className="compose-mode-toggle">
                    <button
                      type="button"
                      className={`mode-btn ${institutionMode === 'existing' ? 'active' : ''}`}
                      onClick={() => setInstitutionMode('existing')}
                    >
                      Known AICTE Institution
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${institutionMode === 'custom' ? 'active' : ''}`}
                      onClick={() => setInstitutionMode('custom')}
                    >
                      Custom Institution
                    </button>
                  </div>

                  {institutionMode === 'existing' ? (
                    <div className="compose-input-grid-2">
                      <select
                        className="compose-select"
                        value={selectedInstId}
                        onChange={e => {
                          setSelectedInstId(e.target.value);
                          const inst = SAMPLE_INSTITUTIONS.find(i => i.id === e.target.value);
                          if (inst) setRegion(inst.region);
                        }}
                      >
                        {SAMPLE_INSTITUTIONS.map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({inst.id} · {inst.region} Region)
                          </option>
                        ))}
                      </select>
                      <input
                        className="compose-input readonly"
                        value={`${region} Regional Office`}
                        readOnly
                        title="Jurisdictional Regional Directorate"
                      />
                    </div>
                  ) : (
                    <div className="compose-input-grid-2">
                      <input
                        className="compose-input"
                        placeholder="Institution Full Name (e.g. Sardar Patel Institute)*"
                        value={customInstName}
                        onChange={e => setCustomInstName(e.target.value)}
                        required
                      />
                      <input
                        className="compose-input"
                        placeholder="Permanent ID (e.g. INST-8821)"
                        value={customInstId}
                        onChange={e => setCustomInstId(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Bureau & Cell */}
              <div className="mail-field-row">
                <span className="mail-field-label">
                  <Shield size={14} className="text-cyan" /> Bureau:
                </span>
                <div className="mail-field-control">
                  <select
                    className="compose-select"
                    value={bureau}
                    onChange={e => setBureau(e.target.value as Bureau)}
                  >
                    {BUREAUS.map(b => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Subject / Complaint Category */}
              <div className="mail-field-row">
                <span className="mail-field-label">
                  <Layers size={14} className="text-amber" /> Subject:
                </span>
                <div className="mail-field-control">
                  <input
                    className="compose-input"
                    placeholder="Subject / Category (e.g. Fee Refund Dispute, Capitation Demand, Ragging)*"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Priority & Meta Grid */}
              <div className="mail-field-row">
                <span className="mail-field-label">Triage:</span>
                <div className="mail-field-control compose-meta-grid">
                  <div>
                    <label className="compose-sublabel">Priority Level</label>
                    <select
                      className="compose-select"
                      value={priority}
                      onChange={e => setPriority(e.target.value as CasePriority)}
                    >
                      <option value="urgent">🔴 Urgent (Immediate Escalation)</option>
                      <option value="high">🟠 High (Directorate Review)</option>
                      <option value="medium">🟡 Medium (Standard Track)</option>
                      <option value="low">🟢 Low (Routine Record)</option>
                    </select>
                  </div>

                  <div>
                    <label className="compose-sublabel">Complainant Source</label>
                    <select
                      className="compose-select"
                      value={complainantType}
                      onChange={e => setComplainantType(e.target.value)}
                    >
                      {COMPLAINANT_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="compose-sublabel">Assigned Officer</label>
                    <input
                      className="compose-input"
                      value={assignedOfficer}
                      onChange={e => setAssignedOfficer(e.target.value)}
                      placeholder="Officer Name"
                    />
                  </div>

                  <div>
                    <label className="compose-sublabel">SLA Window</label>
                    <input
                      type="number"
                      min="7"
                      max="180"
                      className="compose-input"
                      value={disposalDays}
                      onChange={e => setDisposalDays(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Overlap Detection Warning Banner */}
              {otherBureauCases.length > 0 && (
                <div className="compose-overlap-alert">
                  <AlertTriangle size={16} />
                  <div>
                    <div className="overlap-alert-title">
                      ⚠️ Potential Overlapping Cases – Coordination Required
                    </div>
                    <div className="overlap-alert-text">
                      <strong>{currentInstName}</strong> has {otherBureauCases.length} active case(s) in{' '}
                      <strong>{otherBureauCases.map(c => c.bureau).join(', ')}</strong>. Both bureaus will be linked
                      for coordinated review to prevent parallel or conflicting actions.
                    </div>
                  </div>
                </div>
              )}

              {/* Row 5: Narrative Description (Body of Mail) */}
              <div className="mail-body-row">
                <textarea
                  className="compose-textarea"
                  rows={isMaximized ? 8 : 5}
                  placeholder="Detail the alleged irregularity, dates of occurrence, affected departments, student numbers, statutory provisions breached, or AY 2026-27 specific issues..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Row 6: Initial Action Note */}
              <div className="mail-field-row" style={{ borderBottom: 'none' }}>
                <span className="mail-field-label">Action:</span>
                <div className="mail-field-control">
                  <input
                    className="compose-input"
                    value={initialAction}
                    onChange={e => setInitialAction(e.target.value)}
                    placeholder="Initial action / note (e.g. Issued 15-day show-cause notice)"
                  />
                </div>
              </div>
            </div>

            {/* Mail Compose Footer Toolbar (Gmail Style) */}
            <div className="mail-compose-footer">
              <div className="compose-footer-left">
                <button
                  type="submit"
                  className="btn btn-primary compose-send-btn"
                  disabled={submitting || !description.trim()}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Registering…' : 'Lodge Complaint'}</span>
                </button>
                <span className="compose-footer-hint">
                  {otherBureauCases.length > 0 ? '⚠️ Overlap flagged' : 'Central AICTE Registry'}
                </span>
              </div>

              <div className="compose-footer-right">
                <button
                  type="button"
                  className="compose-trash-btn"
                  onClick={() => {
                    if (confirm('Discard this complaint draft?')) {
                      handleResetAndClose();
                    }
                  }}
                  title="Discard draft"
                  aria-label="Discard"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
