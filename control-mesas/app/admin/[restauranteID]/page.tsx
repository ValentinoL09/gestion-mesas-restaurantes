'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProtegerAdmin } from '../../../src/lib/useProtegerAdmin';
import NavAdmin from '../_nav';
import type { Tables } from '../../../src/lib/database.types';

type Restaurante = Tables<'restaurantes'>;

export default function AdminDetalle({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerAdmin();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [urlCarta, setUrlCarta] = useState('');
  const [colorPrimario, setColorPrimario] = useState('#2563eb');
  const [colorSecundario, setColorSecundario] = useState('#0a0a0a');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoNuevo, setLogoNuevo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/restaurantes/${restauranteID}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar el restaurante.');

      const r: Restaurante = data.restaurante;
      setNombre(r.nombre ?? '');
      setUrlCarta(r.url_carta ?? '');
      setColorPrimario(r.color_primario ?? '#2563eb');
      setColorSecundario(r.color_secundario ?? '#0a0a0a');
      setLogoUrl(r.logo_url ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el restaurante.');
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

  function elegirLogo(archivo: File | null) {
    setError('');
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

    let nuevaLogoUrl: string | null = null;

    if (logoNuevo) {
      const formData = new FormData();
      formData.append('logo', logoNuevo);

      const logoRes = await fetch(`/api/admin/restaurantes/${restauranteID}/logo`, {
        method: 'POST',
        body: formData,
      });
      const logoData = await logoRes.json();

      if (!logoRes.ok) {
        setError(logoData.error || 'No se pudo subir el logo.');
        setGuardando(false);
        return;
      }
      nuevaLogoUrl = logoData.logo_url;
    }

    const res = await fetch(`/api/admin/restaurantes/${restauranteID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre.trim() || 'Mi Restaurante',
        url_carta: urlCarta.trim() || null,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        ...(logoNuevo ? { logo_url: nuevaLogoUrl } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'No se pudo guardar la configuración.');
    } else {
      if (logoNuevo && nuevaLogoUrl) setLogoUrl(nuevaLogoUrl);
      setLogoNuevo(null);
      setPreview(null);
      setMensaje('✅ Configuración guardada.');
      setTimeout(() => setMensaje(''), 3000);
    }
    setGuardando(false);
  }

  async function eliminar() {
    setError('');
    if (
      !window.confirm(
        `¿Eliminar "${nombre}"? Se borrarán sus mesas, peticiones y la cuenta del dueño.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/restaurantes/${restauranteID}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo eliminar el restaurante.');
    }
  }

  if (verificando || cargando) return <div className="p-10 text-center">Cargando...</div>;

  const logoVisto = preview ?? logoUrl ?? '/logo.png';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="detalle" volverA="/admin" />

      <main className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">{nombre}</h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/${restauranteID}/mesas`}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Gestionar mesas
            </Link>
            <button
              onClick={eliminar}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Eliminar restaurante
            </button>
          </div>
        </div>

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
                className="w-16 h-16 rounded-xl border border-gray-200 object-contain bg-white"
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
            </div>
            <p className="text-xs text-gray-400 mt-2">Imagen de hasta 2 MB.</p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label htmlFor="nombreLocal" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del local
            </label>
            <input
              id="nombreLocal"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="cartaDigital" className="block text-sm font-medium text-gray-700 mb-1">
              URL de la carta digital
            </label>
            <input
              id="cartaDigital"
              type="url"
              value={urlCarta}
              onChange={(e) => setUrlCarta(e.target.value)}
              placeholder="https://tucarta.ejemplo.com/menu"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="colorPrimario" className="block text-sm font-medium text-gray-700 mb-1">
                Color principal
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="colorPrimario"
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer"
                />
                <input
                  type="text"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all font-mono"
                />
              </div>
            </div>
            <div>
              <label htmlFor="colorSecundario" className="block text-sm font-medium text-gray-700 mb-1">
                Color secundario
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="colorSecundario"
                  type="color"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer"
                />
                <input
                  type="text"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all font-mono"
                />
              </div>
            </div>
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