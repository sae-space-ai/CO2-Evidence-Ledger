// CO2 Evidence Ledger - Claim Detail Page
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Button, Select, Alert, Badge, StatusBadge, EmptyState } from '../components/Layout';
import type { Claim, Activity, EvidenceDocument, LedgerEvent, Project } from '../types';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evidences, setEvidences] = useState<EvidenceDocument[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [allEvidences, setAllEvidences] = useState<EvidenceDocument[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadClaim(id); }, [id]);

  async function loadClaim(claimId: string) {
    setLoading(true);
    try {
      const claims = await mockApi.getClaims(user!.organizationId);
      const c = claims.find(cl => cl.id === claimId);
      if (!c) { setLoading(false); return; }
      setClaim(c);

      const [evts, evs, projs] = await Promise.all([
        mockApi.getEvents(claimId),
        mockApi.getEvidences(user!.organizationId),
        mockApi.getProjects(user!.organizationId),
      ]);
      setEvents(evts);
      setAllEvidences(evs);
      setEvidences(evs.filter(e => c.evidenceIds.includes(e.id)));

      const proj = projs.find(p => p.id === c.projectId);
      setProject(proj || null);

      // Load all activities for this project
      if (proj) {
        const acts = await mockApi.getActivities(proj.id);
        setAllActivities(acts);
        setActivities(acts.filter(a => c.activityIds.includes(a.id)));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkEvidence(evidenceId: string) {
    if (!claim) return;
    await mockApi.linkEvidenceToClaim(claim.id, evidenceId);
    await loadClaim(claim.id);
  }

  async function handleLinkActivity(activityId: string) {
    if (!claim) return;
    await mockApi.linkActivityToClaim(claim.id, activityId);
    await loadClaim(claim.id);
  }

  async function handleStatusChange(status: Claim['status']) {
    if (!claim) return;
    await mockApi.updateClaimStatus(claim.id, status);
    await loadClaim(claim.id);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><i className="fa-solid fa-spinner fa-spin text-slate-400 text-xl"></i></div>;
  }

  if (!claim) {
    return (
      <div className="space-y-4">
        <Alert type="danger">Declaración no encontrada o sin permisos de acceso.</Alert>
        <Link to="/claims" className="text-sm text-slate-600 hover:text-slate-900">← Volver a declaraciones</Link>
      </div>
    );
  }

  const availableActivities = allActivities.filter(a => !claim.activityIds.includes(a.id));
  const availableEvidences = allEvidences.filter(e => !claim.evidenceIds.includes(e.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to="/claims" className="text-xs text-slate-500 hover:text-slate-700 mb-1 inline-block">← Declaraciones</Link>
          <h1 className="text-xl font-bold text-slate-900">{claim.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{claim.description || 'Sin descripción'}</p>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={claim.status} />
            {project && <span className="text-xs text-slate-500"><i className="fa-solid fa-folder mr-1"></i>{project.name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {claim.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('READY_FOR_REVIEW')}>Enviar a revisión</Button>
          )}
          {claim.status === 'READY_FOR_REVIEW' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('REVIEWED_INTERNAL')}>Revisar (interno)</Button>
              <Button size="sm" variant="danger" onClick={() => handleStatusChange('REJECTED_INTERNAL')}>Rechazar</Button>
            </>
          )}
          {claim.status === 'REJECTED_INTERNAL' && (
            <Button size="sm" variant="secondary" onClick={() => handleStatusChange('DRAFT')}>Volver a borrador</Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{claim.totalTCO2e ?? '—'}</p>
            <p className="text-[11px] text-slate-500">tCO2e total</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{claim.activityIds.length}</p>
            <p className="text-[11px] text-slate-500">Actividades</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{claim.evidenceIds.length}</p>
            <p className="text-[11px] text-slate-500">Evidencias</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{events.length}</p>
            <p className="text-[11px] text-slate-500">Eventos en cadena</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities */}
        <Card>
          <CardHeader title="Actividades vinculadas" subtitle={`${activities.length} actividad(es)`} />
          <div className="p-5 space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500">Sin actividades vinculadas</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{act.name}</span>
                    <span className="text-xs font-mono text-slate-600">{act.resultTCO2e} tCO2e</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{act.quantity} {act.unit} × {act.factorValue} kgCO2e/{act.unit}</p>
                </div>
              ))
            )}
            {availableActivities.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2">Vincular actividad disponible:</p>
                <Select
                  value=""
                  onChange={e => { if (e.target.value) handleLinkActivity(e.target.value); }}
                  options={[
                    { value: '', label: 'Seleccionar actividad...' },
                    ...availableActivities.map(a => ({ value: a.id, label: `${a.name} (${a.resultTCO2e} tCO2e)` })),
                  ]}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Evidence */}
        <Card>
          <CardHeader title="Evidencias vinculadas" subtitle={`${evidences.length} documento(s)`} />
          <div className="p-5 space-y-3">
            {evidences.length === 0 ? (
              <p className="text-xs text-slate-500">Sin evidencias vinculadas</p>
            ) : (
              evidences.map(ev => (
                <div key={ev.id} className="p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{ev.fileName}</span>
                    <Badge variant={ev.isDuplicate ? 'warning' : 'default'}>
                      {ev.isDuplicate ? 'Duplicado' : 'Original'}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 break-all">SHA-256: {ev.sha256.substring(0, 32)}...</p>
                </div>
              ))
            )}
            {availableEvidences.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2">Vincular evidencia disponible:</p>
                <Select
                  value=""
                  onChange={e => { if (e.target.value) handleLinkEvidence(e.target.value); }}
                  options={[
                    { value: '', label: 'Seleccionar evidencia...' },
                    ...availableEvidences.map(e => ({ value: e.id, label: e.fileName })),
                  ]}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader title="Cronología de acontecimientos" subtitle="Append-only · Cada evento encadenado por hash" />
        <div className="p-5">
          {events.length === 0 ? (
            <EmptyState icon="fa-timeline" title="Sin eventos" description="La cronología se genera automáticamente con cada acción." />
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
              <div className="space-y-4">
                {events.map(evt => (
                  <div key={evt.eventId} className="relative pl-10">
                    <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                    <div className="p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getEventVariant(evt.type)}>{formatEventType(evt.type)}</Badge>
                          <span className="text-[11px] text-slate-500">{evt.actorName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(evt.timestamp).toLocaleString('es-ES')}</span>
                      </div>
                      
                      {/* Show status changes clearly */}
                      {evt.type === 'STATUS_CHANGED' && evt.payload && (
                        <div className="mb-2 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2 text-xs">
                            <StatusBadge status={String(evt.payload.from || '')} />
                            <i className="fa-solid fa-arrow-right text-slate-400"></i>
                            <StatusBadge status={String(evt.payload.to || '')} />
                          </div>
                        </div>
                      )}
                      
                      {/* Show other payload data */}
                      {evt.type !== 'STATUS_CHANGED' && evt.payload && Object.keys(evt.payload).length > 0 && (
                        <div className="mb-2 p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-600">
                          {Object.entries(evt.payload).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-[10px] font-mono text-slate-400 break-all">
                        <span className="text-slate-500">Hash:</span> {evt.eventHash.substring(0, 40)}...
                      </div>
                      {evt.previousHash && (
                        <div className="text-[10px] font-mono text-slate-300 break-all">
                          <span className="text-slate-400">Prev:</span> {evt.previousHash.substring(0, 40)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Warnings */}
      <Alert type="warning">
        <strong>Limitaciones de esta declaración:</strong><br />
        • El estado «REVIEWED_INTERNAL» NO equivale a verificación por tercero independiente.<br />
        • Los factores de emisión fueron suministrados por el usuario; no han sido validados.<br />
        • La cadena de hashes es interna; un administrador con acceso a la base podría reconstruirla.<br />
        • Este expediente NO constituye una certificación de huella de carbono.
      </Alert>
    </div>
  );
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    CREATED: 'Creada',
    EVIDENCE_LINKED: 'Evidencia vinculada',
    STATUS_CHANGED: 'Estado cambiado',
    REVIEWED: 'Revisada',
    ACTIVITY_ADDED: 'Actividad añadida',
    EXPORTED: 'Exportada',
  };
  return map[type] || type;
}

function getEventVariant(type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    CREATED: 'info',
    EVIDENCE_LINKED: 'success',
    STATUS_CHANGED: 'warning',
    REVIEWED: 'info',
    ACTIVITY_ADDED: 'success',
    EXPORTED: 'default',
  };
  return map[type] || 'default';
}
