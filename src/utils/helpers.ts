// OneDesk — Utility Functions
import type { Case, CaseStatus, CasePriority } from '../types';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';

// ── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM yyyy, HH:mm');
  } catch {
    return iso;
  }
}

export function daysUntilDeadline(iso: string): number {
  try {
    return differenceInDays(parseISO(iso), new Date());
  } catch {
    return 0;
  }
}

export function isOverdue(caseItem: Case): boolean {
  if (caseItem.status === 'disposed') return false;
  return isPast(parseISO(caseItem.expectedDisposalDate));
}

// ── Status helpers ───────────────────────────────────────────────────────────

export function statusLabel(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    pending: 'Pending',
    'in-process': 'In Process',
    disposed: 'Disposed',
    overdue: 'Overdue',
  };
  return map[status] || status;
}

export function statusColor(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    pending: 'badge-pending',
    'in-process': 'badge-inprocess',
    disposed: 'badge-disposed',
    overdue: 'badge-overdue',
  };
  return map[status] || 'badge-pending';
}

// ── Priority helpers ─────────────────────────────────────────────────────────

export function priorityLabel(priority?: CasePriority): string {
  const map: Record<CasePriority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return (priority && map[priority]) || 'Medium';
}

export function priorityColor(priority?: CasePriority): string {
  const map: Record<CasePriority, string> = {
    urgent: 'badge-priority-urgent',
    high: 'badge-priority-high',
    medium: 'badge-priority-medium',
    low: 'badge-priority-low',
  };
  return (priority && map[priority]) || 'badge-priority-medium';
}

// ── Dashboard metrics ────────────────────────────────────────────────────────

export function computeMetrics(cases: Case[]) {
  const total = cases.length;
  const pending = cases.filter((c) => c.status === 'pending').length;
  const inProcess = cases.filter((c) => c.status === 'in-process').length;
  const disposed = cases.filter((c) => c.status === 'disposed').length;
  const overdue = cases.filter((c) => c.status === 'overdue').length;
  const openCases = cases.filter((c) => c.status !== 'disposed').length;
  const awaitingAction = pending;
  const resolutionRate = total > 0 ? Math.round((disposed / total) * 100) : 0;

  // Priority counts
  const urgentCount = cases.filter((c) => c.priority === 'urgent' && c.status !== 'disposed').length;
  const highCount = cases.filter((c) => c.priority === 'high' && c.status !== 'disposed').length;
  const mediumCount = cases.filter((c) => c.priority === 'medium' && c.status !== 'disposed').length;
  const lowCount = cases.filter((c) => c.priority === 'low' && c.status !== 'disposed').length;

  // Approaching deadline: non-disposed cases due within 30 days
  const approachingDeadline = cases.filter(
    (c) =>
      c.status !== 'disposed' &&
      c.status !== 'overdue' &&
      daysUntilDeadline(c.expectedDisposalDate) <= 30 &&
      daysUntilDeadline(c.expectedDisposalDate) > 0
  ).length;

  return {
    total,
    openCases,
    awaitingAction,
    pending,
    inProcess,
    disposed,
    overdue,
    resolutionRate,
    approachingDeadline,
    priorityBreakdown: {
      urgent: urgentCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
    },
  };
}

// ── Text normalization for name matching ─────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(
      /\b(of|the|and|&|pvt|ltd|college|institute|university|engg|engineering|technical|technology|sciences|science|national|polytechnic)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaccard similarity on word sets
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeName(a).split(' ').filter(Boolean));
  const setB = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ── Cosine similarity for embeddings ────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

// Word frequency cosine similarity for offline deterministic fallback matching
export function computeTextSimilarity(textA: string, textB: string): number {
  const wordsA = textA
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const wordsB = textB
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  const vocab = new Set<string>();

  for (const w of wordsA) {
    freqA.set(w, (freqA.get(w) ?? 0) + 1);
    vocab.add(w);
  }
  for (const w of wordsB) {
    freqB.set(w, (freqB.get(w) ?? 0) + 1);
    vocab.add(w);
  }

  if (vocab.size === 0) return 0;
  const vecA: number[] = [];
  const vecB: number[] = [];
  for (const w of vocab) {
    vecA.push(freqA.get(w) ?? 0);
    vecB.push(freqB.get(w) ?? 0);
  }
  return cosineSimilarity(vecA, vecB);
}

// ── ID generation ────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── CSV export ───────────────────────────────────────────────────────────────

export function casesToCsvRows(cases: Case[]): object[] {
  return cases.map((c) => ({
    'Case ID': c.id,
    'Institution ID': c.institutionId,
    'Institution Name': c.institutionName,
    Region: c.region,
    Bureau: c.bureau,
    Category: c.category,
    Priority: priorityLabel(c.priority),
    'Assigned Officer': c.assignedOfficer,
    Status: statusLabel(c.status),
    'Complainant Type': c.complainantType || 'General Citizen',
    'Received Date': c.receivedDate,
    'Expected Disposal Date': c.expectedDisposalDate,
    'Latest Action': c.latestAction,
    'Description (Summary)': c.description.slice(0, 160),
  }));
}
