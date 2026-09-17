'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';
import NavDashboard from '../_nav';
import type { Tables } from '../../../../src/lib/database.types';

type Sucursal = Tables<'sucursales'>;

export default function PanelSucursales({
  restauranteID,
  sucursales,
  conteoMesas,
}: {
  restauranteID: string;
  sucursales: Sucursal[];
  conteoMesas: Record<string, number>;
}) {
  const router = useRouter();
  const [nombres, setNombres] = useState<Record<string, string>>(
    Object.fromEntries(sucursales.map((s) => [s.id, s.nombre]))
  );
  const [nombreNueva, setNombreNueva] = useState('');
  const [mesasNueva, setMesasNueva] = useState('0');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function renombrar(s: Sucursal) {
    setError('');
    const nuevo = nombres[s.id]?.trim();
    if (!nuevo || nuevo === s.nombre) return;

    const { error: errRenombrar } = await supabase
      .from('sucursales')
      .update({ nombre: nuevo })
      .eq('id', s.id);

    if (errRenombrar) {
      setError('No se pudo renombrar la sucursal.');
    } else {
      setMensaje('✅ Nombre actualizado.');
      setTimeout(() => setMensaje(''), 2500);
      router.refresh();
    }
  }

  async function crearSucursal() {
    setError('');
    setCreando(true);

    const nombre = nombreNueva.trim() || `Sucursal ${sucursales.length + 1}`;
    const cantidadMesas = Number(mesasNueva);

    const { data: nueva, error: errCrear } = await supabase
      .from('sucursales')
      .insert({ restaurante_id: restauranteID, nombre })
      .select('id')
      .single();

    if (errCrear) {
      setError('No se pudo crear la sucursal.');
      setCreando(false);
      return;
    }

    if (Number.isInteger(cantidadMesas) && cantidadMesas > 0) {
      const filas = Array.from({ length: cantidadMesas }, (_, i) => ({
        restaurante_id: restauranteID,
        sucursal_id: nueva.id,
        numero: i + 1,
        estado: 'libre',
      }));
      const { error: errMesas } = await supabase.from('mesas').insert(filas);
      if (errMesas) console.error('No se pudieron crear las mesas iniciales:', errMesas.message);
    }

    setCreando(false);
    setNombreNueva('');
    setMesasNueva('0');
    setMensaje('✅ Sucursal creada.');
    setTimeout(() => setMensaje(''), 2500);
    router.refresh();
  }

  async function eliminar(s: Sucursal) {
    setError('');
    if (
      !window.confirm(
        `¿Eliminar la sucursal "${s.nombre}"? Se borrarán sus mesas, peticiones y sesiones.`
      )
    ) {
      return;
    }

    const { error: errEliminar } = await supabase.rpc('eliminar_sucursal', {
      p_sucursal_id: s.id,
    });

    if (errEliminar) {
      setError(errEliminar.message ?? 'No se pudo eliminar la sucursal.');
    } else {
      setMensaje('✅ Sucursal eliminada.');
      setTimeout(() => setMensaje(''), 2500);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavDashboard restauranteID={restauranteID} actual="sucursales" />

      <main className="max-w-2xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
        {mensaje && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{mensaje}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Tus locales</h2>

          {sucursales.length === 0 ? (
            <p className="text-gray-400 text-center italic">Esta marca todavía no tiene sucursales.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sucursales.map((s) => (
                <li key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 flex-1">
                    Sucursal
                    <input
                      type="text"
                      value={nombres[s.id] ?? ''}
                      onChange={(e) => setNombres((n) => ({ ...n, [s.id]: e.target.value }))}
                      className="block w-full mt-1 p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
                    />
                  </label>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {conteoMesas[s.id] ?? 0} mesa(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => renombrar(s)}
                      disabled={!(nombres[s.id]?.trim()) || nombres[s.id]?.trim() === s.nombre}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => eliminar(s)}
                      disabled={sucursales.length <= 1}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                      title={sucursales.length <= 1 ? 'No se puede eliminar la única sucursal' : ''}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Agregar sucursal</h2>

          <div>
            <label htmlFor="nombreSucursal" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="nombreSucursal"
              type="text"
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
              placeholder={`Ej: Sucursal ${sucursales.length + 1}`}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="mesasSucursal" className="block text-sm font-medium text-gray-700 mb-1">
              Mesas iniciales (opcional)
            </label>
            <input
              id="mesasSucursal"
              type="number"
              min={0}
              max={100}
              value={mesasNueva}
              onChange={(e) => setMesasNueva(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se crearán automáticamente las mesas numeradas del 1 al N. Podés agregar más después desde la pantalla de QRs.
            </p>
          </div>

          <button
            onClick={crearSucursal}
            disabled={creando}
            className="w-full py-3 bg-[var(--t-secundario)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-400"
          >
            {creando ? 'Creando...' : 'Crear sucursal'}
          </button>
        </section>
      </main>
    </div>
  );
}