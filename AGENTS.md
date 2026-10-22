# AGENTS.md — CO2 Evidence Ledger

## Propósito

Este documento define las reglas de comportamiento para cualquier agente (humano o IA) que trabaje en este repositorio.

## Lectura obligatoria

Antes de cualquier intervención, leer:
1. `docs/PRODUCT_CONSTITUTION.md`
2. Este archivo (AGENTS.md)
3. `README.md`

## Reglas inquebrantables

### Identidad del producto
- El producto es un **registro de evidencias climáticas trazables**
- NO es marketplace, plataforma de inversión, ni sistema de créditos de carbono
- NO certifica, verifica externamente, ni garantiza conformidad regulatoria

### Honestidad técnica
- No declarar funcionalidad como «completada» si no está probada
- No usar mocks como validación de integración real
- Distinguir claramente: código escrito / pruebas superadas / API publicada / servicio productivo
- Si un entorno impide una acción, registrar el bloqueo exacto sin inventar resultados

### Seguridad
- No introducir credenciales en código, logs, exports ni frontend
- No fingir persistencia desde filesystem efímero
- No activar cobros reales ni condicionales sin autorización

### Integridad
- No borrar eventos; las correcciones van como eventos nuevos
- No permitir UPDATE/DELETE sobre cadena de auditoría desde cuentas normales
- Mostrar límites de la criptografía en la interfaz

## Matriz de estados

| Estado | Significado |
|---|---|
| IMPLEMENTADA-Y-PROBADA | Código funcional con tests que pasan |
| IMPLEMENTADA-NO-PROBADA | Código escrito sin tests de integración reales |
| BLOQUEADA-POR-ENTORNO | Dependencia externa no disponible |
| PLANIFICADA | Diseñada pero no implementada |

## Prohibiciones de refactor

- No romper funcionalidades ya aprobadas sin tests de regresión
- No introducir cambios que eliminen registros existentes
- No ocultar fallos ni eliminar controles
- No cambiar objeto social sin autorización del propietario

## Flujo de trabajo

1. Crear rama aislada para cada fase
2. No hacer force push ni reset --hard
3. No fusionar con main sin gates superados
4. Documentar cada cambio en CHANGELOG
5. Actualizar matriz de veracidad tras cada intervención
