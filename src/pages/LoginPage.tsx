// CO2 Evidence Ledger - Login Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@co2evidence.local');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <i className="fa-solid fa-leaf text-white text-xl"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">CO2 Evidence Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">Evidencia trazable para declaraciones climáticas responsables</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Iniciar sesión</h2>
          <p className="text-xs text-slate-500 mb-5">Acceso al sistema de registro de evidencias</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                <i className="fa-solid fa-circle-xmark"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
            >
              {loading ? 'Autenticando...' : 'Acceder'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
                <i className="fa-solid fa-flask text-[8px]"></i> ENTORNO DEMO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Esta interfaz funciona con datos simulados en el navegador. En producción, 
              la autenticación se realiza contra un backend Go con Argon2id y sesiones HttpOnly.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              <strong>Credenciales demo:</strong><br />
              <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">demo@co2evidence.local</code> (owner)<br />
              <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">admin@org.test</code> (reviewer, org. aislada)
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Fase 00 · Producto mínimo vertical · Sin certificados ni verificaciones externas
        </p>
      </div>
    </div>
  );
}
