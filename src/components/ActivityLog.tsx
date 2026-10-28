// OneDesk — System Audit & Activity Trail
import { useState, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  User,
  Shield,
  Clock,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/helpers';
import type { ViewName } from './Sidebar';

interface ActivityLogProps {
  onNavigate: (view: ViewName, payload?: unknown) => void;
}

export function ActivityLog({ onNavigate }: ActivityLogProps) {
  const { cases, overlaps } = useApp();
  const [filterActor, setFilterActor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all case audit events + overlap review events into a unified chronological log
  const allEvents = useMemo(() => {
    const events: Array<{
      id: string;
      timestamp: string;
      actor: string;
      action: string;
      note?: string;
      source: 'case' | 'overlap';
      caseId?: string;
      institutionName?: string;
      bureau?: string;
    }> = [];

    // Case events
    for (const c of cases) {
      for (const ev of c.auditHistory) {
        events.push({
          id: ev.id,
          timestamp: ev.timestamp,
          actor: ev.actor,
          action: ev.action,
          note: ev.note,
          source: 'case',
          caseId: c.id,
          institutionName: c.institutionName,
          bureau: c.bureau,
        });
      }
    }

    // Overlap events
    for (const ovl of overlaps) {
      if (ovl.reviewedAt && ovl.reviewedBy) {
        events.push({
          id: `REV-${ovl.id}`,
          timestamp: ovl.reviewedAt,
          actor: ovl.reviewedBy,
          action: `Overlap ${ovl.reviewDecision.toUpperCase()}`,
          note: ovl.reviewNote || `Candidate pair ${ovl.caseAId} ⇄ ${ovl.caseBId} evaluated by officer.`,
          source: 'overlap',
          caseId: ovl.caseAId,
        });
      }
    }

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases, overlaps]);

  // Unique actors for filter dropdown
  const actors = useMemo(() => {
    const set = new Set<string>();
    for (const e of allEvents) set.add(e.actor);
    return Array.from(set);
  }, [allEvents]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchActor = filterActor === 'all' || e.actor === filterActor;
      const matchSearch =
        !searchQuery.trim() ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.caseId && e.caseId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.institutionName && e.institutionName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchActor && matchSearch;
    });
  }, [allEvents, filterActor, searchQuery]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Activity Log</h1>
          <p className="page-subtitle">
            Immutable, cross-bureau audit trail of all regulatory actions, status transitions, and AI review decisions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: 20 }}>
        <div className="filter-bar-content">
          <div className="filter-search-field">
            <Search size={15} className="filter-search-icon" />
            <input
              type="text"
              className="form-control filter-input"
              placeholder="Filter by action, institution name, or case ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select-group">
            <Filter size={14} className="text-muted" />
            <span className="filter-label">Actor:</span>
            <select
              className="form-control filter-select"
              value={filterActor}
              onChange={e => setFilterActor(e.target.value)}
            >
              <option value="all">All Actors ({actors.length})</option>
              {actors.map(actor => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="timeline-container">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <History size={26} />
            </div>
            <div className="empty-title">No matching activity records</div>
            <div className="empty-desc">Try clearing your search query or actor filter.</div>
          </div>
        ) : (
          <div className="activity-timeline-list">
            {filteredEvents.map(ev => {
              const isSystem = ev.actor === 'System';
              const isOverlap = ev.source === 'overlap';

              return (
                <div key={ev.id} className="activity-row-card">
                  <div className={`activity-actor-avatar ${isSystem ? 'system' : isOverlap ? 'overlap' : 'officer'}`}>
                    {isSystem ? <Shield size={14} /> : isOverlap ? <GitBranch size={14} /> : <User size={14} />}
                  </div>

                  <div className="activity-content-block">
                    <div className="activity-header-row">
                      <div className="activity-main-heading">
                        <span className="activity-actor-name">{ev.actor}</span>
                        <span className="activity-action-label">{ev.action}</span>
                        {ev.caseId && (
                          <span
                            className="activity-case-badge"
                            onClick={() => onNavigate('case-detail', ev.caseId)}
                          >
                            {ev.caseId}
                          </span>
                        )}
                      </div>
                      <span className="activity-timestamp">
                        <Clock size={12} /> {formatDateTime(ev.timestamp)}
                      </span>
                    </div>

                    {ev.institutionName && (
                      <div className="activity-institution-context">
                        {ev.institutionName} · {ev.bureau}
                      </div>
                    )}

                    {ev.note && <div className="activity-note-box">{ev.note}</div>}
                  </div>

                  {ev.caseId && (
                    <button
                      className="activity-jump-btn"
                      onClick={() => onNavigate('case-detail', ev.caseId)}
                      title="Inspect Case"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
