# PRODUCT_CONSTITUTION.md — CO2 Evidence Ledger

## Identidad del producto

**Nombre oficial:** CO2 Evidence Ledger  
**Subtítulo:** Evidencia trazable para declaraciones climáticas responsables  
**Fecha de referencia:** 23-10-2026

## Finalidad

Software B2B para:
- Registrar datos de actividad y factores de emisión
- Vincular documentos de respaldo con huella criptográfica
- Calcular emisiones preliminares (Scope 1 y 2)
- Mantener secuencia auditable de acontecimientos
- Producir expedientes de evidencias verificables

## Destinatarios

- PYMEs con obligaciones de reporte ambiental
- Consultores de sostenibilidad
- Equipos de compliance
- Revisores autorizados (acceso controlado)

## Idioma

Por defecto: español. Arquitectura preparada para inglés.

## Prohibiciones permanentes

1. NO transformar en marketplace cripto, plataforma de inversión, ni plataforma de emisión/retirada de créditos
2. NO realizar comercio, emisión, tokenización, transferencia ni cancelación de créditos de carbono
3. NO afirmar certificaciones, verificaciones externas, conformidad regulatoria, reducción real de emisiones, detección de fraude o inmutabilidad absoluta
4. NO usar Node.js como backend productivo
5. NO guardar evidencias en localStorage, memoria efímera o /tmp en producción
6. NO introducir SaaS como motor de negocio oculto

## Distinciones de verdad

| Concepto | Qué demuestra | Qué NO demuestra |
|----------|---------------|------------------|
| SHA-256 | Coincidencia de bytes | Contenido, autor, fecha, veracidad |
| Cadena de hashes | Orden relativo interno | Inmutabilidad absoluta, anclaje temporal |
| REVIEWED_INTERNAL | Revisión interna | Verificación por tercero |
| Cálculo preliminar | Aritmética de inputs | Validez metodológica del inventario |
| Registro de actividad | Datos introducidos | Exhaustividad del perímetro |

## Reglas de funcionamiento

1. El backend Go es la autoridad de cálculo; el frontend nunca decide importes definitivos
2. Toda mutación se registra como evento append-only
3. Las correcciones se hacen mediante eventos sucesivos, nunca borrando el pasado
4. El aislamiento multi-tenant se verifica en cada operación
5. Los factores de emisión son aportados por el usuario y marcados como «no validados»
6. La ausencia de factor impide calcular; nunca se rellena silenciosamente

## Criterios de aceptación

- Cada verbo de la interfaz corresponde a una operación real, autorizada y persistente
- La honestidad del estado del sistema es requisito de producto
- Los tests no aceptan mocks como validación de integración real
- La documentación distingue IMPLEMENTADA-Y-PROBADA vs IMPLEMENTADA-NO-PROBADA vs BLOQUEADA vs PLANIFICADA

## Modificación

Solo el propietario puede autorizar cambios de objeto social o funcionalidad esencial.
Toda fase, agente o refactor posterior debe leer este documento primero.
