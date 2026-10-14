const fs = require('fs');
const path = require('path');

const fileContent = `import { User, Case, Evidence, CustodyEvent, BlockchainBlock, AIAnalysisRecord, AuditLog, IntegrityAlert, PlatformNotification } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-SA-01',
    name: 'Chief Inspector Sarah Vance',
    email: 'sarah.vance@blockvault.gov',
    role: 'SUPER_ADMIN',
    badgeNumber: 'DFIR-001',
    department: 'Digital Forensic Incident Response Directorate',
    status: 'ACTIVE',
    assignedCases: ['BV-2026-0001', 'BV-2026-0002', 'BV-2026-0003'],
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'USR-ADM-02',
    name: 'Capt. Marcus Reynolds',
    email: 'marcus.reynolds@blockvault.gov',
    role: 'ADMIN',
    badgeNumber: 'DFIR-014',
    department: 'Cybercrime Operations Division',
    status: 'ACTIVE',
    assignedCases: ['BV-2026-0001', 'BV-2026-0004'],
    lastLogin: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdAt: '2026-01-12T09:15:00.000Z'
  },
  {
    id: 'USR-INV-03',
    name: 'Det. Elena Chen',
    email: 'elena.chen@blockvault.gov',
    role: 'INVESTIGATOR',
    badgeNumber: 'INV-409',
    department: 'Financial Cyber Fraud Taskforce',
    status: 'ACTIVE',
    assignedCases: ['BV-2026-0001', 'BV-2026-0003', 'BV-2026-0005'],
    lastLogin: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: '2026-02-01T10:00:00.000Z'
  },
  {
    id: 'USR-INV-04',
    name: 'Special Agent David Ross',
    email: 'david.ross@blockvault.gov',
    role: 'INVESTIGATOR',
    badgeNumber: 'INV-512',
    department: 'National Counter-Espionage Unit',
    status: 'ACTIVE',
    assignedCases: ['BV-2026-0002', 'BV-2026-0006'],
    lastLogin: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    createdAt: '2026-02-15T11:30:00.000Z'
  },
  {
    id: 'USR-REV-05',
    name: 'Dr. Evelyn Martinez',
    email: 'evelyn.martinez@blockvault.gov',
    role: 'REVIEWER',
    badgeNumber: 'REV-880',
    department: 'Independent Judicial Forensic Council',
    status: 'ACTIVE',
    assignedCases: ['BV-2026-0001', 'BV-2026-0002', 'BV-2026-0004'],
    lastLogin: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    createdAt: '2026-01-20T14:00:00.000Z'
  }
];

export const INITIAL_CASES: Case[] = [
  {
    id: 'CASE-001',
    caseNumber: 'BV-2026-0001',
    title: 'Operation Apex: Sovereign Bank Wire Fraud & Deepfake Impersonation',
    description: 'Investigation into unauthorized SWIFT transfer requests facilitated through synthetic executive voice cloning and forged digital board authorizations.',
    type: 'FINANCIAL_FRAUD',
    priority: 'CRITICAL',
    classification: 'TOP_SECRET',
    leadInvestigatorId: 'USR-INV-03',
    leadInvestigatorName: 'Det. Elena Chen',
    supportingInvestigatorIds: ['USR-ADM-02'],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-08-10T09:00:00.000Z',
    status: 'ACTIVE',
    accessScope: 'RESTRICTED',
    retentionPeriodYears: 10,
    evidenceCount: 6,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    id: 'CASE-002',
    caseNumber: 'BV-2026-0002',
    title: 'Project Chiron: Advanced Persistent Threat Intrusion & SCADA Exfiltration',
    description: 'Forensic acquisition of memory dumps, raw network packet captures, and server disk images from regional power grid control network.',
    type: 'CYBER_INCIDENT',
    priority: 'CRITICAL',
    classification: 'TOP_SECRET',
    leadInvestigatorId: 'USR-INV-04',
    leadInvestigatorName: 'Special Agent David Ross',
    supportingInvestigatorIds: ['USR-SA-01'],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-08-14T11:20:00.000Z',
    status: 'ACTIVE',
    accessScope: 'CROSS_AGENCY',
    retentionPeriodYears: 15,
    evidenceCount: 4,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 85).toISOString()
  },
  {
    id: 'CASE-003',
    caseNumber: 'BV-2026-0003',
    title: 'Harbor Point Cargo Terminal Narcotics Smuggling Surveillance Logs',
    description: 'Analysis of tampered CCTV video feeds and encrypted handheld radio audio recordings recovered from maritime container depot.',
    type: 'NARCOTICS',
    priority: 'HIGH',
    classification: 'RESTRICTED',
    leadInvestigatorId: 'USR-INV-03',
    leadInvestigatorName: 'Det. Elena Chen',
    supportingInvestigatorIds: [],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-08-18T14:40:00.000Z',
    status: 'UNDER_REVIEW',
    accessScope: 'DEPARTMENTAL',
    retentionPeriodYears: 7,
    evidenceCount: 4,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'CASE-004',
    caseNumber: 'BV-2026-0004',
    title: 'Quantum Dynamics Defense IP Theft & Exfiltrated CAD Blueprints',
    description: 'Investigation into leaked hypersonics propulsion system CAD archives found on encrypted darknet storage locker.',
    type: 'IP_THEFT',
    priority: 'HIGH',
    classification: 'TOP_SECRET',
    leadInvestigatorId: 'USR-ADM-02',
    leadInvestigatorName: 'Capt. Marcus Reynolds',
    supportingInvestigatorIds: ['USR-INV-04'],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-08-25T16:10:00.000Z',
    status: 'ACTIVE',
    accessScope: 'RESTRICTED',
    retentionPeriodYears: 20,
    evidenceCount: 3,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 320).toISOString()
  },
  {
    id: 'CASE-005',
    caseNumber: 'BV-2026-0005',
    title: 'City Council Municipal Procurement Ransomware Breach',
    description: 'Post-incident analysis of decrypted server images, ransom extortion notes, and bitcoin ledger transaction trail.',
    type: 'CYBER_INCIDENT',
    priority: 'MEDIUM',
    classification: 'INTERNAL_LAW_ENFORCEMENT',
    leadInvestigatorId: 'USR-INV-03',
    leadInvestigatorName: 'Det. Elena Chen',
    supportingInvestigatorIds: [],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-07-02T10:00:00.000Z',
    status: 'CLOSED',
    accessScope: 'DEPARTMENTAL',
    retentionPeriodYears: 5,
    evidenceCount: 2,
    lastActivityAt: '2026-08-01T15:00:00.000Z'
  },
  {
    id: 'CASE-006',
    caseNumber: 'BV-2026-0006',
    title: 'Metro Highway Hit-and-Run Dashcam & Smart Traffic Sensor Logs',
    description: 'Archived vehicular incident records with automated optical number plate recognition (ANPR) timestamp corroboration.',
    type: 'HOMICIDE_INVESTIGATION',
    priority: 'LOW',
    classification: 'CONFIDENTIAL',
    leadInvestigatorId: 'USR-INV-04',
    leadInvestigatorName: 'Special Agent David Ross',
    supportingInvestigatorIds: [],
    reviewerId: 'USR-REV-05',
    reviewerName: 'Dr. Evelyn Martinez',
    dateCreated: '2026-06-15T08:30:00.000Z',
    status: 'ARCHIVED',
    accessScope: 'DEPARTMENTAL',
    retentionPeriodYears: 7,
    evidenceCount: 2,
    lastActivityAt: '2026-07-20T12:00:00.000Z'
  }
];
`;

if (!fs.existsSync(path.join(__dirname, '../src/data'))) {
  fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });
}

fs.writeFileSync(path.join(__dirname, '../src/data/initialDemoData.ts'), fileContent, 'utf8');
console.log('Part 1 written successfully.');
