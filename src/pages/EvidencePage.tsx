// CO2 Evidence Ledger - Evidence Page
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context';
import { mockApi } from '../services';
import { Card, CardHeader, Button, Alert, Badge, EmptyState } from '../components/Layout';
import type { EvidenceDocument } from '../types';

export default function EvidencePage() {
  const { user } = useAuth();
  const [evidences, setEvidences] = useState<EvidenceDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; doc?: EvidenceDocument } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadEvidences(); }, []);

  async function loadEvidences() {
    const e = await mockApi.getEvidences(user!.organizationId);
    setEvidences(e);
  }

  async function handleFile(file: File) {
    setUploading(true);
    setUploadResult(null);
    try {
      const doc = await mockApi.uploadEvidence(file);
      if (doc.isDuplicate) {
        setUploadResult({
          success: true,
          message: `COINCIDENCIA EXACTA detectada (SHA-256 idéntico). No se considera fraude; puede ser reutilización legítima. Documento original: ${doc.duplicateOf}`,
          doc,
        });
      } else {
        setUploadResult({
          success: true,
          message: `Evidencia registrada. SHA-256 calculado sobre los bytes exactos recibidos.`,
          doc,
        });
      }
      await loadEvidences();
    } catch (err) {
      setUploadResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al subir el archivo',
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const totalSize = evidences.reduce((sum, e) => sum + e.sizeBytes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Biblioteca de evidencias</h1>
        <p className="text-sm text-slate-500 mt-1">Documentos de respaldo con huella criptográfica SHA-256</p>
      </div>

      {/* Upload area */}
      <Card>
        <CardHeader title="Subir evidencia" subtitle="PDF, PNG, JPEG, CSV o TXT · Máximo 3 MiB" />
        <div className="p-5">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-slate-400 text-xl`}></i>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {uploading ? 'Calculando SHA-256 y registrando...' : 'Arrastra un archivo aquí o haz clic para seleccionar'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              El hash se calcula sobre los bytes EXACTOS antes de cualquier procesamiento
            </p>
          </div>

          {uploadResult && (
            <div className="mt-4">
              <Alert type={uploadResult.success ? (uploadResult.doc?.isDuplicate ? 'warning' : 'success') : 'danger'}>
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.doc && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <p><strong>Archivo:</strong> {uploadResult.doc.fileName}</p>
                    <p><strong>Tamaño:</strong> {(uploadResult.doc.sizeBytes / 1024).toFixed(1)} KiB</p>
                    <p><strong>Tipo MIME:</strong> {uploadResult.doc.mimeType}</p>
                    <p className="font-mono break-all"><strong>SHA-256:</strong> {uploadResult.doc.sha256}</p>
                    <p><strong>ID:</strong> {uploadResult.doc.id}</p>
                  </div>
                )}
              </Alert>
            </div>
          )}

          <Alert type="info">
            <strong>Nota sobre integridad:</strong> El SHA-256 demuestra coincidencia de bytes frente a una huella conocida. 
            NO certifica el contenido, autor, origen ni fecha ante terceros. Una cadena de hashes propia 
            no equivale a una blockchain descentralizada ni impide que un administrador privilegiado 
            reescriba la base de datos.
          </Alert>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{evidences.length}</p>
            <p className="text-xs text-slate-500">Documentos registrados</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{evidences.filter(e => e.isDuplicate).length}</p>
            <p className="text-xs text-slate-500">Coincidencias exactas</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{(totalSize / 1024 / 1024).toFixed(2)} MiB</p>
            <p className="text-xs text-slate-500">Total almacenado</p>
          </div>
        </Card>
      </div>

      {/* Evidence list */}
      <Card>
        <CardHeader title="Evidencias registradas" subtitle="Con huella SHA-256 y metadatos de recepción" />
        <div className="p-5">
          {evidences.length === 0 ? (
            <EmptyState icon="fa-file-shield" title="Sin evidencias" description="Sube un documento para registrar su huella criptográfica." />
          ) : (
            <div className="space-y-3">
              {evidences.slice().reverse().map(ev => (
                <div key={ev.id} className={`p-4 border rounded-lg ${ev.isDuplicate ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ev.isDuplicate ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <i className={`fa-solid ${getIcon(ev.mimeType)} text-sm ${ev.isDuplicate ? 'text-amber-600' : 'text-slate-500'}`}></i>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-900">{ev.fileName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={ev.isDuplicate ? 'warning' : 'default'}>
                            {ev.isDuplicate ? 'Coincidencia exacta' : 'Original'}
                          </Badge>
                          <span className="text-[11px] text-slate-500">{ev.mimeType}</span>
                          <span className="text-[11px] text-slate-500">{(ev.sizeBytes / 1024).toFixed(1)} KiB</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(ev.uploadedAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="mt-2 p-2 bg-slate-50 rounded font-mono text-[10px] text-slate-600 break-all">
                    SHA-256: {ev.sha256}
                  </div>
                  {ev.isDuplicate && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      Este archivo coincide exactamente con otro previamente registrado. No constituye fraude por sí solo.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function getIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'fa-file-pdf';
  if (mimeType.startsWith('image/')) return 'fa-file-image';
  if (mimeType === 'text/csv') return 'fa-file-csv';
  return 'fa-file-lines';
}
