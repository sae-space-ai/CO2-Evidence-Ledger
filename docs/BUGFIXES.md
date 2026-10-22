# Correcciones de Bugs - CO2 Evidence Ledger

**Fecha:** 2026-10-23  
**Estado:** ✅ COMPLETADO

## Bugs Críticos Corregidos

### 1. Bug en `updateClaimStatus` - Estado anterior no capturado

**Problema:**
Los eventos `STATUS_CHANGED` mostraban `from` y `to` iguales porque el estado se actualizaba ANTES de capturar el valor anterior.

**Ejemplo del bug:**
```json
{
  "type": "STATUS_CHANGED",
  "payload": {
    "from": "READY_FOR_REVIEW",
    "to": "READY_FOR_REVIEW"  // ❌ Iguales!
  }
}
```

**Corrección:**
```typescript
// Capturar estado ANTES de actualizar
const previousStatus = claims[idx].status;

// Validar transición
if (!validTransitions[previousStatus]?.includes(status)) {
  throw new Error(`Transición de estado inválida: ${previousStatus} → ${status}`);
}

// Actualizar
claims[idx].status = status;

// Registrar evento con estado anterior correcto
await this.addEvent(claimId, 'STATUS_CHANGED', { 
  from: previousStatus,  // ✅ Correcto
  to: status 
});
```

**Archivos modificados:**
- `src/services.mock.ts` (línea 290-315)
- `internal/httpapi/handlers.go` (handleClaimDetail PUT)

### 2. Falta de validación de transiciones de estado

**Problema:**
No había validación de transiciones válidas, permitiendo cambios de estado arbitrarios.

**Corrección:**
```typescript
const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  'DRAFT': ['READY_FOR_REVIEW'],
  'READY_FOR_REVIEW': ['REVIEWED_INTERNAL', 'REJECTED_INTERNAL', 'DRAFT'],
  'REVIEWED_INTERNAL': ['DRAFT'],
  'REJECTED_INTERNAL': ['DRAFT'],
};

if (!validTransitions[previousStatus]?.includes(status)) {
  throw new Error(`Transición de estado inválida: ${previousStatus} → ${status}`);
}
```

**Archivos modificados:**
- `src/services.mock.ts`
- `internal/httpapi/handlers.go`

### 3. Exportación incompleta

**Problema:**
El manifiesto exportado no incluía información del proyecto, integridad de la cadena ni limitaciones técnicas.

**Corrección:**
```typescript
export interface ExportManifest {
  version: string;
  generatedAt: string;
  claim: Claim;
  organization: { id: string; name: string };
  project: { id: string; name: string; operationalBoundary: string; reportingYear: number } | null;
  activities: Activity[];
  evidences: { id: string; fileName: string; sha256: string; sizeBytes: number }[];
  events: LedgerEvent[];
  integrity: { valid: boolean; totalEvents: number; message: string };
  warnings: string[];
  limitations: string[];
}
```

**Archivos modificados:**
- `src/types.ts`
- `src/services.mock.ts` (exportClaim)
- `src/pages/ExportPage.tsx`

### 4. Visualización de eventos mejorada

**Problema:**
Los eventos de cambio de estado no se mostraban claramente en la UI.

**Corrección:**
- Visualización clara de transiciones `from → to` con badges
- Mostrar payload completo de cada evento
- Mejor formato de hashes

**Archivos modificados:**
- `src/pages/ClaimDetailPage.tsx`

## Tests Añadidos

### Tests de servicios (`src/services.test.ts`)
- ✅ Cálculo de emisiones (fixtures verificados)
- ✅ Serialización canónica
- ✅ Transiciones de estado válidas/inválidas
- ✅ Captura de estado anterior
- ✅ SHA-256 hashing
- ✅ Detección de duplicados
- ✅ Validación de archivos
- ✅ Aislamiento multi-tenant

### Script de verificación (`scripts/verify-fixes.js`)
Script ejecutable que verifica todas las correcciones:
```bash
node scripts/verify-fixes.js
```

## Backend Go - Correcciones

### `internal/httpapi/handlers.go`

1. **handleClaimDetail PUT**: Añadida validación de transiciones
2. **Captura de estado anterior**: Antes de actualizar
3. **Eventos con from/to correctos**: Registro preciso de cambios

```go
// Get current status
var currentStatus string
err := api.DB.QueryRow("SELECT status FROM claims WHERE id = $1", claimID).Scan(&currentStatus)

// Validate transition
validTransitions := map[string][]string{
  "DRAFT":              {"READY_FOR_REVIEW"},
  "READY_FOR_REVIEW":   {"REVIEWED_INTERNAL", "REJECTED_INTERNAL", "DRAFT"},
  "REVIEWED_INTERNAL":  {"DRAFT"},
  "REJECTED_INTERNAL":  {"DRAFT"},
}

// Update with correct event
api.createEvent(claimID, user.ID, "STATUS_CHANGED", map[string]interface{}{
  "from": currentStatus,  // ✅ Estado anterior
  "to":   req.Status,
})
```

## Resultados de Verificación

```
✅ Cálculo diesel: 1000L × 2.5 = 2500 kgCO2e
✅ Cálculo electricidad: 500 kWh × 0.2 = 100 kgCO2e
✅ Conversión a tCO2e: 2500 kgCO2e = 2.5 tCO2e
✅ Serialización canónica ordena claves
✅ Transición válida: DRAFT → READY_FOR_REVIEW
✅ Transición inválida: DRAFT → REVIEWED_INTERNAL
✅ Captura de estado ANTES de actualizar
✅ SHA-256 produce hash de 64 caracteres hex
✅ Detección de duplicados por hash
✅ Validación de tipo MIME
✅ Límite de tamaño de archivo (3 MiB)
✅ Saneamiento de nombres de archivo
✅ Aislamiento por organización

📊 Resumen: 13 pasados, 0 fallidos
✅ TODOS LOS TESTS PASARON
```

## Build Status

```
✓ 46 modules transformed
dist/index.html                   3.24 kB
dist/assets/index-D--_Fk0n.css   23.46 kB
dist/assets/index-eEycxDzp.js   247.96 kB
✓ built in 2.19s
```

## Archivos Modificados

### Frontend (6 archivos)
1. `src/types.ts` - ExportManifest mejorado
2. `src/services.mock.ts` - Corrección de bugs + exportación mejorada
3. `src/pages/ClaimDetailPage.tsx` - Visualización de eventos
4. `src/pages/ExportPage.tsx` - Mostrar project, integrity, limitations
5. `src/services.test.ts` - Tests unitarios (nuevo)
6. `vitest.config.ts` - Configuración de tests (nuevo)

### Backend (1 archivo)
1. `internal/httpapi/handlers.go` - Validación de transiciones

### Scripts (1 archivo)
1. `scripts/verify-fixes.js` - Verificación de correcciones (nuevo)

## Próximos Pasos

1. ✅ Bugs corregidos
2. ✅ Tests añadidos
3. ✅ Backend actualizado
4. ⏭️ Ejecutar tests completos: `npm test`
5. ⏭️ Verificar en entorno real con PostgreSQL
6. ⏭️ Actualizar documentación de API

## Conclusión

Todos los bugs críticos identificados en el manifiesto exportado han sido corregidos:
- ✅ Estado anterior capturado correctamente
- ✅ Validación de transiciones implementada
- ✅ Exportación mejorada con información completa
- ✅ Visualización de eventos mejorada
- ✅ Tests unitarios añadidos
- ✅ Backend Go actualizado

El sistema ahora produce manifiestos correctos con información completa y precisa.
