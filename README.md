# CO2 Evidence Ledger

**Evidencia trazable para declaraciones climáticas responsables**

## 🚀 Inicio Rápido

### Modo Demo (sin backend)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir http://localhost:5173
# Credenciales: demo@co2evidence.local (cualquier contraseña)
```

### Modo Producción (con backend completo)

```bash
# Configuración automática completa
bash scripts/setup.sh

# O manualmente:
make setup
```

## 📋 Comandos Automatizados

### Makefile (recomendado)

```bash
make help              # Ver todos los comandos disponibles
make setup             # Configuración completa del entorno
make dev               # Servidor de desarrollo
make build             # Build de producción
make test              # Ejecutar todos los tests
make docker-up         # Levantar servicios Docker
make docker-down       # Detener servicios
make verify            # Verificación completa
make ci                # Pipeline CI completo
```

### Scripts

```bash
bash scripts/setup.sh    # Configuración automática
bash scripts/test.sh     # Suite de tests completa
bash scripts/ci.sh       # Pipeline CI/CD local
bash scripts/verify.sh   # Verificación del sistema
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + TypeScript)                      │
│  • Autenticación con cookies HttpOnly                      │
│  • Gestión de proyectos, actividades, evidencias           │
│  • Visualización de cadena de eventos                      │
│  • Detección automática de modo (demo/producción)          │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Go + PostgreSQL)                                 │
│  • Autenticación Argon2id                                  │
│  • Cálculo exacto de emisiones (math/big.Rat)              │
│  • Cadena append-only con SHA-256                          │
│  • Aislamiento multi-tenant                                │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

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
├── scripts/
│   ├── setup.sh             # Configuración automática
│   ├── test.sh              # Suite de tests
│   ├── ci.sh                # Pipeline CI
│   └── verify.sh            # Verificación
├── src/                      # Frontend React
├── docs/                     # Documentación
├── docker-compose.yml
├── Makefile                  # Comandos automatizados
└── README.md
```

## ✅ Tests Automatizados

```bash
# Todos los tests
make test

# Solo frontend
make test-frontend

# Solo backend
make test-go

# Con cobertura
make go-test-coverage

# Suite completa
bash scripts/test.sh
```

## 🔒 Seguridad

- **Contraseñas:** Argon2id (m=64MB, t=3, p=2)
- **Sesiones:** Tokens aleatorios, hash SHA-256, expiración 24h
- **Cookies:** HttpOnly, Secure, SameSite=Strict
- **SQL:** Parametrizado en todas las consultas
- **Multi-tenant:** Aislamiento por organización
- **Archivos:** Validación MIME, límite 3MB, nombres saneados

## 📊 Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/ready` | Verificación PostgreSQL |
| POST | `/api/v1/auth/login` | Autenticación |
| POST | `/api/v1/auth/logout` | Cerrar sesión |
| GET | `/api/v1/auth/me` | Usuario actual |
| GET/POST | `/api/v1/organizations` | Organizaciones |
| GET/POST | `/api/v1/projects` | Proyectos |
| GET/POST | `/api/v1/activities` | Actividades |
| GET/POST | `/api/v1/evidence` | Evidencias |
| GET/POST | `/api/v1/claims` | Declaraciones |

## 🐳 Docker

```bash
# Levantar todo
make docker-up

# Ver logs
make docker-logs

# Detener
make docker-down

# Reiniciar
make docker-restart
```

## 📚 Documentación

- [Constitución del Producto](docs/PRODUCT_CONSTITUTION.md)
- [Arquitectura Técnica](docs/ARCHITECTURE.md)
- [Criterios de Aceptación](docs/PHASE_00_ACCEPTANCE.md)
- [Reglas para Agentes](AGENTS.md)

## ⚠️ Limitaciones

- Sin anclaje temporal externo (cadena interna)
- Sin verificación de terceros (REVIEWED_INTERNAL ≠ auditoría)
- Sin validación de factores (aportados por usuario)
- Sin Scope 3 (solo Scope 1 y 2)
- Sin créditos de carbono (ninguna operación de trading)

## 🔧 Desarrollo

```bash
# Setup completo
make setup

# Desarrollo diario
make dev

# Antes de commit
make test-all

# Verificación completa
make verify
```

## 📝 Licencia

Pendiente de definir por el propietario del producto.
