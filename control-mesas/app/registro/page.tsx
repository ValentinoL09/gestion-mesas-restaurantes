'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pendienteConfirmacion, setPendienteConfirmacion] = useState(false);
  const router = useRouter();

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre: nombre.trim() || 'Mi Restaurante', nombre_restaurante: nombre.trim() || 'Mi Restaurante' } },
    });

    if (authError) {
      setError(authError.message);
      setCargando(false);
      return;
    }

    if (!data.session) {
      // Confirmación de email activa: esperar a que verifique su correo.
      setPendienteConfirmacion(true);
      setCargando(false);
      return;
    }

    const restauranteNombre = nombre.trim() || 'Mi Restaurante';
    const { data: restaurante, error: restError } = await supabase
      .from('restaurantes')
      .insert({ nombre: restauranteNombre, usuario_id: data.session.user.id })
      .select('id')
      .single();

    if (restError) {
      setError('Cuenta creada, pero no se pudo crear el restaurante. Inicia sesión y completa el registro.');
      setCargando(false);
      router.push('/configurar-restaurante');
      return;
    }

    router.replace(`/dashboard/${restaurante.id}`);
  }

  async function reenviarConfirmacion() {
    setError('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) setError(error.message);
  }

  if (pendienteConfirmacion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <span className="text-5xl">📧</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Revisa tu correo</h1>
          <p className="text-gray-500 text-sm">
            Te enviamos un link de confirmación a <strong className="text-gray-700">{email}</strong>.
            Cuando lo confirmes, entra aquí, inicia sesión y se creará tu restaurante automáticamente.
          </p>
          <button
            onClick={reenviarConfirmacion}
            className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Reenviar confirmación
          </button>
          <div className="mt-4">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Crea tu cuenta</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Configura tu restaurante en menos de un minuto.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label htmlFor="nombreRestaurante" className="block text-sm font-medium text-gray-700 mb-1">Nombre del restaurante</label>
            <input
              id="nombreRestaurante"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Parrilla Don Pedro"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="emailRegistro" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              id="emailRegistro"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="passwordRegistro" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              id="passwordRegistro"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}