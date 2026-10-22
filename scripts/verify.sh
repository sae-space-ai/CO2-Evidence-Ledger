#!/bin/bash
# CO2 Evidence Ledger - Quick Verification Script
# Verifica que todos los componentes están listos

set -e

echo "🔍 CO2 Evidence Ledger - Verificación Rápida"
echo "============================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0
blocked=0

check() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((pass++))
    else
        echo -e "${RED}✗${NC} $name"
        ((fail++))
    fi
}

check_blocked() {
    local name="$1"
    local reason="$2"
    
    echo -e "${YELLOW}⊘${NC} $name (${reason})"
    ((blocked++))
}

# ============ FRONTEND ============
echo "📦 Frontend"
check "package.json existe" "test -f package.json"
check "node_modules existe" "test -d node_modules"
check "TypeScript válido" "npm run typecheck"
check "Build exitoso" "npm run build"
check "dist/ generado" "test -d dist"
check "index.html existe" "test -f dist/index.html"
echo ""

# ============ BACKEND ============
echo "🔧 Backend"
check "go.mod existe" "test -f go.mod"
check "Código fuente existe" "test -f cmd/server/main.go"
check "Migraciones existen" "test -f migrations/001_initial_schema.sql"

if command -v go &> /dev/null; then
    check "Go build" "go build ./cmd/server/..."
    check "Go tests" "go test ./internal/..."
else
    check_blocked "Go build" "Go no instalado"
    check_blocked "Go tests" "Go no instalado"
fi
echo ""

# ============ INFRAESTRUCTURA ============
echo "🐳 Infraestructura"
check "docker-compose.yml existe" "test -f docker-compose.yml"
check "Dockerfile existe" "test -f Dockerfile"
check "Dockerfile.frontend existe" "test -f Dockerfile.frontend"
check "nginx.conf existe" "test -f nginx.conf"
check ".env.example existe" "test -f .env.example"
echo ""

# ============ DOCUMENTACIÓN ============
echo "📚 Documentación"
check "README.md existe" "test -f README.md"
check "AGENTS.md existe" "test -f AGENTS.md"
check "PRODUCT_CONSTITUTION.md existe" "test -f docs/PRODUCT_CONSTITUTION.md"
check "ARCHITECTURE.md existe" "test -f docs/ARCHITECTURE.md"
echo ""

# ============ BASE DE DATOS ============
echo "🗄️  Base de datos"
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
    check "PostgreSQL accesible" "psql $DATABASE_URL -c 'SELECT 1'"
    check "Migraciones aplicadas" "psql $DATABASE_URL -c 'SELECT 1 FROM migration_history WHERE version = 1'"
else
    check_blocked "PostgreSQL" "DATABASE_URL no configurado"
fi
echo ""

# ============ API ============
echo "🌐 API"
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    check "API respondiendo" "curl -f http://localhost:8080/api/health"
    check "PostgreSQL ready" "curl -f http://localhost:8080/api/ready"
else
    check_blocked "API" "Servidor no corriendo"
fi
echo ""

# ============ RESUMEN ============
echo "============================================="
echo -e "Resumen: ${GREEN}$pass pasados${NC}, ${RED}$fail fallidos${NC}, ${YELLOW}$blocked bloqueados${NC}"
echo ""

if [ $fail -gt 0 ]; then
    echo -e "${RED}❌ Verificación falló${NC}"
    exit 1
elif [ $blocked -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Verificación parcial (entorno incompleto)${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Verificación completa${NC}"
    exit 0
fi
