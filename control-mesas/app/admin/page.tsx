'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useProtegerAdmin } from '../../src/lib/useProtegerAdmin';
import NavAdmin from './_nav';
import type { Tables } from '../../src/lib/database.types';

type RestauranteConDetalles = Tables<'restaurantes'> & {
  email_dueño: string | null;
  cantidad_mesas: number;
};

export default function AdminRestaurantes() {
  const { verificando } = useProtegerAdmin();
  const [restaurantes, setRestaurantes] = useState<RestauranteConDetalles[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurantes', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar los restaurantes.');
      setRestaurantes(data.restaurantes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los restaurantes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      await cargar();
    };
    inicializar();
  }, [cargar]);

  async function eliminar(id: string, nombre: string) {
    setError('');
    if (
      !window.confirm(
        `¿Eliminar "${nombre}"? Se borrarán sus mesas, peticiones y la cuenta del dueño.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/restaurantes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      cargar();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo eliminar el restaurante.');
    }
  }

  if (verificando) return <div className="p-10 text-center">Verificando acceso...</div>;
  if (cargando) return <div className="p-10 text-center">Cargando restaurantes...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="lista" />

      <main className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Restaurantes</h1>
          <Link
            href="/admin/nuevo"
            className="px-5 py-2.5 bg-[var(--t-primario)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            + Nuevo restaurante
          </Link>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        {restaurantes.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">
            Todavía no hay restaurantes. Creá el primero.
          </p>
        ) : (
          <ul className="space-y-4">
            {restaurantes.map((r) => (
              <li
                key={r.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-bold text-gray-800">{r.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {r.email_dueño ?? 'Sin dueño asignado'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.cantidad_mesas} mesa(s) · Creado el{' '}
                    {new Date(r.creado_en).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/admin/${r.id}`}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/admin/${r.id}/mesas`}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Mesas
                  </Link>
                  <button
                    onClick={() => eliminar(r.id, r.nombre)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}