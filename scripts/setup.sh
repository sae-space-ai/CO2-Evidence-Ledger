#!/bin/bash
# CO2 Evidence Ledger - Script de configuración automática
# Este script configura todo el entorno de desarrollo

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CO2 Evidence Ledger - Configuración Automática          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar dependencias
echo -e "${BLUE}📋 Verificando dependencias...${NC}"

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 encontrado"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 no encontrado"
        return 1
    fi
}

MISSING=0

check_command "node" || MISSING=1
check_command "npm" || MISSING=1
check_command "docker" || MISSING=1
check_command "docker-compose" || MISSING=1

if command -v go &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} go encontrado ($(go version | cut -d' ' -f3))"
else
    echo -e "  ${YELLOW}⊘${NC} go no encontrado (opcional para modo demo)"
fi

echo ""

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}❌ Faltan dependencias obligatorias${NC}"
    echo ""
    echo "Instala:"
    echo "  - Node.js 20+: https://nodejs.org/"
    echo "  - Docker: https://www.docker.com/"
    exit 1
fi

# Instalar dependencias frontend
echo -e "${BLUE}📦 Instalando dependencias frontend...${NC}"
npm install
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Configurar .env
echo -e "${BLUE}⚙️  Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env creado desde .env.example${NC}"
    echo -e "${YELLOW}⚠️  Edita .env con valores seguros antes de producción${NC}"
else
    echo -e "${GREEN}✅ .env ya existe${NC}"
fi
echo ""

# Levantar Docker
echo -e "${BLUE}🐳 Levantando servicios Docker...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Servicios levantados${NC}"
echo ""

# Esperar a PostgreSQL
echo -e "${BLUE}⏳ Esperando a que PostgreSQL esté listo...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U co2admin -d co2evidence > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL listo${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout esperando PostgreSQL${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Ejecutar migraciones
echo -e "${BLUE}🗄️  Ejecutando migraciones...${NC}"
export DATABASE_URL="postgres://co2admin:changeme_in_production@localhost:5432/co2evidence?sslmode=disable"

# Iniciar servidor temporalmente para migraciones
go run cmd/server/main.go &
SERVER_PID=$!
sleep 3

# Verificar que esté corriendo
if curl -s http://localhost:8080/api/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudieron ejecutar migraciones automáticamente${NC}"
    echo -e "${YELLOW}   Ejecuta manualmente: make migrate${NC}"
fi

kill $SERVER_PID 2>/dev/null || true
echo ""

# Resumen
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ CONFIGURACIÓN COMPLETADA                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Servicios disponibles:${NC}"
echo "  • Frontend: http://localhost:3000"
echo "  • API:      http://localhost:8080"
echo "  • PostgreSQL: localhost:5432"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Crea el admin inicial: make bootstrap"
echo "  2. Abre el frontend: http://localhost:3000"
echo "  3. Inicia sesión con las credenciales del bootstrap"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo "  make dev          - Servidor de desarrollo"
echo "  make test         - Ejecutar tests"
echo "  make docker-logs  - Ver logs"
echo "  make docker-down  - Detener servicios"
echo ""
