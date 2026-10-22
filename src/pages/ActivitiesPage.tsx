// CO2 Evidence Ledger - Activities Page
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { mockApi, calculateEmission } from '../services';
import { Card, CardHeader, Button, Input, Select, Textarea, Alert, Badge, EmptyState } from '../components/Layout';
import type { Project, Activity } from '../types';

const CATEGORIES = [
  { value: 'diesel', label: 'Gasóleo (Scope 1)' },
  { value: 'gasoline', label: 'Gasolina (Scope 1)' },
  { value: 'natural_gas', label: 'Gas natural (Scope 1)' },
  { value: 'electricity', label: 'Electricidad (Scope 2)' },
];

const UNITS: Record<string, string[]> = {
  diesel: ['litros', 'm³', 'kg'],
  gasoline: ['litros', 'm³', 'kg'],
  natural_gas: ['m³', 'kWh', 'kg'],
  electricity: ['kWh', 'MWh'],
};

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'diesel' as Activity['category'],
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    quantity: '',
    unit: 'litros',
    factorValue: '',
    factorSource: '',
    factorYear: 2026,
    method: '',
    notes: '',
    electricityMethod: 'location-based' as 'location-based' | 'market-based',
  });

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject) loadActivities(selectedProject); }, [selectedProject]);

  async function loadProjects() {
    const p = await mockApi.getProjects(user!.organizationId);
    setProjects(p);
    if (p.length > 0 && !selectedProject) setSelectedProject(p[0].id);
  }

  async function loadActivities(projectId: string) {
    const a = await mockApi.getActivities(projectId);
    setActivities(a);
  }

  const preview = calculateEmission(form.quantity, form.factorValue);
  const scope = form.category === 'electricity' ? 2 : 1;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;
    setLoading(true);
    try {
      await mockApi.createActivity(selectedProject, {
        name: form.name,
        category: form.category,
        scope: scope as 1 | 2,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        quantity: form.quantity,
        unit: form.unit,
        factorValue: form.factorValue,
        factorSource: form.factorSource,
        factorYear: form.factorYear,
        method: form.category === 'electricity' ? form.electricityMethod : form.method,
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ ...form, name: '', quantity: '', factorValue: '', factorSource: '', method: '', notes: '' });
      await loadActivities(selectedProject);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Actividades de emisión</h1>
          <p className="text-sm text-slate-500 mt-1">Registro de datos de actividad con factores de emisión</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={!selectedProject}>
          <i className="fa-solid fa-plus"></i> Nueva actividad
        </Button>
      </div>

      {/* Project selector */}
      <Card>
        <div className="p-4">
          <Select
            label="Proyecto"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
          />
        </div>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader title="Registrar actividad" subtitle="El factor de emisión es aportado por el usuario; no validado por el sistema" />
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de la actividad"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Consumo flota vehículos"
                required
              />
              <Select
                label="Categoría"
                value={form.category}
                onChange={e => {
                  const cat = e.target.value as Activity['category'];
                  setForm({ ...form, category: cat, unit: UNITS[cat][0] });
                }}
                options={CATEGORIES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Inicio del periodo"
                type="date"
                value={form.periodStart}
                onChange={e => setForm({ ...form, periodStart: e.target.value })}
                required
              />
              <Input
                label="Fin del periodo"
                type="date"
                value={form.periodEnd}
                onChange={e => setForm({ ...form, periodEnd: e.target.value })}
                required
              />
              <Input
                label="Año del factor"
                type="number"
                value={form.factorYear}
                onChange={e => setForm({ ...form, factorYear: parseInt(e.target.value) })}
                min={1990}
                max={2100}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cantidad"
                type="text"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                placeholder="1000"
                required
              />
              <Select
                label="Unidad"
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                options={UNITS[form.category].map(u => ({ value: u, label: u }))}
              />
              <Input
                label="Factor de emisión (kgCO2e/unidad)"
                type="text"
                value={form.factorValue}
                onChange={e => setForm({ ...form, factorValue: e.target.value })}
                placeholder="2.5"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fuente/referencia del factor"
                value={form.factorSource}
                onChange={e => setForm({ ...form, factorSource: e.target.value })}
                placeholder="Ej: DEFRA 2025, tabla combustibles estacionarios"
                required
              />
              {form.category === 'electricity' ? (
                <Select
                  label="Método de contabilización eléctrica"
                  value={form.electricityMethod}
                  onChange={e => setForm({ ...form, electricityMethod: e.target.value as 'location-based' | 'market-based' })}
                  options={[
                    { value: 'location-based', label: 'Location-based (red media)' },
                    { value: 'market-based', label: 'Market-based (contratos específicos)' },
                  ]}
                />
              ) : (
                <Input
                  label="Metodología"
                  value={form.method}
                  onChange={e => setForm({ ...form, method: e.target.value })}
                  placeholder="Ej: medición directa, facturas"
                />
              )}
            </div>

            <Textarea
              label="Observaciones"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales sobre la actividad..."
              rows={2}
            />

            {/* Calculation preview */}
            {preview && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <p className="text-xs font-medium text-emerald-800 mb-2">Cálculo preliminar (demo):</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-900 font-mono">{form.quantity} {form.unit} × {form.factorValue} kgCO2e/{form.unit}</span>
                  <span className="text-emerald-700">=</span>
                  <span className="font-bold text-emerald-900">{preview.kgCO2e} kgCO2e</span>
                  <span className="text-emerald-600">({preview.tCO2e} tCO2e)</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-2">
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                  Scope {scope} · Factor suministrado por el usuario, no validado por este sistema.
                  {form.category === 'electricity' && ` Contabilización: ${form.electricityMethod}.`}
                </p>
              </div>
            )}

            {form.quantity && form.factorValue && !preview && (
              <Alert type="danger">
                Valores no válidos para el cálculo. Verifique que la cantidad y el factor sean números positivos finitos.
              </Alert>
            )}

            <Alert type="warning">
              <strong>Limitaciones:</strong> Este cálculo es preliminar. No constituye una verificación metodológica. 
              Scope 3 y créditos de carbono quedan fuera de esta fase. La suficiencia del inventario 
              depende de la exhaustividad del perímetro declarado.
            </Alert>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !preview}>{loading ? 'Guardando...' : 'Registrar actividad'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Activities list */}
      <Card>
        <CardHeader title="Actividades registradas" subtitle={`${activities.length} actividad(es) · Scope 1 y 2 soportados`} />
        <div className="p-5">
          {activities.length === 0 ? (
            <EmptyState icon="fa-industry" title="Sin actividades" description="Registra una actividad de combustible o electricidad con su factor de emisión." />
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{act.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={act.scope === 1 ? 'info' : 'warning'}>Scope {act.scope}</Badge>
                        <span className="text-[11px] text-slate-500">{act.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{act.resultTCO2e ?? '—'} tCO2e</p>
                      <p className="text-[11px] text-slate-500">{act.resultKgCO2e ?? '—'} kgCO2e</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-500">
                    <span><strong>Cantidad:</strong> {act.quantity} {act.unit}</span>
                    <span><strong>Factor:</strong> {act.factorValue} kgCO2e/{act.unit}</span>
                    <span><strong>Periodo:</strong> {act.periodStart} → {act.periodEnd}</span>
                    <span><strong>Fuente:</strong> {act.factorSource}</span>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 rounded text-[10px] text-amber-700">
                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                    Factor suministrado por el usuario; no validado. {act.method && `Método: ${act.method}.`}
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
