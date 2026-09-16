'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase';
import type { TablesUpdate } from '../../../../src/lib/database.types';
import { useProtegerRestaurante } from '../../../../src/lib/useProtegerRestaurante';
import NavDashboard from '../_nav';

const LOGO_SUGERIDO = '/logo.png';

export default function ConfiguracionRestaurante({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerRestaurante(restauranteID);

  const [nombre, setNombre] = useState('');
  const [urlCarta, setUrlCarta] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoNuevo, setLogoNuevo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quitarLogo, setQuitarLogo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarConfiguracion = async () => {
      const { data } = await supabase
        .from('restaurantes')
        .select('nombre, url_carta, logo_url')
        .eq('id', restauranteID)
        .single();

      if (data) {
        setNombre(data.nombre ?? '');
        setUrlCarta(data.url_carta ?? '');
        setLogoUrl(data.logo_url ?? null);
      }
      setCargando(false);
    };

    cargarConfiguracion();
  }, [restauranteID]);

  function elegirLogo(archivo: File | null) {
    setError('');
    setQuitarLogo(false);
    setLogoNuevo(null);
    setPreview(null);

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (PNG, JPG, WebP...).');
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2 MB.');
      return;
    }

    setLogoNuevo(archivo);
    setPreview(URL.createObjectURL(archivo));
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    setMensaje('');

    const cambios: TablesUpdate<'restaurantes'> = {
      nombre: nombre.trim() || 'Mi Restaurante',
      url_carta: urlCarta.trim() || null,
    };

    let nuevaLogoUrl: string | null | undefined;
    if (logoNuevo) {
      const rutaLogo = `${restauranteID}/logo`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(rutaLogo, logoNuevo, { upsert: true, cacheControl: '3600' });

      if (uploadError) {
        setError('No se pudo subir el logo. Intentalo de nuevo.');
        setGuardando(false);
        return;
      }

      nuevaLogoUrl = supabase.storage.from('logos').getPublicUrl(rutaLogo).data.publicUrl;
      cambios.logo_url = nuevaLogoUrl;
    } else if (quitarLogo) {
      cambios.logo_url = null;
    }

    const { error: restError } = await supabase
      .from('restaurantes')
      .update(cambios)
      .eq('id', restauranteID);

    if (restError) {
      setError('No se pudo guardar la configuración.');
    } else {
      if (nuevaLogoUrl !== undefined) setLogoUrl(nuevaLogoUrl);
      setLogoNuevo(null);
      setPreview(null);
      setQuitarLogo(false);
      setMensaje('✅ Configuración guardada.');
      setTimeout(() => setMensaje(''), 3000);
    }
    setGuardando(false);
  }

  if (verificando || cargando) return <div className="p-10 text-center">Cargando configuración...</div>;

  const logoVisto = preview ?? logoUrl ?? LOGO_SUGERIDO;
  const logoDeMarca = preview ?? logoUrl;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavDashboard restauranteID={restauranteID} actual="configuracion" />

      <main className="max-w-2xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración del restaurante</h1>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
        {mensaje && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{mensaje}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo del local</label>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoVisto}
                alt="Logo del restaurante"
                className="h-22 sm:h-28 rounded-xl border border-gray-200 object-contain bg-white"
              />
              <label className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Subir logo"
                  onChange={(e) => elegirLogo(e.target.files?.[0] ?? null)}
                />
              </label>
              {logoDeMarca && !quitarLogo && !logoNuevo && (
                <button
                  type="button"
                  onClick={() => {
                    setQuitarLogo(true);
                    setLogoNuevo(null);
                    setPreview(null);
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Quitar logo
                </button>
              )}
              {quitarLogo && (
                <button
                  type="button"
                  onClick={() => setQuitarLogo(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Cancelar quitar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              El logo es lo único personalizable por local: si no hay, el comensal ve el nombre. Imagen de hasta 2 MB.
            </p>
            {quitarLogo && (
              <p className="text-xs font-medium text-red-600 mt-1">Se quitará el logo al guardar cambios.</p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label htmlFor="nombreLocal" className="block text-sm font-medium text-gray-700 mb-1">Nombre del local</label>
            <input
              id="nombreLocal"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="cartaDigital" className="block text-sm font-medium text-gray-700 mb-1">URL de la carta digital</label>
            <input
              id="cartaDigital"
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