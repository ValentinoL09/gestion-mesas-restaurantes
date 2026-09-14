'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useProtegerAdmin } from '../../../../src/lib/useProtegerAdmin';
import NavAdmin from '../../_nav';
import type { Tables } from '../../../../src/lib/database.types';

type Mesa = Tables<'mesas'>;

export default function AdminMesas({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerAdmin();

  const [nombre, setNombre] = useState('');
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [numeros, setNumeros] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [restRes, mesasRes] = await Promise.all([
        fetch(`/api/admin/restaurantes/${restauranteID}`, { cache: 'no-store' }),
        fetch(`/api/admin/restaurantes/${restauranteID}/mesas`, { cache: 'no-store' }),
      ]);

      const restData = await restRes.json();
      const mesasData = await mesasRes.json();

      if (!restRes.ok) throw new Error(restData.error || 'Error al cargar el restaurante.');
      if (!mesasRes.ok) throw new Error(mesasData.error || 'Error al cargar las mesas.');

      setNombre(restData.restaurante?.nombre ?? '');
      setMesas(mesasData.mesas ?? []);
      setNumeros(
        Object.fromEntries(
          (mesasData.mesas ?? []).map((m: Mesa) => [m.id, String(m.numero)])
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar las mesas.');
    } finally {
      setCargando(false);
    }
  }, [restauranteID]);

  useEffect(() => {
    const inicializar = async () => {
      await cargar();
    };
    inicializar();
  }, [cargar]);

  async function agregarMesa() {
    setError('');
    const res = await fetch(`/api/admin/restaurantes/${restauranteID}/mesas`, {
      method: 'POST',
    });

    if (res.ok) {
      cargar();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo agregar la mesa.');
    }
  }

  async function eliminarMesa(mesa: Mesa) {
    setError('');
    if (!window.confirm(`¿Eliminar la mesa ${mesa.numero}?`)) return;

    const res = await fetch(
      `/api/admin/restaurantes/${restauranteID}/mesas/${mesa.id}`,
      { method: 'DELETE' }
    );

    if (res.ok) {
      cargar();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo eliminar la mesa.');
    }
  }

  async function guardarNumero(mesa: Mesa) {
    setError('');
    const nuevoNumero = Number(numeros[mesa.id]);
    if (!Number.isInteger(nuevoNumero) || nuevoNumero < 1) {
      setError('El número de mesa debe ser un entero mayor o igual a 1.');
      return;
    }

    const res = await fetch(`/api/admin/restaurantes/${restauranteID}/mesas/${mesa.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: nuevoNumero }),
    });

    if (res.ok) {
      setMensaje('✅ Mesa renumerada.');
      setTimeout(() => setMensaje(''), 2500);
      cargar();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo renumerar la mesa.');
    }
  }

  if (verificando || cargando) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="detalle" volverA={`/admin/${restauranteID}`} />

      <main className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mesas de {nombre}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Agregá, eliminá o renumerá las mesas del restaurante.
            </p>
          </div>
          <Link
            href={`/admin/${restauranteID}`}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Datos del restaurante
          </Link>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
        {mensaje && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{mensaje}</div>}

        <div className="flex justify-end">
          <button
            onClick={agregarMesa}
            className="px-5 py-2.5 bg-[var(--t-primario)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            + Agregar Mesa
          </button>
        </div>

        {mesas.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-6">Este restaurante no tiene mesas.</p>
        ) : (
          <ul className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {mesas.map((mesa) => (
              <li key={mesa.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      mesa.estado === 'ocupada' ? 'bg-gray-500' : 'bg-green-500'
                    }`}
                    title={mesa.estado === 'ocupada' ? 'Ocupada' : 'Libre'}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Mesa
                    <input
                      type="number"
                      min={1}
                      value={numeros[mesa.id] ?? ''}
                      onChange={(e) =>
                        setNumeros((n) => ({ ...n, [mesa.id]: e.target.value }))
                      }
                      className="inline-block w-20 ml-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none transition-all text-sm"
                    />
                  </label>
                  <span className="text-xs text-gray-400 capitalize">{mesa.estado}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => guardarNumero(mesa)}
                    disabled={Number(numeros[mesa.id]) === mesa.numero}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Guardar Nº
                  </button>
                  <button
                    onClick={() => eliminarMesa(mesa)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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