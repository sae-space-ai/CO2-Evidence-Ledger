// CO2 Evidence Ledger - Claims Page
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Button, Input, Textarea, Select, Alert, EmptyState, StatusBadge } from '../components/Layout';
import type { Claim, Project } from '../types';

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', projectId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [c, p] = await Promise.all([
      mockApi.getClaims(user!.organizationId),
      mockApi.getProjects(user!.organizationId),
    ]);
    setClaims(c);
    setProjects(p);
    if (p.length > 0 && !form.projectId) setForm(f => ({ ...f, projectId: p[0].id }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await mockApi.createClaim(user!.organizationId, form.projectId, {
        title: form.title,
        description: form.description,
      });
      setShowForm(false);
      setForm({ title: '', description: '', projectId: projects[0]?.id || '' });
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Declaraciones</h1>
          <p className="text-sm text-slate-500 mt-1">Expedientes de evidencias con cronología auditable</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={projects.length === 0}>
          <i className="fa-solid fa-plus"></i> Nueva declaración
        </Button>
      </div>

      {projects.length === 0 && (
        <Alert type="warning">
          No hay proyectos disponibles. Crea un proyecto primero en la sección de Proyectos.
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader title="Nueva declaración" subtitle="Estado inicial: BORRADOR. Sin calificar de verificada." />
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <Select
              label="Proyecto"
              value={form.projectId}
              onChange={e => setForm({ ...form, projectId: e.target.value })}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
            <Input
              label="Título"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Declaración de emisiones Q1 2026"
              required
            />
            <Textarea
              label="Descripción"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Contexto y alcance de la declaración..."
              rows={2}
            />
            <Alert type="info">
              Esta declaración se crea en estado BORRADOR. No constituye una verificación externa. 
              El estado REVIEWED_INTERNAL solo indica revisión interna, no auditoría independiente.
            </Alert>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear declaración'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Declaraciones" subtitle={`${claims.length} expediente(s)`} />
        <div className="p-5">
          {claims.length === 0 ? (
            <EmptyState icon="fa-clipboard-list" title="Sin declaraciones" description="Crea una declaración para vincular actividades y evidencias." />
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <Link key={claim.id} to={`/claims/${claim.id}`} className="block p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{claim.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{claim.description || 'Sin descripción'}</p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                    <span><i className="fa-solid fa-industry mr-1"></i>{claim.activityIds.length} actividades</span>
                    <span><i className="fa-solid fa-file-shield mr-1"></i>{claim.evidenceIds.length} evidencias</span>
                    <span><i className="fa-solid fa-weight-hanging mr-1"></i>{claim.totalTCO2e ?? '—'} tCO2e</span>
                    <span><i className="fa-solid fa-clock mr-1"></i>{new Date(claim.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
