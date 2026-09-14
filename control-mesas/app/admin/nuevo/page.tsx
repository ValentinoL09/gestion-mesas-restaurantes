'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtegerAdmin } from '../../../src/lib/useProtegerAdmin';
import NavAdmin from '../_nav';

export default function NuevoRestaurante() {
  const { verificando } = useProtegerAdmin();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cantidadMesas, setCantidadMesas] = useState('10');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const res = await fetch('/api/admin/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          cantidadMesas: Number(cantidadMesas),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el restaurante.');
      }

      router.push(`/admin/${data.restaurante.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el restaurante.');
      setCargando(false);
    }
  }

  if (verificando) return <div className="p-10 text-center">Verificando acceso...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="nuevo" />

      <main className="max-w-xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Nuevo restaurante</h1>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        <form onSubmit={crear} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label htmlFor="nombreRest" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del restaurante
            </label>
            <input
              id="nombreRest"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Parrilla Don Tino"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="emailDueño" className="block text-sm font-medium text-gray-700 mb-1">
              Email del dueño (será su usuario de acceso)
            </label>
            <input
              id="emailDueño"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dueno@restaurante.com"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="passwordDueño" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="passwordDueño"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="cantidadMesas" className="block text-sm font-medium text-gray-700 mb-1">
              Mesas iniciales (opcional)
            </label>
            <input
              id="cantidadMesas"
              type="number"
              min={0}
              max={100}
              value={cantidadMesas}
              onChange={(e) => setCantidadMesas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se crearán automáticamente las mesas numeradas del 1 al N. Podés agregar más después.
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-[var(--t-secundario)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-400"
          >
            {cargando ? 'Creando...' : 'Crear restaurante'}
          </button>
        </form>
      </main>
    </div>
  );
}