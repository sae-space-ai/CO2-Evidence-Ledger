// CO2 Evidence Ledger - Type Definitions
// Fase 00 - Tipos del dominio

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'reviewer' | 'viewer';
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  operationalBoundary: string;
  reportingYear: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  category: 'diesel' | 'gasoline' | 'natural_gas' | 'electricity';
  scope: 1 | 2;
  periodStart: string;
  periodEnd: string;
  quantity: string; // decimal string
  unit: string;
  factorValue: string; // decimal string kgCO2e/unit
  factorSource: string;
  factorYear: number;
  method: string;
  notes: string;
  resultKgCO2e: string | null;
  resultTCO2e: string | null;
  createdAt: string;
}

export interface EvidenceDocument {
  id: string;
  organizationId: string;
  uploaderId: string;
  fileName: string;
  sanitizedFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  isDuplicate: boolean;
  duplicateOf?: string;
}

export type ClaimStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'REVIEWED_INTERNAL' | 'REJECTED_INTERNAL';

export interface Claim {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string;
  status: ClaimStatus;
  activityIds: string[];
  evidenceIds: string[];
  totalKgCO2e: string | null;
  totalTCO2e: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEvent {
  sequence: number;
  eventId: string;
  claimId: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  type: 'CREATED' | 'EVIDENCE_LINKED' | 'STATUS_CHANGED' | 'REVIEWED' | 'ACTIVITY_ADDED' | 'EXPORTED';
  payload: Record<string, unknown>;
  previousHash: string;
  eventHash: string;
}

export interface IntegrityResult {
  valid: boolean;
  totalEvents: number;
  brokenAt?: number;
  message: string;
}

export interface ExportManifest {
  version: string;
  generatedAt: string;
  claim: Claim;
  organization: { id: string; name: string };
  project: { id: string; name: string; operationalBoundary: string; reportingYear: number } | null;
  activities: Activity[];
  evidences: { id: string; fileName: string; sha256: string; sizeBytes: number }[];
  events: LedgerEvent[];
  integrity: { valid: boolean; totalEvents: number; message: string };
  warnings: string[];
  limitations: string[];
}

export interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  organizations: Organization[];
  projects: Project[];
  activities: Activity[];
  evidences: EvidenceDocument[];
  claims: Claim[];
  events: LedgerEvent[];
}
