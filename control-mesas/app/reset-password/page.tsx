'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { esSesionRecovery, urlConRecuperacion } from '../../src/lib/utils';

// Este flujo usa un cliente con `flowType: 'implicit'` en vez del cliente
// global (@supabase/ssr fuerza PKCE). Los links de recuperación PKCE solo
// funcionan en el mismo navegador donde se pidieron (el code verifier queda
// guardado ahí). Con el flujo implícito los tokens viajan en la URL y el link
// abre bien en cualquier navegador/dispositivo.
const supabaseRecovery = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: 'implicit' } }
);

// Se captura el hash antes de que supabase.js lo limpie al procesar la URL.
const hashInicial = typeof window !== 'undefined' ? window.location.hash : '';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [existeSesionRecovery, setExisteSesionRecovery] = useState(false);
  const [emailSesion, setEmailSesion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabaseRecovery.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setExisteSesionRecovery(true);
          setEmailSesion(session?.user.email ?? '');
        }
      }
    );

    // Si el hash trae type=recovery venimos de un link de recuperación, o la
    // sesión ya guardada tiene claim amr "recovery".
    supabaseRecovery.auth.getSession().then(({ data }) => {
      if (esSesionRecovery(data.session) || urlConRecuperacion(hashInicial)) {
        setExisteSesionRecovery(true);
      }
      setEmailSesion(data.session?.user.email ?? '');
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/reset-password`;
    const { error: resetError } = await supabaseRecovery.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMensaje('✅ Si la cuenta existe, te enviamos un link para cambiar la contraseña.');
    }
    setCargando(false);
  }

  async function guardarNuevaPassword(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { error: updateError } = await supabaseRecovery.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setCargando(false);
      return;
    }

    setMensaje('✅ Contraseña actualizada. Ya podés iniciar sesión.');
    setCargando(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {existeSesionRecovery ? 'Nueva contraseña' : 'Recuperar contraseña'}
        </h1>

        {mensaje && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{mensaje}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        {existeSesionRecovery ? (
          <form onSubmit={guardarNuevaPassword} className="space-y-4">
            {emailSesion && (
              <p className="text-sm text-gray-500 text-center">
                Vas a cambiar la contraseña de <span className="font-semibold text-gray-700">{emailSesion}</span>
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
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
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={enviarLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}