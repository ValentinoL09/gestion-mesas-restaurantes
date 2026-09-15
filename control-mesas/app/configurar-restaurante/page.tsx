'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import type { Tables } from '../../src/lib/database.types';

type Restaurante = Tables<'restaurantes'>;

export default function ConfigurarRestaurante() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const router = useRouter();

  const cargarRestaurantes = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/login');
      return;
    }

    const { data } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('usuario_id', sessionData.session.user.id)
      .order('nombre');

    if (data) setRestaurantes(data);
    setCargando(false);
  }, [router]);

  useEffect(() => {
    const inicializar = async () => {
      await cargarRestaurantes();
    };
    inicializar();
  }, [cargarRestaurantes]);

  useEffect(() => {
    if (!cargando && restaurantes.length === 1) {
      router.replace(`/dashboard/${restaurantes[0].id}`);
    }
  }, [cargando, restaurantes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function crearRestaurante() {
    if (!nombre.trim()) {
      setError('Ingresa un nombre para tu restaurante.');
      return;
    }

    setCreando(true);
    setError('');

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/login');
      return;
    }

    const { data: restaurante, error: restError } = await supabase
      .from('restaurantes')
      .insert({ nombre: nombre.trim(), usuario_id: sessionData.session.user.id })
      .select('id')
      .single();

    if (restError) {
      setError('No se pudo crear el restaurante. Intenta de nuevo.');
      setCreando(false);
      return;
    }

    // Toda marca nueva nace con su primera sucursal.
    const { error: sucError } = await supabase
      .from('sucursales')
      .insert({ restaurante_id: restaurante.id, nombre: 'Sucursal 1' });

    if (sucError) {
      console.error('No se pudo crear la sucursal inicial:', sucError.message);
    }

    router.replace(`/dashboard/${restaurante.id}`);
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-10">Verificando acceso...</div>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Tu restaurante</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {restaurantes.length === 0
            ? 'Creá tu primer local para empezar a generar mesas y QRs.'
            : 'Elegí a qué local querés entrar.'}
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        {restaurantes.length > 0 && (
          <div className="space-y-3 mb-6">
            {restaurantes.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/dashboard/${r.id}`)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors"
              >
                <span className="font-semibold text-gray-800">{r.nombre}</span>
                <span className="text-gray-400">→</span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del local</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Parrilla Don Pedro"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all mb-4"
          />
          <button
            onClick={crearRestaurante}
            disabled={creando}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {creando ? 'Creando...' : 'Crear Restaurante'}
          </button>
        </div>
      </div>
    </main>
  );
}