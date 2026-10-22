# CO2 Evidence Ledger

**Evidencia trazable para declaraciones climáticas responsables**

## Estado actual

**Fase 01 — Backend Go + PostgreSQL + Frontend conectado**

Este repositorio contiene:
- ✅ Backend Go completo (API REST, autenticación Argon2id, PostgreSQL)
- ✅ Migraciones SQL para esquema completo
- ✅ Frontend React con detección automática de modo (demo/producción)
- ✅ Docker Compose para desarrollo local
- ✅ Verificador offline de paquetes
- ✅ Documentación técnica completa

## Arquitectura

```
Frontend (React + Vite) ←→ Backend (Go) ←→ PostgreSQL
         ↓                      ↓
    localStorage          Argon2id + Sesiones
    (modo demo)           Cadena append-only
                          SHA-256 de evidencias
```

## Inicio rápido

### Modo demo (sin backend)

```bash
npm install
npm run dev
# Abre http://localhost:5173
# Credenciales: demo@co2evidence.local (cualquier contraseña)
```

En modo demo, todos los datos se almacenan en localStorage del navegador. El hashing SHA-256 de archivos SÍ se calcula en tiempo real.

### Modo producción (con backend)

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con valores seguros

# 2. Levantar con Docker Compose
docker-compose up -d

# 3. Ejecutar bootstrap (crear admin inicial)
docker-compose exec api /app/bootstrap

# 4. Acceder
# Frontend: http://localhost:3000
# API: http://localhost:8080
```

## Estructura del proyecto

```
co2evidence-ledger/
├── api/index.go              # Vercel serverless function
├── cmd/
│   ├── server/main.go        # Servidor Go standalone
│   ├── bootstrap/main.go     # CLI de inicialización
│   └── verify-package/main.go # Verificador offline
├── internal/
│   ├── auth/                 # Argon2id, sesiones
│   ├── db/                   # Conexión PostgreSQL
│   ├── domain/               # Modelos
│   ├── httpapi/              # Handlers REST
│   └── ledger/               # Cadena de eventos
├── migrations/               # SQL versionado
├── src/                      # Frontend React
│   ├── api.ts               # Cliente API (detecta modo)
│   ├── services.mock.ts     # Mock para demo
│   └── pages/               # Páginas de la UI
├── docker-compose.yml
├── Dockerfile                # Backend Go
├── Dockerfile.frontend       # Frontend React
└── docs/                     # Documentación
```

## Funcionalidades implementadas

### Backend Go
- ✅ Autenticación con Argon2id
- ✅ Sesiones con cookies HttpOnly, Secure, SameSite
- ✅ API REST completa (/api/v1/*)
- ✅ Cálculo exacto de emisiones (math/big.Rat)
- ✅ Cadena append-only de eventos con SHA-256
- ✅ Almacenamiento de evidencias (BYTEA)
- ✅ Detección de duplicados por hash
- ✅ Aislamiento multi-tenant
- ✅ Migraciones SQL versionadas

### Frontend React
- ✅ Detección automática de modo (demo/producción)
- ✅ Login con credenciales
- ✅ Dashboard con estado del sistema
- ✅ Gestión de proyectos
- ✅ Registro de actividades (Scope 1 y 2)
- ✅ Subida de evidencias con SHA-256 real
- ✅ Declaraciones con cronología auditable
- ✅ Verificación de integridad de cadenas
- ✅ Exportación de manifiestos
- ✅ Página de alcance y limitaciones
- ✅ Diseño responsive y accesible

### Herramientas
- ✅ Verificador offline (cmd/verify-package)
- ✅ Bootstrap CLI (cmd/bootstrap)
- ✅ Docker Compose para desarrollo
- ✅ Documentación completa

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Estado del servicio |
| GET | /api/ready | Verificación de PostgreSQL |
| POST | /api/v1/auth/login | Autenticación |
| POST | /api/v1/auth/logout | Cerrar sesión |
| GET | /api/v1/auth/me | Usuario actual |
| GET/POST | /api/v1/organizations | Organizaciones |
| GET/POST | /api/v1/projects | Proyectos |
| GET/POST | /api/v1/activities | Actividades |
| GET/POST | /api/v1/evidence | Evidencias |
| GET/POST | /api/v1/claims | Declaraciones |
| GET | /api/v1/claims/:id/events | Eventos de claim |
| POST | /api/v1/claims/:id/evidence | Vincular evidencia |
| POST | /api/v1/claims/:id/activities | Vincular actividad |

## Credenciales demo

| Email | Rol | Organización |
|-------|-----|--------------|
| demo@co2evidence.local | Owner | Mi Empresa Demo S.L. |
| admin@org.test | Reviewer | Consultora Sostenibilidad S.A. |

Cualquier contraseña funciona en modo demo.

## Variables de entorno

```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname
SESSION_SECRET=random_64_char_string
PORT=8080
VITE_API_URL=http://localhost:8080  # Frontend dev
```

## Documentación

- [Constitución del producto](docs/PRODUCT_CONSTITUTION.md)
- [Arquitectura técnica](docs/ARCHITECTURE.md)
- [Reglas para agentes](AGENTS.md)

## Limitaciones

- **Sin anclaje temporal externo**: La cadena es interna; un admin podría reconstruirla
- **Sin verificación de terceros**: REVIEWED_INTERNAL ≠ auditoría independiente
- **Sin validación de factores**: Los factores son aportados por el usuario
- **Sin Scope 3**: Solo Scope 1 y 2 en Fase 00/01
- **Sin créditos de carbono**: Ninguna operación de trading

## Próximas fases

- **Fase 02**: Tests de integración con PostgreSQL real
- **Fase 03**: Anclaje temporal externo (RFC 3161)
- **Fase 04**: Almacenamiento S3-compatible
- **Fase 05**: API pública para verificadores

## Licencia

Pendiente de definir por el propietario del producto.
