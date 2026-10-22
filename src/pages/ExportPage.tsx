// CO2 Evidence Ledger - Export Page
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { mockApi, canonicalize } from '../services';
import { Card, CardHeader, Button, Alert, Select } from '../components/Layout';
import type { Claim, ExportManifest } from '../types';

export default function ExportPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState('');
  const [manifest, setManifest] = useState<ExportManifest | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadClaims(); }, []);

  async function loadClaims() {
    const c = await mockApi.getClaims(user!.organizationId);
    setClaims(c);
    if (c.length > 0) setSelectedClaim(c[0].id);
  }

  async function handleExport() {
    if (!selectedClaim) return;
    setExporting(true);
    try {
      const m = await mockApi.exportClaim(selectedClaim);
      setManifest(m);
    } finally {
      setExporting(false);
    }
  }

  function downloadManifest() {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${manifest.claim.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exportación de expedientes</h1>
        <p className="text-sm text-slate-500 mt-1">Genera un paquete con manifest JSON, eventos y metadatos</p>
      </div>

      <Card>
        <CardHeader title="Exportar declaración" subtitle="Genera manifest.json con todos los datos del expediente" />
        <div className="p-5 space-y-4">
          <Select
            label="Declaración"
            value={selectedClaim}
            onChange={e => setSelectedClaim(e.target.value)}
            options={claims.map(c => ({ value: c.id, label: `${c.title} (${c.status})` }))}
          />
          <Button onClick={handleExport} disabled={!selectedClaim || exporting}>
            <i className={`fa-solid ${exporting ? 'fa-spinner fa-spin' : 'fa-file-export'}`}></i>
            {exporting ? 'Generando...' : 'Generar manifiesto'}
          </Button>

          <Alert type="info">
            En producción, la exportación genera un archivo .zip con manifest JSON, documentos binarios 
            autorizados y un verificador Go independiente (cmd/verify-package). En esta demo se genera 
            solo el manifest JSON descargable.
          </Alert>
        </div>
      </Card>

      {manifest && (
        <>
          <Card>
            <CardHeader 
              title="Manifiesto generado" 
              subtitle={`v${manifest.version} · ${manifest.generatedAt}`}
              actions={<Button size="sm" onClick={downloadManifest}><i className="fa-solid fa-download"></i> Descargar JSON</Button>}
            />
            <div className="p-5 space-y-4">
              {/* Claim info */}
              <div className="p-3 bg-slate-50 rounded-md">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Declaración</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span><strong>Título:</strong> {manifest.claim.title}</span>
                  <span><strong>Estado:</strong> {manifest.claim.status}</span>
                  <span><strong>Total:</strong> {manifest.claim.totalTCO2e} tCO2e</span>
                  <span><strong>Organización:</strong> {manifest.organization.name}</span>
                </div>
              </div>

              {/* Activities */}
              <div className="p-3 bg-slate-50 rounded-md">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Actividades ({manifest.activities.length})</h3>
                {manifest.activities.map(act => (
                  <div key={act.id} className="text-xs text-slate-600 py-1 border-b border-slate-200 last:border-0">
                    {act.name}: {act.quantity} {act.unit} × {act.factorValue} = {act.resultKgCO2e} kgCO2e
                  </div>
                ))}
              </div>

              {/* Evidences */}
              <div className="p-3 bg-slate-50 rounded-md">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Evidencias ({manifest.evidences.length})</h3>
                {manifest.evidences.map(ev => (
                  <div key={ev.id} className="text-xs text-slate-600 py-1 border-b border-slate-200 last:border-0">
                    <span className="font-medium">{ev.fileName}</span> — {(ev.sizeBytes / 1024).toFixed(1)} KiB
                    <div className="font-mono text-[10px] text-slate-400 break-all">SHA-256: {ev.sha256}</div>
                  </div>
                ))}
              </div>

              {/* Events */}
              <div className="p-3 bg-slate-50 rounded-md">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Eventos ({manifest.events.length})</h3>
                {manifest.events.map(evt => (
                  <div key={evt.eventId} className="text-xs text-slate-600 py-1 border-b border-slate-200 last:border-0">
                    <span className="font-medium">#{evt.sequence}</span> {evt.type} — {evt.actorName} — {new Date(evt.timestamp).toLocaleString('es-ES')}
                  </div>
                ))}
              </div>

              {/* Warnings */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i> Advertencias del paquete
                </h3>
                <ul className="text-xs text-amber-700 space-y-1">
                  {manifest.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Verifier info */}
          <Card>
            <CardHeader title="Verificador independiente" subtitle="cmd/verify-package (Go CLI offline)" />
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                En producción, el verificador Go trabaja OFFLINE: abre el zip de forma segura 
                (contra zip slip/zip bomb), recalcula SHA-256 de cada archivo, comprueba la cadena 
                íntegra de eventos, identifica documentos ausentes o alterados, y emite resultado 
                con código de salida distinto de cero si algo falla.
              </p>
              <Alert type="warning">
                <strong>Lo que el verificador puede probar:</strong> que los archivos contenidos 
                coinciden con los hashes declarados y que la cadena de eventos no presenta rupturas internas.<br /><br />
                <strong>Lo que NO puede probar:</strong> que la cadena no fue reconstruida fraudulentamente 
                desde cero, que los hashes fueron anclados temporalmente por un tercero confiable, 
                ni que el contenido de los documentos sea veraz.
              </Alert>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
