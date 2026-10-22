# Guía de Demostración - CO2 Evidence Ledger

## Duración: 15 minutos
## Audiencia: Jueces del concurso, inversores, potenciales clientes

---

## Preparación Previa (2 minutos antes)

1. Abrir navegador en modo incógnito
2. Navegar a: `https://co2-evidence-ledger.vercel.app/presentation`
3. Verificar que la página de presentación carga correctamente
4. Tener credenciales a mano: `demo@co2evidence.local` / `demo1234`

---

## Guión de Demostración

### 1. Introducción y Problema (2 minutos)

**Pantalla**: `/presentation`

**Narrativa**:
> "Buenos días. El 60% de las declaraciones climáticas corporativas carecen de evidencia verificable. Las empresas pueden modificar datos históricos sin dejar rastro, lo que genera una crisis de confianza en los reportes ambientales. CO2 Evidence Ledger resuelve este problema mediante trazabilidad criptográfica inmutable y precisión científica."

**Acciones**:
- Hacer scroll lentamente por la página de presentación
- Señalar las secciones clave: Problema, Solución, Características Únicas
- Hacer clic en "Iniciar Demo →"

---

### 2. Autenticación Segura (1 minuto)

**Pantalla**: `/login`

**Narrativa**:
> "El sistema utiliza autenticación Argon2id, resistente a ataques GPU/ASIC. Las sesiones son HttpOnly con SameSite=Strict para prevenir CSRF. Observen que somos transparentes sobre el modo demo."

**Acciones**:
- Introducir credenciales: `demo@co2evidence.local` / `demo1234`
- Hacer clic en "Iniciar sesión"
- Señalar el badge "MODO DEMO" en la esquina superior

---

### 3. Dashboard y Estado del Sistema (2 minutos)

**Pantalla**: `/` (Dashboard)

**Narrativa**:
> "Este es el panel de control. Vemos el estado del sistema: API activa, base de datos conectada, sesión del usuario. Las tarjetas muestran métricas en tiempo real: organizaciones, declaraciones, evidencias, y emisiones calculadas. Todo está aislado por organización para seguridad multi-tenant."

**Acciones**:
- Señalar cada tarjeta de métricas
- Mostrar la sección "Organizaciones" (aislamiento multi-tenant)
- Mostrar "Declaraciones recientes"
- Hacer clic en "Proyectos" en el menú lateral

---

### 4. Creación de Proyecto de Inventario (2 minutos)

**Pantalla**: `/projects`

**Narrativa**:
> "Creamos un proyecto de inventario definiendo el límite operacional y el año de reporte. Esto es crucial para el cumplimiento de CSRD e ISO 14064. El sistema no valida la exhaustividad del perímetro - eso es responsabilidad del usuario - pero sí registra la declaración explícitamente."

**Acciones**:
- Hacer clic en "Nuevo proyecto"
- Completar formulario:
  - Nombre: "Inventario GEI 2026"
  - Año: 2026
  - Descripción: "Inventario de emisiones de gases de efecto invernadero"
  - Límite operacional: "Scope 1 y 2, todas las instalaciones propias"
- Hacer clic en "Crear proyecto"
- Mostrar el proyecto creado en la lista

---

### 5. Registro de Actividad con Cálculo Preciso (3 minutos)

**Pantalla**: `/activities`

**Narrativa**:
> "Aquí está la innovación clave: usamos aritmética de precisión arbitraria con math/big.Rat en Go. Miren este ejemplo: 1000 litros de diésel × 2.5 kgCO2e/litro = exactamente 2500 kgCO2e = 2.5 tCO2e. Sin errores de punto flotante. El factor de emisión es aportado por el usuario y marcado como 'no validado' - somos honestos sobre las limitaciones."

**Acciones**:
- Hacer clic en "Nueva actividad"
- Seleccionar proyecto creado
- Completar formulario:
  - Nombre: "Consumo diésel flota vehículos"
  - Categoría: "Diésel (Scope 1)"
  - Periodo: 2026-01-01 a 2026-12-31
  - Cantidad: 1000
  - Unidad: litros
  - Factor: 2.5
  - Fuente: "DEFRA 2025"
  - Año del factor: 2026
- **IMPORTANTE**: Mostrar la vista previa del cálculo en verde
- Hacer clic en "Registrar actividad"
- Mostrar la actividad en la lista con el resultado: 2.5 tCO2e

**Punto clave**: Señalar el mensaje "Factor suministrado por el usuario; no validado"

---

### 6. Subida de Evidencia con Hash SHA-256 (2 minutos)

**Pantalla**: `/evidence`

**Narrativa**:
> "Subimos un documento de respaldo. El sistema calcula el hash SHA-256 de los bytes exactos usando Web Crypto API. Este hash demuestra coincidencia de contenido, no autoría ni fecha. Si intentamos subir el mismo archivo nuevamente, el sistema detecta la coincidencia exacta - útil para reutilización legítima, no indica fraude."

**Acciones**:
- Preparar un archivo PDF de prueba (puede ser cualquier PDF pequeño)
- Hacer clic en el área de upload o arrastrar el archivo
- Mostrar el cálculo del hash SHA-256 en tiempo real
- Mostrar la evidencia registrada con su hash completo
- **OPCIONAL**: Intentar subir el mismo archivo nuevamente para mostrar detección de duplicados

---

### 7. Creación de Declaración con Trazabilidad (2 minutos)

**Pantalla**: `/claims` → `/claims/[id]`

**Narrativa**:
> "Creamos una declaración vinculando actividades y evidencias. Cada acción genera un evento en la cronología append-only con hash encadenado. Esto crea una secuencia inmutable verificable. El estado inicial es BORRADOR, y puede evolucionar a REVISIÓN y APROBADO, registrando cada transición."

**Acciones**:
- Ir a "Declaraciones" en el menú
- Hacer clic en "Nueva declaración"
- Completar:
  - Título: "Declaración Q1 2026"
  - Descripción: "Inventario de emisiones primer trimestre"
- Hacer clic en "Crear declaración"
- Entrar en la declaración creada
- Vincular la actividad creada (seleccionar del dropdown)
- Vincular la evidencia subida (seleccionar del dropdown)
- **IMPORTANTE**: Mostrar la cronología de eventos con hashes encadenados
- Cambiar estado a "Listo para revisión"
- Mostrar el nuevo evento en la cronología

---

### 8. Verificación de Integridad (1 minuto)

**Pantalla**: `/integrity`

**Narrativa**:
> "El panel de integridad permite verificar la cadena de eventos. Recalcula cada hash y detecta cualquier alteración. Esto es independiente de la base de datos - un auditor puede verificar offline con nuestra herramienta CLI."

**Acciones**:
- Ir a "Integridad" en el menú
- Seleccionar la declaración creada
- Hacer clic en "Verificar integridad"
- Mostrar el resultado: "Cadena íntegra: X eventos verificados correctamente"

---

### 9. Exportación de Manifiesto (1 minuto)

**Pantalla**: `/export`

**Narrativa**:
> "Exportamos un manifiesto JSON completo con toda la información: declaración, organización, proyecto, actividades, evidencias con hashes, eventos con cadena criptográfica, y advertencias sobre limitaciones. Este manifiesto puede ser verificado offline con cmd/verify-package sin conexión al sistema."

**Acciones**:
- Ir a "Exportar" en el menú
- Seleccionar la declaración
- Hacer clic en "Generar manifiesto"
- Mostrar la información completa del manifiesto
- Hacer clic en "Descargar JSON"
- **OPCIONAL**: Abrir el JSON descargado y mostrar la estructura

---

### 10. Transparencia Radical (1 minuto)

**Pantalla**: `/limitations`

**Narrativa**:
> "Finalmente, nuestra página de limitaciones. Somos radicalmente transparentes sobre lo que el sistema puede y no puede demostrar. Un hash SHA-256 no certifica autoría ni fecha ante terceros. La cadena es interna, no equivale a blockchain descentralizada. No somos una certificación de huella de carbono - somos una herramienta de trazabilidad. Esta honestidad es nuestra fortaleza."

**Acciones**:
- Ir a "Alcance y límites" en el menú
- Hacer scroll mostrando las secciones:
  - "Lo que este sistema ES"
  - "Lo que este sistema NO ES"
  - "Distinciones técnicas rigurosas"
  - "Alcance de la Fase 00"

---

## Cierre (30 segundos)

**Narrativa**:
> "CO2 Evidence Ledger resuelve la crisis de confianza en declaraciones climáticas mediante integridad criptográfica y precisión científica. Código fuente completo, documentación exhaustiva, listo para producción. Gracias."

**Acciones**:
- Volver a la página de presentación
- Mostrar el botón "Comenzar Demo" para que los jueces prueben

---

## Preguntas Frecuentes de Jueces

### P: ¿Cómo se compara con blockchain?
**R**: "Blockchain es generalista, costosa (gas fees), lenta (consenso), y pública. Nosotros somos especializados en carbono, baratos (PostgreSQL), rápidos (transacciones), y privados (multi-tenant). Usamos criptografía donde aporta valor, sin la complejidad innecesaria de blockchain."

### P: ¿Qué pasa si un administrador modifica la base de datos?
**R**: "Excelente pregunta. La cadena de hashes detecta modificaciones si se conserva una copia independiente de los hashes. Pero somos honestos: un administrador con acceso completo podría reconstruir la cadena. Por eso ofrecemos verificación offline y recomendamos anclaje temporal externo (RFC 3161) en producción."

### P: ¿Los cálculos son precisos?
**R**: "Usamos math/big.Rat en Go para precisión arbitraria. 1000 × 2.5 = exactamente 2500, sin errores de punto flotante. Pero los factores de emisión son aportados por el usuario y marcados como 'no validados'. No somos una autoridad de factores - somos una herramienta de cálculo."

### P: ¿Cumple con CSRD/ISO 14064?
**R**: "El sistema facilita el cumplimiento proporcionando evidencia trazables, pero no certifica conformidad. Eso requiere verificación por tercero independiente. Nosotros proporcionamos las herramientas para que el verificador pueda auditar criptográficamente."

### P: ¿Cómo monetizan?
**R**: "Modelo SaaS B2B con planes por organización y volumen de evidencias. Mercado de $15B en software de sostenibilidad corporativa, creciendo 25% CAGR impulsado por regulación CSRD. 10,000+ empresas europeas requieren reporte CSRD en 2025."

---

## Consejos para la Demostración

1. **Practicar el flujo completo** al menos 3 veces antes del concurso
2. **Tener un archivo PDF de prueba** listo para upload
3. **Navegar con seguridad** - conocer los atajos de teclado
4. **Enfatizar la transparencia** - es nuestro diferenciador clave
5. **No overpromiser** - ser honesto sobre limitaciones
6. **Mostrar el código** si los jueces son técnicos (abrir GitHub)
7. **Tener backup** - descargar el repositorio localmente por si falla internet

---

## Checklist Pre-Demo

- [ ] Navegador en modo incógnito
- [ ] URL de demo abierta
- [ ] Credenciales anotadas
- [ ] Archivo PDF de prueba listo
- [ ] Conexión a internet estable
- [ ] Repositorio local como backup
- [ ] Documentación técnica abierta en otra pestaña
- [ ] Cronómetro para controlar los 15 minutos

---

**¡Buena suerte! La herramienta está lista para brillar.** 🚀
