// CO2 Evidence Ledger - Dashboard Page
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Badge, Alert } from '../components/Layout';
import type { Organization, Project, Activity, Claim, EvidenceDocument } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidences, setEvidences] = useState<EvidenceDocument[]>([]);
  const [health, setHealth] = useState<{ status: string; mode: string } | null>(null);
  const [ready, setReady] = useState<{ ready: boolean; database: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [h, r, o, p, a, c, e] = await Promise.all([
      mockApi.health(),
      mockApi.ready(),
      mockApi.getOrganizations(),
      mockApi.getProjects(user!.organizationId),
      Promise.resolve([] as Activity[]),
      mockApi.getClaims(user!.organizationId),
      mockApi.getEvidences(user!.organizationId),
    ]);
    setHealth(h);
    setReady(r);
    setOrgs(o);
    setProjects(p);
    setClaims(c);
    setEvidences(e);
    
    // Load activities for all projects
    const allActivities: Activity[] = [];
    for (const proj of p) {
      const acts = await mockApi.getActivities(proj.id);
      allActivities.push(...acts);
    }
    setActivities(allActivities);
  }

  const totalEmission = activities.reduce((sum, a) => sum + (parseFloat(a.resultKgCO2e || '0')), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Panel de control</h1>
        <p className="text-sm text-slate-500 mt-1">Estado del sistema y resumen de actividad</p>
      </div>

      {/* System status */}
      <Alert type="warning">
        <strong>Modo demostración:</strong> Los datos se almacenan en localStorage del navegador. 
        No hay backend Go ni PostgreSQL conectados. El hashing SHA-256 de evidencias sí se calcula en tiempo real.
        Al recargar la página o cambiar de navegador, los datos pueden perderse o no sincronizarse.
      </Alert>

      {/* System health cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <i className="fa-solid fa-server text-emerald-600 text-sm"></i>
              </div>
              <span className="text-xs text-slate-500">API</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{health?.status === 'ok' ? 'Activa' : 'N/A'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{health?.mode === 'DEMO_FRONTEND_ONLY' ? 'Simulada (frontend)' : 'Real'}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <i className="fa-solid fa-database text-blue-600 text-sm"></i>
              </div>
              <span className="text-xs text-slate-500">Base de datos</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{ready?.ready ? 'Conectada' : 'No disponible'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{ready?.database}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-amber-600 text-sm"></i>
              </div>
              <span className="text-xs text-slate-500">Sesión</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{user?.role === 'owner' ? 'Owner' : user?.role}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{user?.email}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <i className="fa-solid fa-calculator text-purple-600 text-sm"></i>
              </div>
              <span className="text-xs text-slate-500">Emisiones (demo)</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{(totalEmission / 1000).toFixed(2)} tCO2e</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Factor aportado por usuario</p>
          </div>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organizations */}
        <Card>
          <CardHeader title="Organizaciones" subtitle="Aislamiento multi-tenant" />
          <div className="p-5">
            {orgs.length === 0 ? (
              <p className="text-xs text-slate-500">Sin organizaciones registradas</p>
            ) : (
              <div className="space-y-2">
                {orgs.map(org => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{org.name}</p>
                      <p className="text-[11px] text-slate-500">ID: {org.id}</p>
                    </div>
                    <Badge variant="success">Activa</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent claims */}
        <Card>
          <CardHeader 
            title="Declaraciones recientes" 
            subtitle="Estado de expedientes"
            actions={<Link to="/claims" className="text-xs text-slate-600 hover:text-slate-900">Ver todas →</Link>}
          />
          <div className="p-5">
            {claims.length === 0 ? (
              <p className="text-xs text-slate-500">Sin declaraciones creadas</p>
            ) : (
              <div className="space-y-2">
                {claims.slice(0, 5).map(claim => (
                  <Link key={claim.id} to={`/claims/${claim.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{claim.title}</p>
                      <p className="text-[11px] text-slate-500">{claim.evidenceIds.length} evidencias · {claim.activityIds.length} actividades</p>
                    </div>
                    <StatusBadgeInline status={claim.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Evidence stats */}
        <Card>
          <CardHeader title="Biblioteca de evidencias" subtitle="Documentos con huella SHA-256" />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-md">
                <p className="text-2xl font-bold text-slate-900">{evidences.length}</p>
                <p className="text-[11px] text-slate-500">Documentos</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-md">
                <p className="text-2xl font-bold text-slate-900">{evidences.filter(e => e.isDuplicate).length}</p>
                <p className="text-[11px] text-slate-500">Duplicados detectados</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              <i className="fa-solid fa-info-circle mr-1"></i>
              La coincidencia de SHA-256 no indica fraude; puede ser reutilización legítima.
            </p>
          </div>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader title="Acciones rápidas" />
          <div className="p-5 space-y-2">
            <Link to="/activities" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
              <i className="fa-solid fa-plus text-emerald-600"></i>
              <div>
                <p className="text-sm font-medium text-slate-900">Registrar actividad</p>
                <p className="text-[11px] text-slate-500">Combustible o electricidad con factor de emisión</p>
              </div>
            </Link>
            <Link to="/evidence" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
              <i className="fa-solid fa-upload text-blue-600"></i>
              <div>
                <p className="text-sm font-medium text-slate-900">Subir evidencia</p>
                <p className="text-[11px] text-slate-500">PDF, imagen, CSV con huella criptográfica</p>
              </div>
            </Link>
            <Link to="/claims" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
              <i className="fa-solid fa-clipboard-list text-purple-600"></i>
              <div>
                <p className="text-sm font-medium text-slate-900">Nueva declaración</p>
                <p className="text-[11px] text-slate-500">Vincular actividades y evidencias</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
    READY_FOR_REVIEW: { label: 'En revisión', cls: 'bg-amber-50 text-amber-700' },
    REVIEWED_INTERNAL: { label: 'Revisado', cls: 'bg-blue-50 text-blue-700' },
    REJECTED_INTERNAL: { label: 'Rechazado', cls: 'bg-red-50 text-red-700' },
  };
  const item = map[status] || { label: status, cls: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
}
