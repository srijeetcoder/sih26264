// OneDesk — App-wide Context Store
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Case, OverlapCandidate, AuditEvent, User, UserRole, NotificationItem } from '../types';
import {
  loadCases,
  saveCases,
  loadOverlaps,
  saveOverlaps,
  loadSavedUser,
  saveAuthUser,
  resetToSeedData,
} from '../store/persistence';
import { DEFAULT_USERS } from '../data/sampleData';
import { generateId, computeTextSimilarity } from '../utils/helpers';

interface AppContextValue {
  cases: Case[];
  overlaps: OverlapCandidate[];
  currentUser: User | null;
  notifications: NotificationItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  login: (role: UserRole, customUsername?: string) => void;
  logout: () => void;
  switchRole: () => void;
  addCase: (caseInput: Omit<Case, 'id' | 'auditHistory'>) => Case;
  updateCase: (id: string, patch: Partial<Case>) => void;
  appendAuditEvent: (caseId: string, event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  addOverlap: (overlap: Omit<OverlapCandidate, 'id' | 'createdAt'>) => void;
  updateOverlap: (id: string, patch: Partial<OverlapCandidate>) => void;
  reviewOverlap: (id: string, decision: OverlapCandidate['reviewDecision'], note: string, reviewer: string) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>(() => loadCases());
  const [overlaps, setOverlaps] = useState<OverlapCandidate[]>(() => loadOverlaps());
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadSavedUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Potential Overlapping Cases – Coordination Required',
      desc: 'Ramanujan Institute of Technology has cross-bureau cases across Approval and Infrastructure bureaus for AY 2026-27.',
      time: '10m ago',
      read: false,
      type: 'overlap',
      linkCaseId: 'CASE-2026-001',
    },
    {
      id: 'notif-2',
      title: 'Urgent SLA Escalation',
      desc: 'CASE-2026-005 (Faculty Shortage) is overdue by 2 days.',
      time: '1h ago',
      read: false,
      type: 'alert',
      linkCaseId: 'CASE-2026-005',
    },
  ]);

  // Persist on changes
  useEffect(() => { saveCases(cases); }, [cases]);
  useEffect(() => { saveOverlaps(overlaps); }, [overlaps]);
  useEffect(() => { saveAuthUser(currentUser); }, [currentUser]);

  // Login handler
  const login = useCallback((role: UserRole, customUsername?: string) => {
    if (role === 'admin') {
      const baseAdmin = DEFAULT_USERS[0];
      setCurrentUser({
        ...baseAdmin,
        username: customUsername || 'admin',
      });
    } else {
      const baseUser = DEFAULT_USERS[1];
      setCurrentUser({
        ...baseUser,
        username: customUsername || 'user',
      });
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback(() => {
    setCurrentUser(prev => {
      if (!prev || prev.role === 'admin') {
        return DEFAULT_USERS[1]; // switch to user
      }
      return DEFAULT_USERS[0]; // switch to admin
    });
  }, []);

  // Update case
  const updateCase = useCallback((id: string, patch: Partial<Case>) => {
    setCases(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  // Append audit event
  const appendAuditEvent = useCallback((caseId: string, event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const auditEvent: AuditEvent = {
      id: generateId('AUD'),
      timestamp: new Date().toISOString(),
      ...event,
    };
    setCases(prev =>
      prev.map(c =>
        c.id === caseId
          ? {
              ...c,
              auditHistory: [...c.auditHistory, auditEvent],
              latestAction: event.action,
            }
          : c
      )
    );
  }, []);

  // Add overlap
  const addOverlap = useCallback((overlap: Omit<OverlapCandidate, 'id' | 'createdAt'>) => {
    const newOverlap: OverlapCandidate = {
      id: generateId('OVL'),
      createdAt: new Date().toISOString(),
      ...overlap,
    };
    setOverlaps(prev => {
      // Avoid duplicate pairs
      const exists = prev.some(
        o =>
          (o.caseAId === newOverlap.caseAId && o.caseBId === newOverlap.caseBId) ||
          (o.caseAId === newOverlap.caseBId && o.caseBId === newOverlap.caseAId)
      );
      if (exists) return prev;
      return [newOverlap, ...prev];
    });
  }, []);

  // Live Complaint Addition
  const addCase = useCallback(
    (caseInput: Omit<Case, 'id' | 'auditHistory'>): Case => {
      // Generate collision-safe unique Case ID using timestamp
      const id = `CASE-2026-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();

      const initialAudit: AuditEvent = {
        id: generateId('AUD'),
        timestamp: nowIso,
        actor: currentUser?.name || 'System Operator',
        action: 'Case registered',
        note: `Initial registration via OneDesk portal (${caseInput.bureau}).`,
      };

      const createdCase: Case = {
        ...caseInput,
        id,
        auditHistory: [initialAudit],
      };

      // Use functional update so we always see the latest cases list
      setCases(prev => {
        // Scan ALL existing (non-disposed) cases for overlaps with the new case
        const nonDisposed = prev.filter(c => c.status !== 'disposed');

        for (const existing of nonDisposed) {
          if (existing.bureau === createdCase.bureau) continue; // cross-bureau only

          // Layer 1: Exact Institution ID match → "Potential Overlapping Cases"
          if (existing.institutionId === createdCase.institutionId) {
            // Queue overlap asynchronously so state batching works
            setTimeout(() => {
              addOverlap({
                caseAId: createdCase.id,
                caseBId: existing.id,
                matchMethod: 'exact-id',
                evidence: `⚠️ Potential Overlapping Cases – Coordination Required\n\n${createdCase.institutionName} (${createdCase.institutionId}) already has an active case in the ${existing.bureau}. This new complaint is received by the ${createdCase.bureau}. Both bureaus must coordinate to avoid conflicting or parallel actions.\n\nMulti-bureau scrutiny recommended.`,
                reviewDecision: 'pending',
              });
            }, 0);
            continue;
          }

          // Layer 2: Keyword / TF-IDF text similarity
          const sim = computeTextSimilarity(createdCase.description, existing.description);
          if (sim >= 0.25) {
            setTimeout(() => {
              addOverlap({
                caseAId: createdCase.id,
                caseBId: existing.id,
                matchMethod: 'keyword',
                similarityScore: Math.round(sim * 1000) / 1000,
                evidence: `⚠️ Potential Overlapping Cases – Coordination Required\n\n[Live Scan] Thematic similarity score: ${(sim * 100).toFixed(1)}%. Both cases share related terminology between ${createdCase.bureau} and ${existing.bureau}. Coordination between bureaus is recommended before independent action.`,
                reviewDecision: 'pending',
              });
            }, 0);
          }
        }

        return [createdCase, ...prev];
      });

      // Add Notification — overlap count comes from the scan above
      const notifId = generateId('NOTIF');
      const newNotif: NotificationItem = {
        id: notifId,
        title: `Case Registered: ${id}`,
        desc: `${createdCase.institutionName} · ${createdCase.category} — Overlap scan running…`,
        time: 'Just now',
        read: false,
        type: 'success',
        linkCaseId: id,
      };
      setNotifications(prev => [newNotif, ...prev]);

      return createdCase;
    },
    [currentUser, addOverlap]
  );

  const updateOverlap = useCallback((id: string, patch: Partial<OverlapCandidate>) => {
    setOverlaps(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const reviewOverlap = useCallback(
    (id: string, decision: OverlapCandidate['reviewDecision'], note: string, reviewer: string) => {
      setOverlaps(prev =>
        prev.map(o =>
          o.id === id
            ? {
                ...o,
                reviewDecision: decision,
                reviewNote: note,
                reviewedAt: new Date().toISOString(),
                reviewedBy: reviewer,
              }
            : o
        )
      );
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = resetToSeedData();
    setCases(fresh.cases);
    setOverlaps(fresh.overlaps);
    setNotifications([
      {
        id: generateId('NOTIF'),
        title: 'Demo Data Restored',
        desc: 'All cases and overlap records have been reset to default national evaluation sample.',
        time: 'Just now',
        read: false,
        type: 'info',
      },
    ]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        cases,
        overlaps,
        currentUser,
        notifications,
        searchQuery,
        setSearchQuery,
        login,
        logout,
        switchRole,
        addCase,
        updateCase,
        appendAuditEvent,
        addOverlap,
        updateOverlap,
        reviewOverlap,
        dismissNotification,
        markAllNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
