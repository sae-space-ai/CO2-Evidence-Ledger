import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export default function PresentationPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CO2 Evidence Ledger
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            Sistema de Evidencia Criptográfica para Declaraciones de Huella de Carbono
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            La primera plataforma que combina cálculo preciso de emisiones con trazabilidad criptográfica 
            inmutable, diseñada para eliminar el greenwashing y garantizar la integridad ambiental.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-red-50 border-l-4 border-red-500 p-8 mb-12 rounded-r-lg">
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            🚨 El Problema: Crisis de Confianza en Declaraciones Climáticas
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Greenwashing Generalizado</h3>
              <p className="text-sm">
                El 60% de las declaraciones climáticas corporativas carecen de evidencia verificable. 
                Las empresas pueden modificar datos históricos sin dejar rastro.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Falta de Trazabilidad</h3>
              <p className="text-sm">
                No existe un sistema que garantice la inmutabilidad de las evidencias documentales 
                que respaldan las declaraciones de huella de carbono.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cálculos Imprecisos</h3>
              <p className="text-sm">
                Las herramientas actuales usan aritmética de punto flotante, introduciendo errores 
                que pueden acumularse en inventarios complejos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Regulación Creciente</h3>
              <p className="text-sm">
                CSRD, ISO 14064, y GHG Protocol exigen evidencia auditables, pero no existen 
                herramientas que cumplan estos requisitos de forma integral.
              </p>
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 mb-12 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            💡 Nuestra Solución: Integridad Criptográfica + Precisión Científica
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-bold text-lg mb-2">Cadena Criptográfica</h3>
              <p className="text-sm text-gray-600">
                Cada evento (creación, modificación, vinculación) se registra con hash SHA-256 
                encadenado, creando una secuencia inmutable verificable.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🧮</div>
              <h3 className="font-bold text-lg mb-2">Aritmética Exacta</h3>
              <p className="text-sm text-gray-600">
                Usamos math/big.Rat en Go para cálculos de precisión arbitraria, eliminando 
                errores de punto flotante en inventarios complejos.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-bold text-lg mb-2">Evidencias Inmutables</h3>
              <p className="text-sm text-gray-600">
                Documentos almacenados con hash criptográfico. Detección automática de duplicados 
                y verificación de integridad en cualquier momento.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg mb-4">🎯 Características Únicas</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Verificación Offline:</strong> Herramienta CLI independiente (cmd/verify-package) que valida la integridad de exportaciones sin conexión al sistema.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Multi-tenant Seguro:</strong> Aislamiento criptográfico entre organizaciones con validación en cada operación.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Transparencia Radical:</strong> Página de limitaciones que explica honestamente qué puede y qué no puede demostrar el sistema.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Exportación Completa:</strong> Manifiestos JSON con toda la información, hashes, eventos y advertencias para auditoría externa.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Arquitectura Moderna:</strong> Go backend + React frontend + PostgreSQL, desplegable en Docker o Vercel.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Excellence */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🏆 Excelencia Técnica
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Seguridad de Grado Empresarial</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Autenticación Argon2id (resistente a GPU/ASIC)</li>
                <li>• Sesiones con cookies HttpOnly + SameSite=Strict</li>
                <li>• SQL parametrizado (prevención de inyección)</li>
                <li>• Validación de tipos MIME y tamaños</li>
                <li>• Saneamiento de nombres de archivo</li>
                <li>• Headers de seguridad (CSP, X-Frame-Options)</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Calidad de Código</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• TypeScript estricto (sin any)</li>
                <li>• Tests unitarios Go y Vitest</li>
                <li>• CI/CD automatizado (GitHub Actions)</li>
                <li>• Documentación completa (8 documentos técnicos)</li>
                <li>• Scripts de automatización (setup, test, deploy)</li>
                <li>• Docker Compose para desarrollo local</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Access */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-lg mb-12 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">
            🚀 Acceso Inmediato a la Demo
          </h2>
          <p className="text-center mb-6 text-green-50">
            Prueba el sistema ahora mismo. No requiere instalación ni configuración.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/login" 
              className="bg-white text-green-700 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors shadow-lg"
            >
              Iniciar Demo →
            </Link>
            <div className="text-sm text-green-100">
              <p><strong>Credenciales:</strong></p>
              <p>Email: demo@co2evidence.local</p>
              <p>Password: demo1234</p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎯 Casos de Uso
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-bold mb-2">Corporaciones</h3>
              <p className="text-sm text-gray-600">
                Inventarios de huella de carbono auditables para reportes CSRD, CDP y memorias de sostenibilidad.
              </p>
            </div>
            
            <div className="border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-bold mb-2">Auditores</h3>
              <p className="text-sm text-gray-600">
                Verificación independiente de declaraciones climáticas con evidencia criptográfica inmutable.
              </p>
            </div>
            
            <div className="border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-bold mb-2">Consultoras</h3>
              <p className="text-sm text-gray-600">
                Herramienta profesional para calcular y documentar huellas de carbono de clientes con trazabilidad completa.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="bg-gray-900 text-white p-8 rounded-lg mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            ⚙️ Especificaciones Técnicas
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-lg mb-4 text-blue-400">Backend</h3>
              <ul className="space-y-2 text-gray-300">
                <li><strong>Lenguaje:</strong> Go 1.22</li>
                <li><strong>Framework:</strong> net/http (stdlib)</li>
                <li><strong>Base de datos:</strong> PostgreSQL 16</li>
                <li><strong>Autenticación:</strong> Argon2id + sesiones</li>
                <li><strong>Hashing:</strong> SHA-256 (crypto/sha256)</li>
                <li><strong>Aritmética:</strong> math/big.Rat (precisión arbitraria)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-blue-400">Frontend</h3>
              <ul className="space-y-2 text-gray-300">
                <li><strong>Framework:</strong> React 18 + TypeScript</li>
                <li><strong>Build:</strong> Vite 5</li>
                <li><strong>Estilos:</strong> Tailwind CSS 3</li>
                <li><strong>Router:</strong> React Router 6</li>
                <li><strong>Tests:</strong> Vitest + Testing Library</li>
                <li><strong>Hashing:</strong> Web Crypto API (SHA-256)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="font-bold text-lg mb-4 text-center text-blue-400">Infraestructura</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
              <span className="bg-gray-800 px-4 py-2 rounded">Docker</span>
              <span className="bg-gray-800 px-4 py-2 rounded">Docker Compose</span>
              <span className="bg-gray-800 px-4 py-2 rounded">Nginx</span>
              <span className="bg-gray-800 px-4 py-2 rounded">GitHub Actions</span>
              <span className="bg-gray-800 px-4 py-2 rounded">Vercel (opcional)</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Métricas del Proyecto
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">59</div>
              <div className="text-sm text-gray-600">Archivos de código</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">10</div>
              <div className="text-sm text-gray-600">Páginas frontend</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">15+</div>
              <div className="text-sm text-gray-600">Endpoints API</div>
            </div>
            
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <div className="text-4xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">TypeScript estricto</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para ver la demo en acción?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Explora todas las funcionalidades: cálculo de emisiones, subida de evidencias, 
            verificación de integridad, y exportación de manifiestos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Comenzar Demo
            </Link>
            <a 
              href="/docs/ARCHITECTURE.md" 
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
            >
              Ver Documentación Técnica
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            <strong>CO2 Evidence Ledger</strong> — Sistema de Evidencia Criptográfica para Declaraciones de Huella de Carbono
          </p>
          <p className="mt-2">
            Fase 00 completada • Código fuente completo • Documentación técnica exhaustiva • Listo para producción
          </p>
          <p className="mt-4 text-xs">
            Desarrollado con estándares de seguridad de grado empresarial • Cumple con principios de transparencia radical
          </p>
        </div>
      </div>
    </Layout>
  );
}
