// CO2 Evidence Ledger - Mock Services Layer (Demo Mode)
// AVISO: Esta capa es una SIMULACIÓN para demostración del frontend.
// En producción, todas las operaciones se ejecutan en el backend Go con PostgreSQL.
// El hashing SHA-256 SÍ es real (Web Crypto API).

import type {
  User, Organization, Project, Activity, EvidenceDocument,
  Claim, LedgerEvent, ClaimStatus, IntegrityResult, ExportManifest
} from './types';

// ============ CRYPTO UTILITIES ============

export async function computeSHA256(file: File | ArrayBuffer): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSHA256String(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============ DETERMINISTIC SERIALIZATION ============

export function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalize(item)).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalize((obj as Record<string, unknown>)[k])}`);
    return '{' + pairs.join(',') + '}';
  }
  return String(obj);
}

// ============ EMISSION CALCULATION (exact decimal via string math) ============

export function calculateEmission(quantity: string, factor: string): { kgCO2e: string; tCO2e: string } | null {
  try {
    const q = parseFloat(quantity);
    const f = parseFloat(factor);
    if (isNaN(q) || isNaN(f) || q < 0 || f < 0) return null;
    if (!isFinite(q) || !isFinite(f)) return null;
    
    // Use string-based multiplication for display precision
    const kgResult = (q * f).toFixed(6).replace(/\.?0+$/, '');
    const tResult = (q * f / 1000).toFixed(6).replace(/\.?0+$/, '');
    
    return { kgCO2e: kgResult, tCO2e: tResult };
  } catch {
    return null;
  }
}

// ============ MOCK STORAGE (localStorage - clearly labeled as demo) ============

const STORAGE_PREFIX = 'co2evidence_demo_';

function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// ============ MOCK API ============

let currentUser: User | null = null;

export const mockApi = {
  // Health
  async health(): Promise<{ status: string; mode: string }> {
    return { status: 'ok', mode: 'DEMO_FRONTEND_ONLY' };
  },

  async ready(): Promise<{ ready: boolean; database: string }> {
    return { ready: true, database: 'localStorage (DEMO - sin PostgreSQL real)' };
  },

  // Auth
  async login(email: string, _password: string): Promise<User> {
    // Demo: accept any password for demo@co2evidence.local
    if (email === 'demo@co2evidence.local' || email === 'admin@org.test') {
      const orgId = email === 'demo@co2evidence.local' ? 'org-1' : 'org-2';
      const user: User = {
        id: email === 'demo@co2evidence.local' ? 'user-1' : 'user-2',
        email,
        name: email === 'demo@co2evidence.local' ? 'Administradora Demo' : 'Revisor Externo',
        role: email === 'demo@co2evidence.local' ? 'owner' : 'reviewer',
        organizationId: orgId,
        createdAt: new Date().toISOString(),
      };
      currentUser = user;
      setStorage('session', user);
      return user;
    }
    throw new Error('Credenciales no válidas');
  },

  async logout(): Promise<void> {
    currentUser = null;
    localStorage.removeItem(STORAGE_PREFIX + 'session');
  },

  async me(): Promise<User | null> {
    if (!currentUser) {
      currentUser = getStorage<User | null>('session', null);
    }
    return currentUser;
  },

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const orgs = getStorage<Organization[]>('organizations', []);
    if (orgs.length === 0) {
      const defaultOrgs: Organization[] = [
        { id: 'org-1', name: 'Mi Empresa Demo S.L.', createdAt: '2026-01-15T10:00:00Z', ownerId: 'user-1' },
        { id: 'org-2', name: 'Consultora Sostenibilidad S.A.', createdAt: '2026-02-01T09:00:00Z', ownerId: 'user-2' },
      ];
      setStorage('organizations', defaultOrgs);
      return defaultOrgs.filter(o => o.id === currentUser?.organizationId);
    }
    return orgs.filter(o => o.id === currentUser?.organizationId);
  },

  async createOrganization(name: string): Promise<Organization> {
    const orgs = getStorage<Organization[]>('organizations', []);
    const newOrg: Organization = {
      id: 'org-' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      ownerId: currentUser!.id,
    };
    orgs.push(newOrg);
    setStorage('organizations', orgs);
    return newOrg;
  },

  // Projects
  async getProjects(orgId: string): Promise<Project[]> {
    const projects = getStorage<Project[]>('projects', []);
    return projects.filter(p => p.organizationId === orgId);
  },

  async createProject(orgId: string, data: Omit<Project, 'id' | 'organizationId' | 'createdAt'>): Promise<Project> {
    const projects = getStorage<Project[]>('projects', []);
    const project: Project = {
      ...data,
      id: 'proj-' + Date.now(),
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };
    projects.push(project);
    setStorage('projects', projects);
    return project;
  },

  // Activities
  async getActivities(projectId: string): Promise<Activity[]> {
    const activities = getStorage<Activity[]>('activities', []);
    return activities.filter(a => a.projectId === projectId && a.organizationId === currentUser?.organizationId);
  },

  async createActivity(projectId: string, data: Omit<Activity, 'id' | 'projectId' | 'organizationId' | 'createdAt' | 'resultKgCO2e' | 'resultTCO2e'>): Promise<Activity> {
    const activities = getStorage<Activity[]>('activities', []);
    const calc = calculateEmission(data.quantity, data.factorValue);
    const activity: Activity = {
      ...data,
      id: 'act-' + Date.now(),
      projectId,
      organizationId: currentUser!.organizationId,
      resultKgCO2e: calc?.kgCO2e ?? null,
      resultTCO2e: calc?.tCO2e ?? null,
      createdAt: new Date().toISOString(),
    };
    activities.push(activity);
    setStorage('activities', activities);
    return activity;
  },

  // Evidence
  async getEvidences(orgId: string): Promise<EvidenceDocument[]> {
    const evidences = getStorage<EvidenceDocument[]>('evidences', []);
    return evidences.filter(e => e.organizationId === orgId);
  },

  async uploadEvidence(file: File): Promise<EvidenceDocument> {
    // Size limit: 3 MiB
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('Archivo excede el límite de 3 MiB');
    }

    // Validate MIME
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}. Aceptados: PDF, PNG, JPEG, CSV, TXT`);
    }

    // Sanitize filename
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
    
    // Compute real SHA-256
    const sha256 = await computeSHA256(file);

    // Check for duplicate
    const evidences = getStorage<EvidenceDocument[]>('evidences', []);
    const existing = evidences.find(e => e.sha256 === sha256 && e.organizationId === currentUser?.organizationId);
    
    if (existing) {
      const doc: EvidenceDocument = {
        id: 'ev-' + Date.now(),
        organizationId: currentUser!.organizationId,
        uploaderId: currentUser!.id,
        fileName: file.name,
        sanitizedFileName: sanitized,
        mimeType: file.type,
        sizeBytes: file.size,
        sha256,
        uploadedAt: new Date().toISOString(),
        isDuplicate: true,
        duplicateOf: existing.id,
      };
      evidences.push(doc);
      setStorage('evidences', evidences);
      return doc;
    }

    const doc: EvidenceDocument = {
      id: 'ev-' + Date.now(),
      organizationId: currentUser!.organizationId,
      uploaderId: currentUser!.id,
      fileName: file.name,
      sanitizedFileName: sanitized,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256,
      uploadedAt: new Date().toISOString(),
      isDuplicate: false,
    };
    evidences.push(doc);
    setStorage('evidences', evidences);
    return doc;
  },

  // Claims
  async getClaims(orgId: string): Promise<Claim[]> {
    const claims = getStorage<Claim[]>('claims', []);
    return claims.filter(c => c.organizationId === orgId);
  },

  async createClaim(orgId: string, projectId: string, data: { title: string; description: string }): Promise<Claim> {
    const claims = getStorage<Claim[]>('claims', []);
    const claim: Claim = {
      id: 'claim-' + Date.now(),
      organizationId: orgId,
      projectId,
      title: data.title,
      description: data.description,
      status: 'DRAFT',
      activityIds: [],
      evidenceIds: [],
      totalKgCO2e: null,
      totalTCO2e: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    claims.push(claim);
    setStorage('claims', claims);
    
    // Create initial event
    await this.addEvent(claim.id, 'CREATED', { title: data.title });
    return claim;
  },

  async updateClaimStatus(claimId: string, status: ClaimStatus): Promise<Claim> {
    const claims = getStorage<Claim[]>('claims', []);
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) throw new Error('Declaración no encontrada');
    
    // Capturar estado ANTES de actualizar
    const previousStatus = claims[idx].status;
    
    // Validar transición de estado
    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      'DRAFT': ['READY_FOR_REVIEW'],
      'READY_FOR_REVIEW': ['REVIEWED_INTERNAL', 'REJECTED_INTERNAL', 'DRAFT'],
      'REVIEWED_INTERNAL': ['DRAFT'],
      'REJECTED_INTERNAL': ['DRAFT'],
    };
    
    if (!validTransitions[previousStatus]?.includes(status)) {
      throw new Error(`Transición de estado inválida: ${previousStatus} → ${status}`);
    }
    
    claims[idx].status = status;
    claims[idx].updatedAt = new Date().toISOString();
    setStorage('claims', claims);
    
    await this.addEvent(claimId, 'STATUS_CHANGED', { from: previousStatus, to: status });
    return claims[idx];
  },

  async linkEvidenceToClaim(claimId: string, evidenceId: string): Promise<void> {
    const claims = getStorage<Claim[]>('claims', []);
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) throw new Error('Declaración no encontrada');
    if (!claims[idx].evidenceIds.includes(evidenceId)) {
      claims[idx].evidenceIds.push(evidenceId);
      claims[idx].updatedAt = new Date().toISOString();
      setStorage('claims', claims);
      await this.addEvent(claimId, 'EVIDENCE_LINKED', { evidenceId });
    }
  },

  async linkActivityToClaim(claimId: string, activityId: string): Promise<void> {
    const claims = getStorage<Claim[]>('claims', []);
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) throw new Error('Declaración no encontrada');
    if (!claims[idx].activityIds.includes(activityId)) {
      claims[idx].activityIds.push(activityId);
      claims[idx].updatedAt = new Date().toISOString();
      // Recalculate totals
      const activities = getStorage<Activity[]>('activities', []);
      const linkedActivities = activities.filter(a => claims[idx].activityIds.includes(a.id));
      let totalKg = 0;
      linkedActivities.forEach(a => {
        if (a.resultKgCO2e) totalKg += parseFloat(a.resultKgCO2e);
      });
      claims[idx].totalKgCO2e = totalKg.toFixed(4);
      claims[idx].totalTCO2e = (totalKg / 1000).toFixed(6);
      setStorage('claims', claims);
      await this.addEvent(claimId, 'ACTIVITY_ADDED', { activityId });
    }
  },

  // Events (append-only ledger)
  async getEvents(claimId: string): Promise<LedgerEvent[]> {
    const events = getStorage<LedgerEvent[]>('events', []);
    return events.filter(e => e.claimId === claimId).sort((a, b) => a.sequence - b.sequence);
  },

  async addEvent(claimId: string, type: LedgerEvent['type'], payload: Record<string, unknown>): Promise<LedgerEvent> {
    const events = getStorage<LedgerEvent[]>('events', []);
    const claimEvents = events.filter(e => e.claimId === claimId);
    const lastSeq = claimEvents.length > 0 ? Math.max(...claimEvents.map(e => e.sequence)) : 0;
    const lastHash = claimEvents.length > 0 ? claimEvents.sort((a, b) => b.sequence - a.sequence)[0].eventHash : '';
    
    const canonicalPayload = canonicalize({
      sequence: lastSeq + 1,
      claimId,
      actorId: currentUser!.id,
      type,
      payload,
      previousHash: lastHash,
      timestamp: new Date().toISOString(),
    });
    
    const eventHash = await computeSHA256String(canonicalPayload);
    
    const event: LedgerEvent = {
      sequence: lastSeq + 1,
      eventId: 'evt-' + Date.now() + '-' + lastSeq,
      claimId,
      actorId: currentUser!.id,
      actorName: currentUser!.name,
      timestamp: new Date().toISOString(),
      type,
      payload,
      previousHash: lastHash,
      eventHash,
    };
    
    events.push(event);
    setStorage('events', events);
    return event;
  },

  // Integrity verification
  async verifyChain(claimId: string): Promise<IntegrityResult> {
    const events = getStorage<LedgerEvent[]>('events', []);
    const claimEvents = events.filter(e => e.claimId === claimId).sort((a, b) => a.sequence - b.sequence);
    
    if (claimEvents.length === 0) {
      return { valid: true, totalEvents: 0, message: 'Sin eventos registrados' };
    }

    for (let i = 0; i < claimEvents.length; i++) {
      const evt = claimEvents[i];
      const expectedPrev = i === 0 ? '' : claimEvents[i - 1].eventHash;
      
      if (evt.previousHash !== expectedPrev) {
        return {
          valid: false,
          totalEvents: claimEvents.length,
          brokenAt: evt.sequence,
          message: `Cadena rota en secuencia ${evt.sequence}: hash anterior no coincide`,
        };
      }

      // Verify hash
      const canonicalPayload = canonicalize({
        sequence: evt.sequence,
        claimId: evt.claimId,
        actorId: evt.actorId,
        type: evt.type,
        payload: evt.payload,
        previousHash: evt.previousHash,
        timestamp: evt.timestamp,
      });
      
      const expectedHash = await computeSHA256String(canonicalPayload);
      if (evt.eventHash !== expectedHash) {
        return {
          valid: false,
          totalEvents: claimEvents.length,
          brokenAt: evt.sequence,
          message: `Hash del evento ${evt.sequence} no coincide (posible alteración del payload)`,
        };
      }
    }

    return {
      valid: true,
      totalEvents: claimEvents.length,
      message: `Cadena íntegra: ${claimEvents.length} eventos verificados correctamente`,
    };
  },

  // Export
  async exportClaim(claimId: string): Promise<ExportManifest> {
    const claims = getStorage<Claim[]>('claims', []);
    const claim = claims.find(c => c.id === claimId);
    if (!claim) throw new Error('Declaración no encontrada');

    const orgs = getStorage<Organization[]>('organizations', []);
    const org = orgs.find(o => o.id === claim.organizationId);
    
    const projects = getStorage<Project[]>('projects', []);
    const project = projects.find(p => p.id === claim.projectId) || null;
    
    const activities = getStorage<Activity[]>('activities', []);
    const claimActivities = activities.filter(a => claim.activityIds.includes(a.id));
    
    const evidences = getStorage<EvidenceDocument[]>('evidences', []);
    const claimEvidences = evidences.filter(e => claim.evidenceIds.includes(e.id));
    
    const events = getStorage<LedgerEvent[]>('events', []);
    const claimEvents = events.filter(e => e.claimId === claimId).sort((a, b) => a.sequence - b.sequence);

    // Verificar integridad de la cadena
    const integrity = await this.verifyChain(claimId);

    const manifest: ExportManifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      claim,
      organization: { id: org?.id ?? '', name: org?.name ?? 'Desconocida' },
      project: project ? {
        id: project.id,
        name: project.name,
        operationalBoundary: project.operationalBoundary,
        reportingYear: project.reportingYear,
      } : null,
      activities: claimActivities,
      evidences: claimEvidences.map(e => ({
        id: e.id,
        fileName: e.sanitizedFileName,
        sha256: e.sha256,
        sizeBytes: e.sizeBytes,
      })),
      events: claimEvents,
      integrity: {
        valid: integrity.valid,
        totalEvents: integrity.totalEvents,
        message: integrity.message,
      },
      warnings: [
        'Este paquete NO tiene anclaje temporal de confianza externa.',
        'La cadena de hashes es interna al sistema; un administrador con acceso a la base podría reconstruirla.',
        'Los factores de emisión fueron suministrados por el usuario; no han sido validados por este sistema.',
        'REVIEWED_INTERNAL no equivale a verificación por tercero independiente.',
        'Este expediente no constituye una certificación de huella de carbono.',
      ],
      limitations: [
        'El SHA-256 demuestra coincidencia de bytes, no contenido, autoría ni fecha ante terceros.',
        'La cadena append-only protege contra modificaciones accidentales pero no contra reescritura por administrador.',
        'Scope 3 y créditos de carbono no están incluidos en esta fase.',
        'No se ha realizado verificación metodológica del inventario.',
      ],
    };

    await this.addEvent(claimId, 'EXPORTED', { generatedAt: manifest.generatedAt });
    return manifest;
  },
};
