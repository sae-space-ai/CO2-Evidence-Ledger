# CO2 Evidence Ledger

**Evidencia trazable para declaraciones climáticas responsables**

## Estado actual

**Fase 00 — Frontend funcional (demo)**

Este repositorio contiene la interfaz web completa del CO2 Evidence Ledger, implementada en React + TypeScript + Vite + Tailwind CSS.

### ⚠️ Limitación del entorno actual

Esta build es **frontend-only**. En el entorno de desarrollo actual no están disponibles:
- Backend Go (cmd/server, api/index.go)
- PostgreSQL
- Migraciones SQL
- Verificador offline (cmd/verify-package)

Todas las operaciones se simulan mediante localStorage del navegador. El hashing SHA-256 de archivos SÍ se calcula en tiempo real usando Web Crypto API.

## Qué funciona en esta demo

| Funcionalidad | Estado |
|---|---|
| Autenticación (simulada) | ✅ Implementada (demo) |
| Dashboard con estado del sistema | ✅ Implementada |
| Gestión de proyectos | ✅ Implementada |
| Registro de actividades (Scope 1 y 2) | ✅ Implementada |
| Cálculo de emisiones | ✅ Implementada |
| Subida de evidencias con SHA-256 real | ✅ Implementada |
| Detección de archivos duplicados | ✅ Implementada |
| Creación de declaraciones | ✅ Implementada |
| Vinculación de actividades y evidencias | ✅ Implementada |
| Cronología append-only con hashes | ✅ Implementada |
| Verificación de cadena de eventos | ✅ Implementada |
| Exportación de manifiestos | ✅ Implementada |
| Página de alcance y limitaciones | ✅ Implementada |
| Aislamiento por organización | ✅ Simulado |

## Qué falta para producción

| Componente | Estado |
|---|---|
| Backend Go (net/http) | 🔲 Planificado |
| PostgreSQL + migraciones | 🔲 Planificado |
| Auth real (Argon2id, sesiones HttpOnly) | 🔲 Planificado |
| Almacenamiento de binarios (BYTEA/S3) | 🔲 Planificado |
| Verificador Go offline (cmd/verify-package) | 🔲 Planificado |
| Tests de integración | 🔲 Planificado |
| CI/CD (GitHub Actions) | 🔲 Planificado |
| Despliegue Vercel (Go runtime beta) | 🔲 Planificado |

## Desarrollo local

```bash
npm install
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build de producción
npm run typecheck # Verificación de tipos
```

## Credenciales demo

| Email | Rol | Organización |
|---|---|---|
| demo@co2evidence.local | Owner | Mi Empresa Demo S.L. |
| admin@org.test | Reviewer | Consultora Sostenibilidad S.A. |

Cualquier contraseña funciona en modo demo.

## Arquitectura prevista (producción)

```
frontend/          → React + Vite + TypeScript (este código)
api/index.go       → Handler Go para Vercel Functions
cmd/server/        → Servidor Go standalone
cmd/bootstrap/     → CLI de inicialización
cmd/verify-package → Verificador offline
internal/          → Módulos Go (httpapi, auth, domain, ledger, storage, db)
migrations/        → SQL versionado para PostgreSQL
docs/              → Documentación del producto
```

## Documentación

- [Constitución del producto](docs/PRODUCT_CONSTITUTION.md)
- [Matriz de veracidad](docs/PRODUCT_CONSTITUTION.md#reglas-de-funcionamiento)

## Licencia

Pendiente de definir por el propietario del producto.
