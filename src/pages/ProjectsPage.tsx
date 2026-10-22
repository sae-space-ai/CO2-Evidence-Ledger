// CO2 Evidence Ledger - Projects Page
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Button, Input, Select, Textarea, Alert, EmptyState } from '../components/Layout';
import type { Project } from '../types';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', operationalBoundary: '', reportingYear: 2026 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    const p = await mockApi.getProjects(user!.organizationId);
    setProjects(p);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await mockApi.createProject(user!.organizationId, form);
      setShowForm(false);
      setForm({ name: '', description: '', operationalBoundary: '', reportingYear: 2026 });
      await loadProjects();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proyectos de inventario</h1>
          <p className="text-sm text-slate-500 mt-1">Organiza actividades y declaraciones por proyecto</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> Nuevo proyecto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nuevo proyecto de inventario" subtitle="Define el perímetro operacional y periodo" />
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del proyecto"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Inventario GEI 2026"
                required
              />
              <Input
                label="Año de reporte"
                type="number"
                value={form.reportingYear}
                onChange={e => setForm({ ...form, reportingYear: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                required
              />
            </div>
            <Textarea
              label="Descripción"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción del proyecto de inventario..."
              rows={2}
            />
            <Input
              label="Límite operacional declarado"
              value={form.operationalBoundary}
              onChange={e => setForm({ ...form, operationalBoundary: e.target.value })}
              placeholder="Ej: Scope 1 y 2, todas las instalaciones propias"
              required
            />
            <Alert type="info">
              El límite operacional es una declaración del usuario. Este sistema no valida la exhaustividad 
              ni conformidad metodológica del perímetro declarado.
            </Alert>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear proyecto'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Proyectos activos" subtitle={`${projects.length} proyecto(s) en tu organización`} />
        <div className="p-5">
          {projects.length === 0 ? (
            <EmptyState icon="fa-folder-open" title="Sin proyectos" description="Crea un proyecto para comenzar a registrar actividades de emisión." />
          ) : (
            <div className="space-y-3">
              {projects.map(proj => (
                <div key={proj.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{proj.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{proj.description || 'Sin descripción'}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">Año {proj.reportingYear}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                    <span><i className="fa-solid fa-border-all mr-1"></i>{proj.operationalBoundary}</span>
                    <span><i className="fa-solid fa-clock mr-1"></i>{new Date(proj.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
