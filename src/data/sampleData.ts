// OneDesk — Sample Regulatory Data
// ⚠️ ALL DATA IS FICTIONAL FOR DEMONSTRATION PURPOSES ONLY.
// This is not real AICTE case information.

import type { Case, Institution, OverlapCandidate, User } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    role: 'admin',
    name: 'Dr. Rajesh Verma',
    title: 'Director General (Compliance & Oversight)',
    bureau: 'All Bureaus',
    avatar: 'RV',
    email: 'rajesh.verma@aicte-india.org',
  },
  {
    username: 'user',
    role: 'user',
    name: 'Shri Rajiv Nair',
    title: 'Senior Zonal Compliance Officer',
    bureau: 'Approval Bureau',
    avatar: 'RN',
    email: 'rajiv.nair@aicte-india.org',
  },
];

export const SAMPLE_CASES: Case[] = [
  // ── Institution A: Ramanujan Institute of Technology (INST-0042) ─────────
  {
    id: 'CASE-2024-001',
    institutionId: 'INST-0042',
    institutionName: 'Ramanujan Institute of Technology',
    region: 'Southern',
    bureau: 'Approval Bureau',
    category: 'Affiliation Compliance',
    priority: 'high',
    complainantType: 'Faculty Body',
    assignedOfficer: 'Dr. Meera Krishnan',
    status: 'in-process',
    receivedDate: '2024-08-10',
    expectedDisposalDate: '2024-11-10',
    latestAction: 'Documents requested from institution',
    description:
      'The institution has failed to submit updated affiliation documents for the academic year 2024-25 despite two reminder notices.',
    auditHistory: [
      {
        id: 'AUD-001-1',
        timestamp: '2024-08-10T09:30:00+05:30',
        actor: 'System',
        action: 'Case created',
        note: 'Complaint received via AICTE portal',
      },
      {
        id: 'AUD-001-2',
        timestamp: '2024-08-15T14:00:00+05:30',
        actor: 'Dr. Meera Krishnan',
        action: 'Documents requested',
        note: 'Notice sent to institution registrar',
      },
      {
        id: 'AUD-001-3',
        timestamp: '2024-09-02T11:20:00+05:30',
        actor: 'Dr. Meera Krishnan',
        action: 'Follow-up issued',
        note: 'Second reminder sent. No response received.',
      },
    ],
  },
  {
    id: 'CASE-2024-002',
    institutionId: 'INST-0042',
    institutionName: 'Ramanujan Institute of Technology',
    region: 'Southern',
    bureau: 'Grievance Cell',
    category: 'Fee Refund Dispute',
    priority: 'medium',
    complainantType: 'Student Union',
    assignedOfficer: 'Shri Rajiv Nair',
    status: 'pending',
    receivedDate: '2024-09-01',
    expectedDisposalDate: '2024-12-01',
    latestAction: 'Complaint acknowledged',
    description:
      'The university has withheld the examination fee refund from students for two semesters. Multiple students have submitted written complaints regarding excessive fee retention.',
    auditHistory: [
      {
        id: 'AUD-002-1',
        timestamp: '2024-09-01T10:00:00+05:30',
        actor: 'System',
        action: 'Case created',
        note: 'Received via grievance portal',
      },
      {
        id: 'AUD-002-2',
        timestamp: '2024-09-03T16:45:00+05:30',
        actor: 'Shri Rajiv Nair',
        action: 'Complaint acknowledged',
        note: 'Institution notified to respond within 30 days',
      },
    ],
  },
  {
    id: 'CASE-2024-003',
    institutionId: 'INST-0042',
    institutionName: 'Ramanujan Institute of Technology',
    region: 'Southern',
    bureau: 'Anti-Ragging Cell',
    category: 'Ragging Incident',
    priority: 'urgent',
    complainantType: 'Parent Council',
    assignedOfficer: 'Dr. Priya Subramaniam',
    status: 'disposed',
    receivedDate: '2024-06-15',
    expectedDisposalDate: '2024-09-15',
    latestAction: 'Case disposed — institution took corrective action',
    description:
      'Reported ragging incident in first-year engineering hostel. Institution submitted comprehensive inquiry report and expelled offending perpetrators.',
    auditHistory: [
      {
        id: 'AUD-003-1',
        timestamp: '2024-06-15T08:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-003-2',
        timestamp: '2024-06-20T12:00:00+05:30',
        actor: 'Dr. Priya Subramaniam',
        action: 'Inquiry initiated',
        note: 'Institution directed to form internal anti-ragging squad',
      },
      {
        id: 'AUD-003-3',
        timestamp: '2024-08-30T09:00:00+05:30',
        actor: 'Dr. Priya Subramaniam',
        action: 'Case disposed',
        note: 'Institution submitted inquiry report and action-taken statement',
      },
    ],
  },

  // ── Institution B: Bhaskara College of Engineering (INST-0117) ──────────
  {
    id: 'CASE-2024-004',
    institutionId: 'INST-0117',
    institutionName: 'Bhaskara College of Engineering',
    region: 'Western',
    bureau: 'Examination Bureau',
    category: 'Exam Fee Reimbursement',
    priority: 'medium',
    complainantType: 'Student Union',
    assignedOfficer: 'Ms. Anita Sharma',
    status: 'in-process',
    receivedDate: '2024-09-10',
    expectedDisposalDate: '2024-12-10',
    latestAction: 'Institution response awaited',
    description:
      'Students report that reimbursement of examination charges remains pending despite repeated requests to the administration over two academic terms.',
    auditHistory: [
      {
        id: 'AUD-004-1',
        timestamp: '2024-09-10T10:30:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-004-2',
        timestamp: '2024-09-15T15:00:00+05:30',
        actor: 'Ms. Anita Sharma',
        action: 'Institution notified',
        note: 'Formal notice issued requesting refund statement',
      },
    ],
  },
  {
    id: 'CASE-2024-005',
    institutionId: 'INST-0117',
    institutionName: 'Bhaskara College of Engineering',
    region: 'Western',
    bureau: 'Faculty Affairs Bureau',
    category: 'Faculty Shortage',
    priority: 'urgent',
    complainantType: 'Faculty Body',
    assignedOfficer: 'Dr. Suresh Mehta',
    status: 'overdue',
    receivedDate: '2024-07-01',
    expectedDisposalDate: '2024-10-01',
    latestAction: 'Overdue — escalated to Director',
    description:
      'The Mechanical and Computer Science departments are running with a 45% faculty deficit compared to AICTE prescribed faculty-to-student cadre norms.',
    auditHistory: [
      {
        id: 'AUD-005-1',
        timestamp: '2024-07-01T11:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-005-2',
        timestamp: '2024-07-20T14:30:00+05:30',
        actor: 'Dr. Suresh Mehta',
        action: 'Inspection scheduled',
        note: 'Surprise inspection recommended',
      },
      {
        id: 'AUD-005-3',
        timestamp: '2024-10-02T09:00:00+05:30',
        actor: 'System',
        action: 'Status changed to overdue',
        note: 'Disposal date exceeded by 2 days',
      },
    ],
  },
  {
    id: 'CASE-2024-006',
    institutionId: 'INST-0042',
    institutionName: 'Ramanujan Institute of Technology',
    region: 'Southern',
    bureau: 'Infrastructure Bureau',
    category: 'Laboratory Standards',
    priority: 'high',
    complainantType: 'Audit Inspector',
    assignedOfficer: 'Er. K. Venkataraman',
    status: 'pending',
    receivedDate: '2024-09-20',
    expectedDisposalDate: '2024-12-20',
    latestAction: 'Physical inspection planned',
    description:
      'Chemistry and Computer Science laboratories fail to meet minimum safety and equipment standards specified in the AICTE Approval Process Handbook.',
    auditHistory: [
      {
        id: 'AUD-006-1',
        timestamp: '2024-09-20T14:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-006-2',
        timestamp: '2024-09-25T11:00:00+05:30',
        actor: 'Er. K. Venkataraman',
        action: 'Inspection team constituted',
        note: 'Panel of 2 experts nominated',
      },
    ],
  },

  // ── Institution C: Vivekananda Technical University (INST-0289) ─────────
  {
    id: 'CASE-2024-007',
    institutionId: 'INST-0289',
    institutionName: 'Vivekananda Technical University',
    region: 'Eastern',
    bureau: 'Approval Bureau',
    category: 'Unauthorized Intake',
    priority: 'urgent',
    complainantType: 'State Directorate',
    assignedOfficer: 'Dr. Meera Krishnan',
    status: 'in-process',
    receivedDate: '2024-08-25',
    expectedDisposalDate: '2024-11-25',
    latestAction: 'Show-cause notice served',
    description:
      'The university admitted 60 students beyond the AICTE approved seat matrix for the Artificial Intelligence & Data Science undergraduate program.',
    auditHistory: [
      {
        id: 'AUD-007-1',
        timestamp: '2024-08-25T10:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-007-2',
        timestamp: '2024-09-05T15:00:00+05:30',
        actor: 'Dr. Meera Krishnan',
        action: 'Show-cause notice served',
        note: 'Institution given 15 days to explain unauthorized intake',
      },
    ],
  },
  {
    id: 'CASE-2024-008',
    institutionId: 'INST-0289',
    institutionName: 'Vivekananda Technical University',
    region: 'Eastern',
    bureau: 'Grievance Cell',
    category: 'Capitation Fee Allegation',
    priority: 'urgent',
    complainantType: 'Anonymous Whistleblower',
    assignedOfficer: 'Shri Rajiv Nair',
    status: 'pending',
    receivedDate: '2024-09-18',
    expectedDisposalDate: '2024-12-18',
    latestAction: 'Prima facie assessment ongoing',
    description:
      'Parents allege demands for unreceipted building fund donations during management quota admissions for AICTE approved programs.',
    auditHistory: [
      {
        id: 'AUD-008-1',
        timestamp: '2024-09-18T16:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
    ],
  },

  // ── Institution D: Aryabhatta Institute of Sciences (INST-0355) ─────────
  {
    id: 'CASE-2024-009',
    institutionId: 'INST-0355',
    institutionName: 'Aryabhatta Institute of Sciences',
    region: 'Northern',
    bureau: 'Anti-Ragging Cell',
    category: 'Hostel Safety Protocols',
    priority: 'low',
    complainantType: 'Parent Council',
    assignedOfficer: 'Dr. Priya Subramaniam',
    status: 'disposed',
    receivedDate: '2024-05-10',
    expectedDisposalDate: '2024-08-10',
    latestAction: 'Resolved — CCTV installation verified',
    description:
      'Inadequate warden presence and missing CCTV surveillance reported in student dormitories.',
    auditHistory: [
      {
        id: 'AUD-009-1',
        timestamp: '2024-05-10T09:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-009-2',
        timestamp: '2024-07-28T14:00:00+05:30',
        actor: 'Dr. Priya Subramaniam',
        action: 'Compliance verified and case disposed',
        note: 'Geo-tagged photographic evidence of CCTV implementation received',
      },
    ],
  },
  {
    id: 'CASE-2024-010',
    institutionId: 'INST-0355',
    institutionName: 'Aryabhatta Institute of Sciences',
    region: 'Northern',
    bureau: 'Faculty Affairs Bureau',
    category: 'Faculty Salary Arrears',
    priority: 'high',
    complainantType: 'Faculty Body',
    assignedOfficer: 'Dr. Suresh Mehta',
    status: 'overdue',
    receivedDate: '2024-06-01',
    expectedDisposalDate: '2024-09-01',
    latestAction: 'Overdue — penalty proceedings initiated',
    description:
      'Assistant professors report unpaid 7th Central Pay Commission DA arrears spanning four quarters despite state grant releases.',
    auditHistory: [
      {
        id: 'AUD-010-1',
        timestamp: '2024-06-01T11:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-010-2',
        timestamp: '2024-09-02T09:00:00+05:30',
        actor: 'System',
        action: 'Status changed to overdue',
        note: 'SLA exceeded without resolution',
      },
    ],
  },

  // ── Institution E: National Polytechnic College (INST-0601) ─────────────
  {
    id: 'CASE-2024-011',
    institutionId: 'INST-0601',
    institutionName: 'National Polytechnic College',
    region: 'Central',
    bureau: 'Infrastructure Bureau',
    category: 'Fire Safety Certificate',
    priority: 'medium',
    complainantType: 'Local Municipal Body',
    assignedOfficer: 'Er. K. Venkataraman',
    status: 'in-process',
    receivedDate: '2024-08-30',
    expectedDisposalDate: '2024-11-30',
    latestAction: 'NOC verification pending with state fire service',
    description:
      'Institution functioning without updated Fire Safety No Objection Certificate (NOC) for academic block C.',
    auditHistory: [
      {
        id: 'AUD-011-1',
        timestamp: '2024-08-30T13:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
      {
        id: 'AUD-011-2',
        timestamp: '2024-09-12T10:00:00+05:30',
        actor: 'Er. K. Venkataraman',
        action: 'Letter sent to Chief Fire Officer',
      },
    ],
  },
  {
    id: 'CASE-2024-012',
    institutionId: 'INST-0601',
    institutionName: 'National Polytechnic College',
    region: 'Central',
    bureau: 'Examination Bureau',
    category: 'Diploma Certificate Delay',
    priority: 'low',
    complainantType: 'Student Union',
    assignedOfficer: 'Ms. Anita Sharma',
    status: 'pending',
    receivedDate: '2024-09-22',
    expectedDisposalDate: '2024-12-22',
    latestAction: 'State technical board contacted',
    description:
      'Batch of 2023 polytechnic graduates awaiting final semester consolidated grade sheets and diploma credentials.',
    auditHistory: [
      {
        id: 'AUD-012-1',
        timestamp: '2024-09-22T10:00:00+05:30',
        actor: 'System',
        action: 'Case created',
      },
    ],
  },
];

export const SAMPLE_INSTITUTIONS: Institution[] = [
  {
    id: 'INST-0042',
    name: 'Ramanujan Institute of Technology',
    region: 'Southern',
    caseIds: ['CASE-2024-001', 'CASE-2024-002', 'CASE-2024-003', 'CASE-2024-006'],
  },
  {
    id: 'INST-0117',
    name: 'Bhaskara College of Engineering',
    region: 'Western',
    caseIds: ['CASE-2024-004', 'CASE-2024-005'],
  },
  {
    id: 'INST-0289',
    name: 'Vivekananda Technical University',
    region: 'Eastern',
    caseIds: ['CASE-2024-007', 'CASE-2024-008'],
  },
  {
    id: 'INST-0355',
    name: 'Aryabhatta Institute of Sciences',
    region: 'Northern',
    caseIds: ['CASE-2024-009', 'CASE-2024-010'],
  },
  {
    id: 'INST-0601',
    name: 'National Polytechnic College',
    region: 'Central',
    caseIds: ['CASE-2024-011', 'CASE-2024-012'],
  },
];

// Seed overlap candidates for deterministic matching demonstrations
export const SEED_OVERLAPS: OverlapCandidate[] = [
  {
    id: 'OVL-001',
    caseAId: 'CASE-2024-002',
    caseBId: 'CASE-2024-004',
    matchMethod: 'keyword',
    similarityScore: 0.84,
    evidence:
      'Both complaints describe withholding or delay of student fee refunds ("examination fee refund", "examination charges pending") across Grievance Cell and Examination Bureau.',
    reviewDecision: 'pending',
    createdAt: '2024-10-01T00:00:00+05:30',
  },
  {
    id: 'OVL-002',
    caseAId: 'CASE-2024-001',
    caseBId: 'CASE-2024-006',
    matchMethod: 'exact-id',
    evidence:
      'Exact institution ID (INST-0042) shared across Approval Bureau (Affiliation Compliance) and Infrastructure Bureau (Laboratory Standards). Potential institutional governance failure.',
    reviewDecision: 'pending',
    createdAt: '2024-10-01T00:00:00+05:30',
  },
  {
    id: 'OVL-003',
    caseAId: 'CASE-2024-005',
    caseBId: 'CASE-2024-010',
    matchMethod: 'keyword',
    similarityScore: 0.78,
    evidence:
      'Cross-institution faculty grievance pattern: Faculty shortage (45% deficit) in Western region matching 7th CPC salary arrears in Northern region.',
    reviewDecision: 'deferred',
    reviewNote: 'Different institutions. Maintained in audit awareness for national cadre policy review.',
    reviewedAt: '2024-10-05T14:00:00+05:30',
    reviewedBy: 'Dr. Rajesh Verma',
    createdAt: '2024-10-01T00:00:00+05:30',
  },
];
