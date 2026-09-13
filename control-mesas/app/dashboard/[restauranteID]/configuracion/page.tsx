'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase';
import { useProtegerRestaurante } from '../../../../src/lib/useProtegerRestaurante';
import NavDashboard from '../_nav';

export default function ConfiguracionRestaurante({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerRestaurante(restauranteID);

  const [nombre, setNombre] = useState('');
  const [urlCarta, setUrlCarta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarConfiguracion = async () => {
      const { data } = await supabase
        .from('restaurantes')
        .select('nombre, url_carta')
        .eq('id', restauranteID)
        .single();

      if (data) {
        setNombre(data.nombre ?? '');
        setUrlCarta(data.url_carta ?? '');
      }
      setCargando(false);
    };

    cargarConfiguracion();
  }, [restauranteID]);

  async function guardar() {
    setGuardando(true);
    setError('');
    setMensaje('');

    const { error: restError } = await supabase
      .from('restaurantes')
      .update({ nombre: nombre.trim() || 'Mi Restaurante', url_carta: urlCarta.trim() || null })
      .eq('id', restauranteID);

    if (restError) {
      setError('No se pudo guardar la configuración.');
    } else {
      setMensaje('✅ Configuración guardada.');
      setTimeout(() => setMensaje(''), 3000);
    }
    setGuardando(false);
  }

  if (verificando || cargando) return <div className="p-10 text-center">Cargando configuración...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavDashboard restauranteID={restauranteID} actual="configuracion" />

      <main className="max-w-2xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración del restaurante</h1>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
        {mensaje && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{mensaje}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del local</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de la carta digital</label>
            <input
              type="url"
              value={urlCarta}
              onChange={(e) => setUrlCarta(e.target.value)}
              placeholder="https://tucarta.ejemplo.com/menu"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si se define, el comensal ve el botón &quot;Ver Carta Digital&quot; en su pantalla. Vacío = QR solo para mozos.
            </p>
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="px-6 py-3 bg-[var(--t-secundario)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-400"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </section>
      </main>
    </div>
  );
}