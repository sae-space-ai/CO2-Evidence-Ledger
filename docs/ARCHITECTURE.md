# CO2 Evidence Ledger - Arquitectura Técnica

## Visión general

CO2 Evidence Ledger es un sistema B2B para registro de evidencias climáticas trazables. La arquitectura sigue un patrón de separación clara entre frontend y backend, con persistencia en PostgreSQL.

## Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + Vite + Tailwind CSS                   │
│  - Autenticación (cookies HttpOnly)                         │
│  - Gestión de proyectos, actividades, evidencias            │
│  - Visualización de cadena de eventos                       │
│  - Exportación de manifiestos                               │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
                         │ Credentials: include
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Go (net/http) + PostgreSQL                                 │
│  - Autenticación Argon2id                                   │
│  - Sesiones con cookies seguras                             │
│  - Cálculo exacto de emisiones (math/big.Rat)               │
│  - Cadena append-only de eventos                            │
│  - Almacenamiento de binarios (BYTEA)                       │
│  - Aislamiento multi-tenant                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL parametrizado
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16                            │
│  - organizations, users, sessions                           │
│  - projects, activities                                     │
│  - evidence_documents (BYTEA)                               │
│  - claims, claim_activities, claim_evidence                 │
│  - claim_events (append-only)                               │
│  - audit_events                                             │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de directorios

```
co2evidence-ledger/
├── api/
│   └── index.go              # Vercel serverless function
├── cmd/
│   ├── server/main.go        # Servidor standalone
│   ├── bootstrap/main.go     # CLI de inicialización
│   └── verify-package/main.go # Verificador offline
├── internal/
│   ├── auth/                 # Argon2id, sesiones
│   ├── db/                   # Conexión PostgreSQL
│   ├── domain/               # Modelos de dominio
│   ├── httpapi/              # Handlers REST
│   ├── ledger/               # Cadena de eventos
│   └── storage/              # Gestión de evidencias
├── migrations/
│   └── 001_initial_schema.sql
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api.ts           # Cliente API (detecta modo)
│   │   ├── services.mock.ts # Mock para demo
│   │   ├── pages/           # Páginas de la UI
│   │   └── components/      # Componentes compartidos
│   └── ...
├── docker-compose.yml
├── Dockerfile                # Backend Go
├── Dockerfile.frontend       # Frontend React
├── nginx.conf                # Proxy para frontend
├── go.mod
├── .env.example
└── docs/
    ├── PRODUCT_CONSTITUTION.md
    ├── ARCHITECTURE.md (este archivo)
    └── ...
```

## Flujo de autenticación

1. Usuario envía email + password a `/api/v1/auth/login`
2. Backend verifica con Argon2id contra password_hash en DB
3. Si válido, genera token aleatorio (32 bytes)
4. Almacena hash del token en tabla sessions
5. Devuelve cookie HttpOnly, Secure, SameSite=Strict
6. Frontend incluye cookie en todas las peticiones (credentials: include)
7. Backend verifica token hash + expiración en cada request protegido

## Flujo de cadena de eventos

1. Cada acción en un claim genera un evento
2. Evento contiene: sequence, claimId, actorId, type, payload, previousHash, timestamp
3. Se serializa canónicamente (JSON con claves ordenadas)
4. Se calcula SHA-256 del canonical JSON
5. Se almacena en claim_events con previousHash apuntando al evento anterior
6. Verificación: recorrer eventos en orden, recalcular hashes, verificar encadenamiento

## Flujo de evidencias

1. Usuario sube archivo (multipart/form-data, max 3MB)
2. Backend valida MIME type (PDF, PNG, JPEG, CSV, TXT)
3. Backend calcula SHA-256 de los bytes exactos
4. Verifica si existe duplicado por SHA-256 en la misma organización
5. Si no duplicado: almacena en BYTEA + metadatos
6. Si duplicado: devuelve aviso (no es fraude, puede ser reutilización)

## Cálculo de emisiones

1. Usuario aporta: cantidad, unidad, factor (kgCO2e/unidad), fuente, año
2. Backend usa math/big.Rat para aritmética exacta
3. Resultado: kgCO2e = cantidad × factor; tCO2e = kgCO2e / 1000
4. Se marca como "factor suministrado por usuario; no validado"
5. Scope determinado por categoría (electricity = Scope 2, resto = Scope 1)

## Seguridad

- **Contraseñas**: Argon2id (m=64MB, t=3, p=2)
- **Sesiones**: tokens aleatorios, hash almacenado, expiración 24h
- **Cookies**: HttpOnly, Secure (HTTPS), SameSite=Strict
- **SQL**: parametrizado en todas las consultas
- **Multi-tenant**: organización verificada en cada operación
- **Archivos**: validación MIME, tamaño limitado, nombre saneado
- **Headers**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## Despliegue

### Local (Docker Compose)
```bash
docker-compose up -d
# PostgreSQL en :5432
# API Go en :8080
# Frontend en :3000
```

### Vercel (producción)
- Frontend: build Vite → dist/
- Backend: api/index.go (Go runtime beta)
- PostgreSQL: servicio externo (Neon, Supabase, RDS)
- Variables de entorno en Vercel dashboard

### Standalone (servidor propio)
```bash
go build -o server ./cmd/server
./server
# Escucha en :8080
# Requiere DATABASE_URL
```

## Limitaciones conocidas

1. **Sin anclaje temporal externo**: La cadena de hashes es interna. Un admin con acceso a la DB podría reconstruirla.
2. **Sin verificación de terceros**: REVIEWED_INTERNAL ≠ auditoría independiente.
3. **Sin validación de factores**: Los factores de emisión son aportados por el usuario.
4. **Sin Scope 3**: Solo Scope 1 y 2 en Fase 00.
5. **Sin créditos de carbono**: Ninguna operación de compra/venta/emisión/retirada.

## Próximas fases

- **Fase 01**: Tests de integración con PostgreSQL real
- **Fase 02**: Anclaje temporal externo (RFC 3161)
- **Fase 03**: Almacenamiento S3-compatible para archivos grandes
- **Fase 04**: API pública para terceros verificadores
- **Fase 05**: Mecanismo de supresión RGPD completo
