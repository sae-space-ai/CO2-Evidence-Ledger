#!/bin/bash
# CO2 Evidence Ledger - Script de tests automatizados
# Ejecuta todos los tests del sistema

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        CO2 Evidence Ledger - Suite de Tests               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

PASS=0
FAIL=0
SKIP=0

run_test() {
    local name="$1"
    local cmd="$2"
    
    echo -n "  Testing: $name... "
    
    if eval "$cmd" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        cat /tmp/test_output.log
        ((FAIL++))
        return 1
    fi
}

skip_test() {
    local name="$1"
    local reason="$2"
    
    echo -e "  ${YELLOW}SKIP${NC}: $name ($reason)"
    ((SKIP++))
}

# ============ FRONTEND TESTS ============
echo -e "${BLUE}📦 Frontend Tests${NC}"

run_test "TypeScript typecheck" "npm run typecheck"
run_test "Production build" "npm run build"

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "  ${GREEN}✓${NC} Build artifacts generados"
    ((PASS++))
else
    echo -e "  ${RED}✗${NC} Build artifacts no encontrados"
    ((FAIL++))
fi

echo ""

# ============ BACKEND GO TESTS ============
echo -e "${BLUE}🔧 Backend Go Tests${NC}"

if command -v go &> /dev/null; then
    run_test "Go fmt check" "test -z \"\$(gofmt -l .)\""
    run_test "Go vet" "go vet ./..."
    run_test "Go build server" "go build -o /tmp/server ./cmd/server"
    run_test "Go build bootstrap" "go build -o /tmp/bootstrap ./cmd/bootstrap"
    run_test "Go build verify-package" "go build -o /tmp/verify-package ./cmd/verify-package"
    run_test "Go unit tests" "go test ./internal/..."
    run_test "Go tests with race detector" "go test -race ./internal/..."
else
    skip_test "Go tests" "Go no instalado"
fi

echo ""

# ============ INFRASTRUCTURE TESTS ============
echo -e "${BLUE}🐳 Infrastructure Tests${NC}"

if [ -f "docker-compose.yml" ]; then
    echo -e "  ${GREEN}✓${NC} docker-compose.yml existe"
    ((PASS++))
else
    echo -e "  ${RED}✗${NC} docker-compose.yml no encontrado"
    ((FAIL++))
fi

if [ -f "Dockerfile" ]; then
    echo -e "  ${GREEN}✓${NC} Dockerfile existe"
    ((PASS++))
else
    echo -e "  ${RED}✗${NC} Dockerfile no encontrado"
    ((FAIL++))
fi

if [ -f "migrations/001_initial_schema.sql" ]; then
    echo -e "  ${GREEN}✓${NC} Migration file existe"
    ((PASS++))
else
    echo -e "  ${RED}✗${NC} Migration file no encontrado"
    ((FAIL++))
fi

echo ""

# ============ INTEGRATION TESTS ============
echo -e "${BLUE}🔗 Integration Tests${NC}"

if docker-compose ps | grep -q "Up"; then
    echo -e "  ${GREEN}✓${NC} Docker services corriendo"
    ((PASS++))
    
    # Test API health
    if curl -s http://localhost:8080/api/health | grep -q '"status":"ok"'; then
        echo -e "  ${GREEN}✓${NC} API health check"
        ((PASS++))
    else
        echo -e "  ${RED}✗${NC} API health check falló"
        ((FAIL++))
    fi
    
    # Test API ready
    if curl -s http://localhost:8080/api/ready | grep -q '"ready":true'; then
        echo -e "  ${GREEN}✓${NC} API ready check (PostgreSQL)"
        ((PASS++))
    else
        echo -e "  ${RED}✗${NC} API ready check falló"
        ((FAIL++))
    fi
else
    skip_test "Integration tests" "Docker services no corriendo"
fi

echo ""

# ============ DOCUMENTATION TESTS ============
echo -e "${BLUE}📚 Documentation Tests${NC}"

docs=("README.md" "AGENTS.md" "docs/PRODUCT_CONSTITUTION.md" "docs/ARCHITECTURE.md")

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✓${NC} $doc"
        ((PASS++))
    else
        echo -e "  ${RED}✗${NC} $doc no encontrado"
        ((FAIL++))
    fi
done

echo ""

# ============ RESUMEN ============
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMEN DE TESTS                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Pasados:${NC}  $PASS"
echo -e "  ${RED}Fallidos:${NC} $FAIL"
echo -e "  ${YELLOW}Omitidos:${NC} $SKIP"
echo ""

TOTAL=$((PASS + FAIL))
if [ $TOTAL -gt 0 ]; then
    PERCENT=$((PASS * 100 / TOTAL))
    echo -e "  Cobertura: ${PERCENT}%"
fi

echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ TESTS FALLARON${NC}"
    exit 1
elif [ $SKIP -gt 0 ]; then
    echo -e "${YELLOW}⚠️  TESTS PASARON (con omisiones)${NC}"
    exit 0
else
    echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
    exit 0
fi
