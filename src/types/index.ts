// OneDesk — Type Definitions
// Enterprise AICTE Regulatory Monitor

export type CaseStatus = 'pending' | 'in-process' | 'disposed' | 'overdue';

export type CasePriority = 'urgent' | 'high' | 'medium' | 'low';

export type Bureau =
  | 'Regulation Bureau (RB)'
  | 'Public Grievance Redressal Cell (PGRC)'
  | 'Approval Bureau'
  | 'Anti-Ragging Cell'
  | 'Grievance Cell'
  | 'Faculty Affairs Bureau'
  | 'Infrastructure Bureau'
  | 'Examination Bureau';

export type MatchMethod = 'exact-id' | 'normalized-name' | 'semantic-ai' | 'keyword';

export type ReviewDecision = 'confirmed' | 'rejected' | 'deferred' | 'pending';

export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  role: UserRole;
  name: string;
  title: string;
  bureau?: Bureau | 'All Bureaus';
  avatar?: string;
  email?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO 8601
  actor: string;
  action: string;
  note?: string;
}

export interface Case {
  id: string;
  institutionId: string;
  institutionName: string;
  region: string;
  bureau: Bureau;
  category: string;
  priority: CasePriority;
  assignedOfficer: string;
  status: CaseStatus;
  receivedDate: string; // ISO 8601
  expectedDisposalDate: string; // ISO 8601
  latestAction: string;
  description: string;
  complainantType?: string;
  auditHistory: AuditEvent[];
}

export interface Institution {
  id: string;
  name: string;
  region: string;
  caseIds: string[];
}

export interface OverlapCandidate {
  id: string;
  caseAId: string;
  caseBId: string;
  matchMethod: MatchMethod;
  similarityScore?: number; // 0.0 to 1.0
  evidence: string;
  reviewDecision: ReviewDecision;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface SemanticMatchResult {
  candidateId: string;
  score: number;
  evidence: string;
}

export interface OllamaStatus {
  available: boolean;
  viaProxy?: boolean;
  model?: string;
  checkedAt: string;
  error?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type?: 'alert' | 'overlap' | 'success' | 'info';
  linkCaseId?: string;
}
