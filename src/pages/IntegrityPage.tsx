// CO2 Evidence Ledger - Integrity Verification Page
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Button, Alert, Badge, Select } from '../components/Layout';
import type { Claim, IntegrityResult } from '../types';

export default function IntegrityPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState('');
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { loadClaims(); }, []);

  async function loadClaims() {
    const c = await mockApi.getClaims(user!.organizationId);
    setClaims(c);
    if (c.length > 0) setSelectedClaim(c[0].id);
  }

  async function handleVerify() {
    if (!selectedClaim) return;
    setVerifying(true);
    setResult(null);
    try {
      const r = await mockApi.verifyChain(selectedClaim);
      setResult(r);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Panel de integridad</h1>
        <p className="text-sm text-slate-500 mt-1">Verificación de cadenas de eventos append-only</p>
      </div>

      <Card>
        <CardHeader title="Verificar cadena de eventos" subtitle="Recalcula cada eslabón y detecta alteraciones" />
        <div className="p-5 space-y-4">
          <Select
            label="Declaración"
            value={selectedClaim}
            onChange={e => setSelectedClaim(e.target.value)}
            options={claims.map(c => ({ value: c.id, label: `${c.title} (${c.status})` }))}
          />
          <Button onClick={handleVerify} disabled={!selectedClaim || verifying}>
            <i className={`fa-solid ${verifying ? 'fa-spinner fa-spin' : 'fa-shield-halved'}`}></i>
            {verifying ? 'Verificando...' : 'Verificar integridad'}
          </Button>

          {result && (
            <div className="mt-4">
              <Alert type={result.valid ? 'success' : 'danger'}>
                <p className="font-medium">{result.message}</p>
                <div className="mt-2 space-y-1 text-[11px]">
                  <p><strong>Eventos totales:</strong> {result.totalEvents}</p>
                  {result.brokenAt && <p><strong>Primera ruptura en secuencia:</strong> {result.brokenAt}</p>}
                </div>
              </Alert>
            </div>
          )}
        </div>
      </Card>

      {/* Model explanation */}
      <Card>
        <CardHeader title="Modelo de integridad" subtitle="Qué puede y qué NO puede demostrar este sistema" />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">
                <i className="fa-solid fa-check mr-1"></i> Lo que SÍ demuestra
              </h3>
              <ul className="text-xs text-emerald-700 space-y-1.5">
                <li>• Coincidencia de bytes frente a una huella SHA-256 conocida</li>
                <li>• Orden relativo de eventos internos al sistema</li>
                <li>• Ausencia de modificaciones posteriores a la escritura (si la base no se altera)</li>
                <li>• Trazabilidad interna de cambios de estado</li>
                <li>• Detección de archivos idénticos por contenido</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                <i className="fa-solid fa-xmark mr-1"></i> Lo que NO demuestra
              </h3>
              <ul className="text-xs text-red-700 space-y-1.5">
                <li>• Fecha real de creación ante terceros (no hay timestamp confiable)</li>
                <li>• Autoría o procedencia del documento</li>
                <li>• Veracidad del contenido del documento</li>
                <li>• Inmutabilidad absoluta (un admin podría reescribir la base)</li>
                <li>• Equivalencia con blockchain descentralizada</li>
                <li>• Certificación, verificación externa o conformidad regulatoria</li>
              </ul>
            </div>
          </div>

          <Alert type="warning">
            <strong>Modelo de amenazas:</strong> La cadena de hashes protege contra modificaciones 
            accidentales y facilita la detección de alteraciones si se conserva una copia independiente 
            de los hashes. Sin embargo, un actor con acceso completo a la base de datos podría 
            reconstruir toda la cadena. Para anclaje temporal confiable se necesitaría un servicio 
            externo de timestamping (RFC 3161) o publicación en medio inmutable.
          </Alert>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Formato de serialización canónica</h3>
            <p className="text-xs text-slate-600 mb-2">
              Cada evento se serializa en formato JSON canónico (claves ordenadas alfabéticamente, sin espacios) 
              y se codifica en UTF-8 antes de calcular el SHA-256. La fórmula es:
            </p>
            <code className="block text-[11px] font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">
              event_hash = SHA-256(canonical_json(&#123;"sequence": N, "claimId": "...", "actorId": "...", "type": "...", "payload": &#123;"..."&#125;, "previousHash": "...", "timestamp": "ISO8601"&#125;))
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}
