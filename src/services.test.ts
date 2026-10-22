// CO2 Evidence Ledger - Tests de servicios
// Verifica la lógica de negocio del sistema

import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi, calculateEmission, canonicalize, computeSHA256String } from './services.mock';

describe('Emission Calculation', () => {
  it('calculates diesel fixture correctly', () => {
    const result = calculateEmission('1000', '2.5');
    expect(result).not.toBeNull();
    expect(result?.kgCO2e).toBe('2500');
    expect(result?.tCO2e).toBe('2.5');
  });

  it('calculates electricity fixture correctly', () => {
    const result = calculateEmission('500', '0.2');
    expect(result).not.toBeNull();
    expect(result?.kgCO2e).toBe('100');
    expect(result?.tCO2e).toBe('0.1');
  });

  it('calculates total fixture correctly', () => {
    const diesel = calculateEmission('1000', '2.5');
    const electricity = calculateEmission('500', '0.2');
    expect(diesel).not.toBeNull();
    expect(electricity).not.toBeNull();
    
    const totalKg = parseFloat(diesel!.kgCO2e) + parseFloat(electricity!.kgCO2e);
    expect(totalKg).toBe(2600);
    expect(totalKg / 1000).toBe(2.6);
  });

  it('rejects negative values', () => {
    expect(calculateEmission('-100', '2.5')).toBeNull();
    expect(calculateEmission('100', '-2.5')).toBeNull();
  });

  it('rejects non-numeric values', () => {
    expect(calculateEmission('abc', '2.5')).toBeNull();
    expect(calculateEmission('100', 'xyz')).toBeNull();
  });

  it('rejects infinity', () => {
    expect(calculateEmission('Infinity', '2.5')).toBeNull();
    expect(calculateEmission('100', 'Infinity')).toBeNull();
  });
});

describe('Canonical Serialization', () => {
  it('sorts object keys alphabetically', () => {
    const result = canonicalize({ b: 2, a: 1 });
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('handles nested objects', () => {
    const result = canonicalize({ z: { y: 1, x: 2 } });
    expect(result).toBe('{"z":{"x":2,"y":1}}');
  });

  it('handles arrays', () => {
    const result = canonicalize([3, 1, 2]);
    expect(result).toBe('[3,1,2]');
  });

  it('handles null and undefined', () => {
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize(undefined)).toBe('null');
  });

  it('is deterministic', () => {
    const obj = { c: 3, a: 1, b: { y: 2, x: 1 } };
    const result1 = canonicalize(obj);
    const result2 = canonicalize(obj);
    expect(result1).toBe(result2);
  });
});

describe('Status Transitions', () => {
  beforeEach(async () => {
    // Reset storage
    localStorage.clear();
    await mockApi.login('demo@co2evidence.local', 'demo1234');
  });

  it('allows valid transition: DRAFT → READY_FOR_REVIEW', async () => {
    const projects = await mockApi.getProjects('org-1');
    let projectId = projects[0]?.id;
    if (!projectId) {
      const project = await mockApi.createProject('org-1', {
        name: 'Test',
        description: '',
        operationalBoundary: 'Test',
        reportingYear: 2026,
      });
      projectId = project.id;
    }

    const claim = await mockApi.createClaim('org-1', projectId, {
      title: 'Test Claim',
      description: '',
    });
    expect(claim.status).toBe('DRAFT');

    const updated = await mockApi.updateClaimStatus(claim.id, 'READY_FOR_REVIEW');
    expect(updated.status).toBe('READY_FOR_REVIEW');

    // Verify event was recorded correctly
    const events = await mockApi.getEvents(claim.id);
    const statusEvent = events.find(e => e.type === 'STATUS_CHANGED');
    expect(statusEvent).toBeDefined();
    expect(statusEvent?.payload.from).toBe('DRAFT');
    expect(statusEvent?.payload.to).toBe('READY_FOR_REVIEW');
  });

  it('rejects invalid transition: DRAFT → REVIEWED_INTERNAL', async () => {
    const projects = await mockApi.getProjects('org-1');
    let projectId = projects[0]?.id;
    if (!projectId) {
      const project = await mockApi.createProject('org-1', {
        name: 'Test',
        description: '',
        operationalBoundary: 'Test',
        reportingYear: 2026,
      });
      projectId = project.id;
    }

    const claim = await mockApi.createClaim('org-1', projectId, {
      title: 'Test Claim',
      description: '',
    });

    await expect(
      mockApi.updateClaimStatus(claim.id, 'REVIEWED_INTERNAL')
    ).rejects.toThrow('Transición de estado inválida');
  });

  it('records correct from/to in status change events', async () => {
    const projects = await mockApi.getProjects('org-1');
    let projectId = projects[0]?.id;
    if (!projectId) {
      const project = await mockApi.createProject('org-1', {
        name: 'Test',
        description: '',
        operationalBoundary: 'Test',
        reportingYear: 2026,
      });
      projectId = project.id;
    }

    const claim = await mockApi.createClaim('org-1', projectId, {
      title: 'Test Claim',
      description: '',
    });

    await mockApi.updateClaimStatus(claim.id, 'READY_FOR_REVIEW');
    await mockApi.updateClaimStatus(claim.id, 'REVIEWED_INTERNAL');

    const events = await mockApi.getEvents(claim.id);
    const statusEvents = events.filter(e => e.type === 'STATUS_CHANGED');
    
    expect(statusEvents.length).toBe(2);
    expect(statusEvents[0].payload.from).toBe('DRAFT');
    expect(statusEvents[0].payload.to).toBe('READY_FOR_REVIEW');
    expect(statusEvents[1].payload.from).toBe('READY_FOR_REVIEW');
    expect(statusEvents[1].payload.to).toBe('REVIEWED_INTERNAL');
  });
});

describe('SHA-256 Hashing', () => {
  it('produces consistent hashes', async () => {
    const data = 'test data';
    const hash1 = await computeSHA256String(data);
    const hash2 = await computeSHA256String(data);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 = 32 bytes = 64 hex chars
  });

  it('produces different hashes for different data', async () => {
    const hash1 = await computeSHA256String('data1');
    const hash2 = await computeSHA256String('data2');
    expect(hash1).not.toBe(hash2);
  });
});
