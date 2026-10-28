// OneDesk — Live Complaint Lodging Modal
import { useState } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  GitBranch,
  CheckCircle2,
  Sparkles,
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
  const { addCase, currentUser } = useApp();

  const [institutionMode, setInstitutionMode] = useState<'existing' | 'custom'>('existing');
  const [selectedInstId, setSelectedInstId] = useState(SAMPLE_INSTITUTIONS[0].id);
  const [customInstName, setCustomInstName] = useState('');
  const [customInstId, setCustomInstId] = useState('');
  const [region, setRegion] = useState('Southern');

  const [bureau, setBureau] = useState<Bureau>('Approval Bureau');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);

    const instName =
      institutionMode === 'existing'
        ? SAMPLE_INSTITUTIONS.find(i => i.id === selectedInstId)?.name || 'Unknown Institute'
        : customInstName.trim() || 'New Technical Institute';

    const instId =
      institutionMode === 'existing'
        ? selectedInstId
        : customInstId.trim() || `INST-${Math.floor(1000 + Math.random() * 9000)}`;

    const receivedDate = format(new Date(), 'yyyy-MM-dd');
    const expectedDisposalDate = format(addDays(new Date(), disposalDays), 'yyyy-MM-dd');

    const created = addCase({
      institutionId: instId,
      institutionName: instName,
      region,
      bureau,
      category: category.trim() || 'General Regulatory Grievance',
      priority,
      complainantType,
      assignedOfficer: assignedOfficer.trim() || currentUser?.name || 'Assigned Officer',
      status: 'pending',
      receivedDate,
      expectedDisposalDate,
      latestAction: initialAction.trim() || 'Case registered on AICTE portal',
      description: description.trim(),
    });

    setCreatedCaseId(created.id);
    setSubmitting(false);
  };

  const handleResetAndClose = () => {
    setCreatedCaseId(null);
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <PlusCircle size={20} className="text-violet" />
            </div>
            <div>
              <h2 className="modal-title">Lodge Live Complaint</h2>
              <p className="modal-subtitle">
                Register an institutional case with real-time cross-bureau overlap analysis
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleResetAndClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {createdCaseId ? (
          <div className="modal-success-state">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={44} className="text-emerald" />
            </div>
            <h3 className="success-title">Complaint Successfully Registered!</h3>
            <p className="success-desc">
              Reference ID <span className="highlight-pill">{createdCaseId}</span> has been logged to the central
              AICTE registry, synced to your dashboard, and screened for cross-bureau overlaps.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onCaseCreated?.(createdCaseId);
                  handleResetAndClose();
                }}
              >
                View Case Dossier & Overlaps
              </button>
              <button className="btn btn-secondary" onClick={handleResetAndClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-section">
              <div className="form-section-title">
                <Building2 size={15} /> Institution Identity
              </div>

              <div className="radio-group-tabs">
                <button
                  type="button"
                  className={`radio-tab ${institutionMode === 'existing' ? 'active' : ''}`}
                  onClick={() => setInstitutionMode('existing')}
                >
                  Known AICTE Institution
                </button>
                <button
                  type="button"
                  className={`radio-tab ${institutionMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setInstitutionMode('custom')}
                >
                  Custom Institution
                </button>
              </div>

              {institutionMode === 'existing' ? (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Select Institution</label>
                    <select
                      className="form-control"
                      value={selectedInstId}
                      onChange={e => {
                        setSelectedInstId(e.target.value);
                        const inst = SAMPLE_INSTITUTIONS.find(i => i.id === e.target.value);
                        if (inst) setRegion(inst.region);
                      }}
                    >
                      {SAMPLE_INSTITUTIONS.map(inst => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.id} · {inst.region})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regional Directorate</label>
                    <input className="form-control" value={region} readOnly />
                  </div>
                </div>
              ) : (
                <div className="form-grid-3">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Institution Full Name *</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Sardar Patel Institute of Technology"
                      value={customInstName}
                      onChange={e => setCustomInstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">AICTE Permanent ID</label>
                    <input
                      className="form-control"
                      placeholder="INST-XXXX"
                      value={customInstId}
                      onChange={e => setCustomInstId(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <GitBranch size={15} /> Jurisdictional Bureau & Priority
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">AICTE Bureau / Cell *</label>
                  <select
                    className="form-control"
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
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    className="form-control"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Fee Refund, Seat Matrix, Ragging"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Triage Priority *</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={e => setPriority(e.target.value as CasePriority)}
                  >
                    <option value="urgent">🔴 Urgent (Immediate Escalation)</option>
                    <option value="high">🟠 High (Directorate Review)</option>
                    <option value="medium">🟡 Medium (Standard Processing)</option>
                    <option value="low">🟢 Low (Routine Record)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Complainant Group</label>
                  <select
                    className="form-control"
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
                <div className="form-group">
                  <label className="form-label">Assigned Officer</label>
                  <input
                    className="form-control"
                    value={assignedOfficer}
                    onChange={e => setAssignedOfficer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SLA Window (Days)</label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    className="form-control"
                    value={disposalDays}
                    onChange={e => setDisposalDays(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <Sparkles size={15} /> Complaint Summary & Narrative
              </div>
              <div className="form-group">
                <label className="form-label">
                  Comprehensive Description * <span className="text-muted">(Scanned by Overlap Engine)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Detail the alleged irregularity, dates of occurrence, affected departments, student numbers, statutory provisions breached, or AY 2026-27 specific issues..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Action / Note</label>
                <input
                  className="form-control"
                  value={initialAction}
                  onChange={e => setInitialAction(e.target.value)}
                  placeholder="e.g. Issued 15-day show-cause notice"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleResetAndClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !description.trim()}>
                {submitting ? 'Registering & Screening…' : 'Lodge Complaint & Run Overlap Scan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
