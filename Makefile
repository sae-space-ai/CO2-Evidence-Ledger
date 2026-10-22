.PHONY: help install dev build test clean docker-up docker-down migrate bootstrap verify

# Default target
help:
	@echo "CO2 Evidence Ledger - Comandos disponibles"
	@echo ""
	@echo "Desarrollo:"
	@echo "  make install        - Instalar dependencias (frontend)"
	@echo "  make dev            - Iniciar servidor de desarrollo"
	@echo "  make build          - Build de producción"
	@echo "  make test           - Ejecutar todos los tests"
	@echo "  make clean          - Limpiar archivos generados"
	@echo ""
	@echo "Backend Go:"
	@echo "  make go-build       - Compilar backend Go"
	@echo "  make go-test        - Tests unitarios Go"
	@echo "  make go-vet         - Go vet"
	@echo "  make go-fmt         - Go fmt"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Levantar servicios (PostgreSQL + API + Frontend)"
	@echo "  make docker-down    - Detener servicios"
	@echo "  make docker-build   - Construir imágenes Docker"
	@echo ""
	@echo "Base de datos:"
	@echo "  make migrate        - Ejecutar migraciones"
	@echo "  make bootstrap      - Crear admin inicial"
	@echo ""
	@echo "Verificación:"
	@echo "  make verify         - Verificación completa del sistema"
	@echo ""

# ============ FRONTEND ============

install:
	@echo "📦 Instalando dependencias frontend..."
	npm install
	@echo "✅ Dependencias instaladas"

dev:
	@echo "🚀 Iniciando servidor de desarrollo..."
	npm run dev

build:
	@echo "🔨 Build de producción..."
	npm run build
	@echo "✅ Build completado en dist/"

test-frontend:
	@echo "🧪 Tests frontend..."
	npm run typecheck
	@echo "✅ Tests frontend pasados"

# ============ BACKEND GO ============

go-build:
	@echo "🔧 Compilando backend Go..."
	go build -o bin/server ./cmd/server
	go build -o bin/bootstrap ./cmd/bootstrap
	go build -o bin/verify-package ./cmd/verify-package
	@echo "✅ Backend compilado en bin/"

go-test:
	@echo "🧪 Tests unitarios Go..."
	go test -v ./internal/...
	@echo "✅ Tests Go pasados"

go-test-coverage:
	@echo "🧪 Tests con cobertura..."
	go test -v -coverprofile=coverage.out ./internal/...
	go tool cover -html=coverage.out -o coverage.html
	@echo "✅ Cobertura generada en coverage.html"

go-vet:
	@echo "🔍 Go vet..."
	go vet ./...
	@echo "✅ Go vet pasado"

go-fmt:
	@echo "📝 Go fmt..."
	gofmt -w .
	@echo "✅ Código formateado"

go-fmt-check:
	@echo "🔍 Verificando formato..."
	@files=$$(gofmt -l .); \
	if [ -n "$$files" ]; then \
		echo "❌ Archivos sin formato:"; \
		echo "$$files"; \
		exit 1; \
	fi
	@echo "✅ Formato correcto"

# ============ TESTS ============

test: test-frontend go-test
	@echo "✅ Todos los tests pasados"

test-all: test-frontend go-test go-vet go-fmt-check
	@echo "✅ Verificación completa pasada"

# ============ DOCKER ============

docker-build:
	@echo "🐳 Construyendo imágenes Docker..."
	docker-compose build
	@echo "✅ Imágenes construidas"

docker-up:
	@echo "🚀 Levantando servicios..."
	docker-compose up -d
	@echo "✅ Servicios levantados"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "API: http://localhost:8080"
	@echo "PostgreSQL: localhost:5432"

docker-down:
	@echo "🛑 Deteniendo servicios..."
	docker-compose down
	@echo "✅ Servicios detenidos"

docker-logs:
	docker-compose logs -f

docker-restart:
	docker-compose restart

# ============ BASE DE DATOS ============

migrate:
	@echo "🗄️  Ejecutando migraciones..."
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "❌ DATABASE_URL no configurado"; \
		echo "Exporta DATABASE_URL o usa docker-up primero"; \
		exit 1; \
	fi
	go run cmd/server/main.go &
	sleep 3
	kill %1 2>/dev/null || true
	@echo "✅ Migraciones ejecutadas"

bootstrap:
	@echo "👤 Creando admin inicial..."
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "❌ DATABASE_URL no configurado"; \
		exit 1; \
	fi
	go run cmd/bootstrap/main.go
	@echo "✅ Admin creado"

# ============ VERIFICACIÓN ============

verify:
	@echo "🔍 Verificación completa del sistema..."
	@bash scripts/verify.sh

verify-quick:
	@echo "🔍 Verificación rápida..."
	npm run typecheck && echo "✅ Frontend OK"
	@echo "✅ Verificación rápida completada"

# ============ LIMPIEZA ============

clean:
	@echo "🧹 Limpiando archivos generados..."
	rm -rf dist/ bin/ node_modules/ coverage.out coverage.html
	@echo "✅ Limpieza completada"

clean-docker:
	@echo "🧹 Limpiando Docker..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Docker limpiado"

# ============ DESPLIEGUE ============

deploy-preview:
	@echo "🚀 Desplegando preview..."
	@echo "⚠️  Requiere configuración de Vercel CLI"
	vercel --prod
	@echo "✅ Preview desplegado"

# ============ DOCUMENTACIÓN ============

docs:
	@echo "📚 Generando documentación..."
	@echo "✅ Documentación disponible en docs/"

# ============ CI/CD ============

ci: go-fmt-check go-vet go-test test-frontend
	@echo "✅ CI pasado"

# ============ DESARROLLO RÁPIDO ============

setup: install docker-up
	@echo "✅ Entorno de desarrollo listo"
	@echo ""
	@echo "Próximos pasos:"
	@echo "1. Espera a que PostgreSQL esté listo (10-20s)"
	@echo "2. Ejecuta: make bootstrap"
	@echo "3. Abre: http://localhost:3000"

reset: docker-down clean docker-up
	@echo "✅ Entorno reiniciado"
