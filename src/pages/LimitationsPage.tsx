// CO2 Evidence Ledger - Scope & Limitations Page
import React from 'react';
import { Card, CardHeader, Alert } from '../components/Layout';

export default function LimitationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Alcance y limitaciones</h1>
        <p className="text-sm text-slate-500 mt-1">Definición honesta de lo que este sistema hace y no hace</p>
      </div>

      <Alert type="warning">
        <strong>Este producto NO es un certificado de huella de carbono.</strong> 
        Es una herramienta de registro y trazabilidad interna de evidencias. 
        Las declaraciones generadas no sustituyen una verificación por tercero independiente 
        ni una auditoría conforme a ISO 14064-3, GHG Protocol u otra norma aplicable.
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What it IS */}
        <Card>
          <CardHeader title="Lo que este sistema ES" />
          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Registro de datos de actividad:</strong> almacena cantidades, unidades, factores de emisión 
                y referencias aportadas por el usuario.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Cálculo aritmético:</strong> multiplica cantidad × factor para obtener kgCO2e y tCO2e. 
                La precisión depende de los valores introducidos.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Huella criptográfica de archivos:</strong> calcula SHA-256 sobre los bytes exactos recibidos. 
                Permite detectar coincidencias de contenido idéntico.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Cronología interna:</strong> registra acontecimientos append-only con encadenamiento de hashes 
                para detectar modificaciones posteriores dentro del propio sistema.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Exportación de expediente:</strong> genera un paquete con datos, hashes y eventos 
                para revisión offline.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>Control de acceso:</strong> aislamiento por organización y roles para impedir 
                consultas cruzadas entre tenants.
              </p>
            </div>
          </div>
        </Card>

        {/* What it is NOT */}
        <Card>
          <CardHeader title="Lo que este sistema NO ES" />
          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No es una certificación de huella de carbono.</strong> No emite certificados 
                ni acredita conformidad con norma alguna.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No es una verificación por tercero.</strong> El estado «REVIEWED_INTERNAL» 
                indica revisión interna, no auditoría independiente.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No valida factores de emisión.</strong> Los factores son aportados por el usuario; 
                el sistema no verifica su origen, vigencia ni exactitud.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No garantiza inmutabilidad absoluta.</strong> Un administrador con acceso a la base 
                de datos podría alterar registros y reconstruir la cadena.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No es una blockchain descentralizada.</strong> La cadena de hashes es interna 
                y centralizada en la base de datos del sistema.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No realiza comercio de créditos de carbono.</strong> No compra, vende, emite, 
                transfiere ni cancela créditos. No es un marketplace ni plataforma de inversión.
              </p>
            </div>
            <div className="flex gap-2">
              <i className="fa-solid fa-xmark text-red-500 mt-0.5"></i>
              <p className="text-xs text-slate-700">
                <strong>No certifica la veracidad del contenido.</strong> Un SHA-256 demuestra coincidencia 
                de bytes, no autoría, origen, fecha real ni contenido veraz.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Technical distinctions */}
      <Card>
        <CardHeader title="Distinciones técnicas rigurosas" />
        <div className="p-5">
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">(a) Integridad criptográfica de bytes</h3>
              <p className="text-xs text-slate-600">
                Un SHA-256 demuestra que unos bytes dados coinciden con una huella conocida. 
                No implica nada sobre el contenido semántico, autoría o fecha de creación.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">(b) Trazabilidad de cambios internos</h3>
              <p className="text-xs text-slate-600">
                La cadena de eventos permite reconstruir el historial de acciones dentro del sistema. 
                Facilita la detección de modificaciones posteriores si se conserva una copia independiente 
                de los hashes, pero no impide la reescritura por un administrador con acceso total.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">(c) Suficiencia y veracidad de una prueba</h3>
              <p className="text-xs text-slate-600">
                Que un documento esté registrado con su hash no garantiza que sea suficiente, 
                pertinente ni veraz. La evaluación de la prueba corresponde al revisor humano 
                o verificador externo, no al sistema.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">(d) Evaluación metodológica de un inventario</h3>
              <p className="text-xs text-slate-600">
                El sistema calcula emisiones a partir de los datos introducidos, pero no evalúa 
                la exhaustividad del perímetro, la adecuación metodológica ni la conformidad 
                con estándares de inventario (GHG Protocol, ISO 14064-1).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">(e) Verificación por tercero</h3>
              <p className="text-xs text-slate-600">
                La verificación independiente requiere un evaluador externo cualificado que examine 
                el inventario completo, los métodos, las evidencias y los controles. 
                Este sistema no realiza esa función.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Phase 00 scope */}
      <Card>
        <CardHeader title="Alcance de la Fase 00" />
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Incluido</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Scope 1 (combustión estacionaria y móvil)</li>
                <li>• Scope 2 (electricidad, location-based y market-based)</li>
                <li>• Registro de actividades con factores aportados</li>
                <li>• Evidencias binarias con SHA-256</li>
                <li>• Declaraciones con cronología auditable</li>
                <li>• Detección de archivos duplicados</li>
                <li>• Exportación de manifiestos</li>
                <li>• Verificación offline de cadenas</li>
                <li>• Control de acceso por organización</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">No incluido (fases futuras)</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Scope 3 (cadena de valor)</li>
                <li>• Créditos de carbono (ninguna operación)</li>
                <li>• Anclaje temporal externo (RFC 3161)</li>
                <li>• Firma digital cualificada</li>
                <li>• Almacenamiento S3-compatible</li>
                <li>• Integración con registros de verificación</li>
                <li>• Mecanismo de supresión RGPD completo</li>
                <li>• API pública para terceros verificadores</li>
                <li>• Importación automática de factores oficiales</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Alert type="info">
        <strong>Matriz de veracidad:</strong> Cada capacidad del sistema se clasifica en: 
        IMPLEMENTADA-Y-PROBADA, IMPLEMENTADA-NO-PROBADA, BLOQUEADA-POR-ENTORNO o PLANIFICADA. 
        En esta demo frontend, todas las operaciones están IMPLEMENTADAS-NO-PROBADAS 
        (el backend Go y PostgreSQL no están disponibles en este entorno).
      </Alert>
    </div>
  );
}
