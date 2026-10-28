// OneDesk — Reports, Analytics & CSV Export
import { useMemo } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAMPLE_INSTITUTIONS } from '../data/sampleData';
import { formatDate, casesToCsvRows } from '../utils/helpers';
import type { Bureau } from '../types';
import Papa from 'papaparse';

const BUREAUS: Bureau[] = [
  'Approval Bureau',
  'Anti-Ragging Cell',
  'Grievance Cell',
  'Faculty Affairs Bureau',
  'Infrastructure Bureau',
  'Examination Bureau',
];

export function Reports() {
  const { cases } = useApp();

  // Institution-wise summaries
  const institutionSummaries = useMemo(() => {
    return SAMPLE_INSTITUTIONS.map(inst => {
      const instCases = cases.filter(c => c.institutionId === inst.id);
      const pending = instCases.filter(c => c.status === 'pending').length;
      const inProcess = instCases.filter(c => c.status === 'in-process').length;
      const disposed = instCases.filter(c => c.status === 'disposed').length;
      const overdue = instCases.filter(c => c.status === 'overdue').length;
      return { ...inst, total: instCases.length, pending, inProcess, disposed, overdue };
    }).sort((a, b) => b.total - a.total);
  }, [cases]);

  // Bureau-wise summaries
  const bureauSummaries = useMemo(() => {
    return BUREAUS.map(bureau => {
      const bureauCases = cases.filter(c => c.bureau === bureau);
      const pending = bureauCases.filter(c => c.status === 'pending').length;
      const inProcess = bureauCases.filter(c => c.status === 'in-process').length;
      const disposed = bureauCases.filter(c => c.status === 'disposed').length;
      const overdue = bureauCases.filter(c => c.status === 'overdue').length;
      return { bureau, total: bureauCases.length, pending, inProcess, disposed, overdue };
    })
      .filter(b => b.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [cases]);

  // Status distribution
  const statusDist = useMemo(() => {
    const pending = cases.filter(c => c.status === 'pending').length;
    const inProcess = cases.filter(c => c.status === 'in-process').length;
    const disposed = cases.filter(c => c.status === 'disposed').length;
    const overdue = cases.filter(c => c.status === 'overdue').length;
    return { pending, inProcess, disposed, overdue, total: cases.length };
  }, [cases]);

  // Overdue cases
  const overdueCases = useMemo(() => cases.filter(c => c.status === 'overdue'), [cases]);

  // CSV export via PapaParse
  function exportCSV() {
    const rows = casesToCsvRows(cases);
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onedesk-executive-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  function pct(n: number) {
    if (statusDist.total === 0) return 0;
    return Math.round((n / statusDist.total) * 100);
  }

  return (
    <div className="page-content">
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">
            Auditable statutory metrics, bureau resolution performance, and data exports
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print Report
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCSV} id="export-csv-btn">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Status Distribution Cards */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title-group">
            <BarChart3 size={16} className="text-violet" />
            <span className="card-title">Regulatory Resolution Metrics</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {statusDist.total} total cases registered
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { key: 'pending', value: statusDist.pending, label: 'Pending Review', cls: 'badge-pending' },
              { key: 'inprocess', value: statusDist.inProcess, label: 'Under Investigation', cls: 'badge-inprocess' },
              { key: 'disposed', value: statusDist.disposed, label: 'Disposed & Closed', cls: 'badge-disposed' },
              { key: 'overdue', value: statusDist.overdue, label: 'Overdue SLA Escalation', cls: 'badge-overdue' },
            ].map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: 'var(--bg-surface)',
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className={`badge ${item.cls}`}>{item.label}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{item.value}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct(item.value)}%`,
                      background:
                        item.key === 'overdue'
                          ? 'var(--status-rose)'
                          : item.key === 'disposed'
                          ? 'var(--status-emerald)'
                          : item.key === 'inprocess'
                          ? 'var(--status-blue)'
                          : 'var(--status-amber)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {pct(item.value)}% of overall caseload
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Institution-wise Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Building2 size={16} className="text-violet" />
              <span className="card-title">Caseload by Institution</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Active</th>
                  <th>Disposed</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {institutionSummaries.map(inst => (
                  <tr key={inst.id}>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{inst.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-violet)' }}>
                        {inst.id}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{inst.total}</td>
                    <td><span className="badge badge-pending">{inst.pending}</span></td>
                    <td><span className="badge badge-inprocess">{inst.inProcess}</span></td>
                    <td><span className="badge badge-disposed">{inst.disposed}</span></td>
                    <td>
                      {inst.overdue > 0 ? (
                        <span className="badge badge-overdue">{inst.overdue}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bureau-wise Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <GitBranch size={16} className="text-cyan" />
              <span className="card-title">Caseload by AICTE Bureau</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bureau / Cell</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Active</th>
                  <th>Disposed</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {bureauSummaries.map(b => (
                  <tr key={b.bureau}>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{b.bureau}</td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{b.total}</td>
                    <td><span className="badge badge-pending">{b.pending}</span></td>
                    <td><span className="badge badge-inprocess">{b.inProcess}</span></td>
                    <td><span className="badge badge-disposed">{b.disposed}</span></td>
                    <td>
                      {b.overdue > 0 ? (
                        <span className="badge badge-overdue">{b.overdue}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overdue Cases SLA Monitor */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <AlertCircle size={16} className="text-rose" />
            <span className="card-title">SLA Breach Monitor ({overdueCases.length} cases)</span>
          </div>
        </div>
        {overdueCases.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={24} className="text-emerald" style={{ margin: '0 auto 8px' }} />
            <div className="empty-title">Zero Statutory Overdue Cases</div>
            <div className="empty-desc">All registered cases are operating within disposal benchmarks.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Institution</th>
                  <th>Bureau</th>
                  <th>Assigned Officer</th>
                  <th>Statutory Deadline</th>
                  <th>Last Recorded Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueCases.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="case-id-badge">{c.id}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                        {c.institutionName}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {c.institutionId}
                      </div>
                    </td>
                    <td>
                      <span className="bureau-chip">{c.bureau}</span>
                    </td>
                    <td className="table-officer">{c.assignedOfficer}</td>
                    <td>
                      <span className="badge badge-overdue">{formatDate(c.expectedDisposalDate)}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.latestAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
