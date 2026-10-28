// OneDesk — Central Complaint Register
import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileX,
  PlusCircle,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDate,
  statusLabel,
  statusColor,
  priorityLabel,
  priorityColor,
  casesToCsvRows,
} from '../utils/helpers';
import type { Bureau, CaseStatus, CasePriority, Case } from '../types';
import type { ViewName } from './Sidebar';
import Papa from 'papaparse';

const BUREAUS: Bureau[] = [
  'Approval Bureau',
  'Anti-Ragging Cell',
  'Grievance Cell',
  'Faculty Affairs Bureau',
  'Infrastructure Bureau',
  'Examination Bureau',
];

const STATUSES: CaseStatus[] = ['pending', 'in-process', 'disposed', 'overdue'];
const PRIORITIES: CasePriority[] = ['urgent', 'high', 'medium', 'low'];

type SortKey = 'receivedDate' | 'expectedDisposalDate' | 'id' | 'institutionName' | 'status' | 'priority';

interface RegisterProps {
  onNavigate: (view: ViewName, payload?: unknown) => void;
  onOpenLodgeModal?: () => void;
}

export function Register({ onNavigate, onOpenLodgeModal }: RegisterProps) {
  const { cases } = useApp();

  const [search, setSearch] = useState('');
  const [bureauFilter, setBureauFilter] = useState<Bureau | ''>('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('receivedDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected case for quick side-drawer preview
  const [drawerCase, setDrawerCase] = useState<Case | null>(null);

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = cases;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q) ||
          c.institutionId.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.assignedOfficer.toLowerCase().includes(q)
      );
    }

    if (bureauFilter) {
      list = list.filter(c => c.bureau === bureauFilter);
    }

    if (statusFilter) {
      list = list.filter(c => c.status === statusFilter);
    }

    if (priorityFilter) {
      list = list.filter(c => c.priority === priorityFilter);
    }

    list = [...list].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [cases, search, bureauFilter, statusFilter, priorityFilter, sortKey, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return <ArrowUpDown size={12} style={{ color: 'var(--accent-violet)' }} />;
  }

  const handleExportFiltered = () => {
    const rows = casesToCsvRows(filtered);
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onedesk-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Complaint Register</h1>
          <p className="page-subtitle">
            Showing {filtered.length} of {cases.length} institution cases across AICTE jurisdictions
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportFiltered} title="Export filtered rows to CSV">
            <Download size={14} /> Export CSV
          </button>
          {onOpenLodgeModal && (
            <button className="btn btn-primary btn-sm" onClick={onOpenLodgeModal}>
              <PlusCircle size={14} /> Lodge Complaint
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: 16 }}>
        <div className="filter-bar-content">
          <div className="filter-search-field" style={{ maxWidth: 360 }}>
            <Search size={15} className="filter-search-icon" />
            <input
              id="register-search"
              type="text"
              className="form-control filter-input"
              placeholder="Search by case ID, institution, officer, or category…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-select-group">
            <Filter size={14} className="text-muted" />

            {/* Bureau Filter */}
            <select
              id="bureau-filter"
              className="form-control filter-select"
              value={bureauFilter}
              onChange={e => {
                setBureauFilter(e.target.value as Bureau | '');
                setCurrentPage(1);
              }}
            >
              <option value="">All Bureaus ({cases.length})</option>
              {BUREAUS.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              id="priority-filter"
              className="form-control filter-select"
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value as CasePriority | '');
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>
                  {priorityLabel(p)} Priority
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              id="status-filter"
              className="form-control filter-select"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as CaseStatus | '');
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>

            {(search || bureauFilter || statusFilter || priorityFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setBureauFilter('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card table-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FileX size={26} />
            </div>
            <div className="empty-title">No complaints match your criteria</div>
            <div className="empty-desc">Try resetting your active filters or query.</div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('id')} className="cursor-pointer">
                      <div className="th-content">
                        Case ID <SortIcon k="id" />
                      </div>
                    </th>
                    <th onClick={() => toggleSort('institutionName')} className="cursor-pointer">
                      <div className="th-content">
                        Institution & Permanent ID <SortIcon k="institutionName" />
                      </div>
                    </th>
                    <th>Bureau & Category</th>
                    <th onClick={() => toggleSort('priority')} className="cursor-pointer">
                      <div className="th-content">
                        Priority <SortIcon k="priority" />
                      </div>
                    </th>
                    <th onClick={() => toggleSort('status')} className="cursor-pointer">
                      <div className="th-content">
                        Status <SortIcon k="status" />
                      </div>
                    </th>
                    <th onClick={() => toggleSort('receivedDate')} className="cursor-pointer">
                      <div className="th-content">
                        Received <SortIcon k="receivedDate" />
                      </div>
                    </th>
                    <th>Officer</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCases.map(c => (
                    <tr
                      key={c.id}
                      className="table-row-hover"
                      onClick={() => setDrawerCase(c)}
                    >
                      <td>
                        <span className="case-id-badge">{c.id}</span>
                      </td>
                      <td>
                        <div className="table-inst-group">
                          <span className="table-inst-name">{c.institutionName}</span>
                          <span className="table-inst-id">
                            {c.institutionId} · {c.region}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-bureau-cat">
                          <span className="bureau-chip">{c.bureau}</span>
                          <span className="cat-chip">{c.category}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${priorityColor(c.priority)}`}>
                          {priorityLabel(c.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                      </td>
                      <td className="table-date">{formatDate(c.receivedDate)}</td>
                      <td className="table-officer">{c.assignedOfficer}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn-table-action"
                            onClick={() => setDrawerCase(c)}
                            title="Quick View Drawer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn-table-action primary"
                            onClick={() => onNavigate('case-detail', c.id)}
                            title="Open Full Case Dossier"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="table-pagination-footer">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({filtered.length} total rows)
              </span>

              <div className="pagination-buttons">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Slide-out Quick Detail Drawer ───────────────────────────────────── */}
      {drawerCase && (
        <div className="drawer-backdrop" onClick={() => setDrawerCase(null)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-case-id">{drawerCase.id}</span>
                <h3 className="drawer-title">{drawerCase.institutionName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDrawerCase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-badges-row">
                <span className={`badge ${priorityColor(drawerCase.priority)}`}>
                  Priority: {priorityLabel(drawerCase.priority)}
                </span>
                <span className={`badge ${statusColor(drawerCase.status)}`}>
                  {statusLabel(drawerCase.status)}
                </span>
                <span className="badge badge-disposed">{drawerCase.bureau}</span>
              </div>

              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <span className="drawer-label">Institution ID</span>
                  <span className="drawer-val">{drawerCase.institutionId}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-label">Jurisdiction</span>
                  <span className="drawer-val">{drawerCase.region} Region</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-label">Category</span>
                  <span className="drawer-val">{drawerCase.category}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-label">Complainant</span>
                  <span className="drawer-val">{drawerCase.complainantType || 'Student / Faculty'}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-label">Received Date</span>
                  <span className="drawer-val">{formatDate(drawerCase.receivedDate)}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-label">Target SLA</span>
                  <span className="drawer-val">{formatDate(drawerCase.expectedDisposalDate)}</span>
                </div>
                <div className="drawer-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="drawer-label">Assigned Officer</span>
                  <span className="drawer-val">{drawerCase.assignedOfficer}</span>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Allegation Narrative</div>
                <div className="drawer-description-box">{drawerCase.description}</div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Latest Statutory Action</div>
                <div className="drawer-action-box">{drawerCase.latestAction}</div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Audit Trail Highlights</div>
                <div className="drawer-audit-list">
                  {drawerCase.auditHistory.slice(-2).map(ev => (
                    <div key={ev.id} className="drawer-audit-item">
                      <div className="drawer-audit-top">
                        <strong>{ev.actor}</strong>: {ev.action}
                      </div>
                      {ev.note && <div className="drawer-audit-note">{ev.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  onNavigate('case-detail', drawerCase.id);
                  setDrawerCase(null);
                }}
              >
                Open Full Dossier & Manage Status →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
