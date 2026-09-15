'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'next/navigation';
import { esAdmin } from '../../src/lib/admin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');

    // 1. Validar credenciales con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Correo o contraseña incorrectos.');
      setCargando(false);
      return;
    }

    // 1.5 Cuenta de administrador: va al panel de admin, no a un restaurante.
    if (esAdmin(authData.user.email)) {
      router.push('/admin');
      return;
    }

    // 2. Buscar el restaurante asociado al usuario (puede tener varios)
    const { data: restaurantes, error: restError } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('usuario_id', authData.user.id)
      .order('creado_en');

    if (restError) {
      setError('Ocurrió un error al cargar tus restaurantes.');
      setCargando(false);
      return;
    }

    if (!restaurantes || restaurantes.length === 0) {
      // La cuenta existe pero todavía no tiene restaurante: ir al onboarding.
      router.push('/configurar-restaurante');
      return;
    }

    if (restaurantes.length === 1) {
      // Una sola marca: ir directo a su panel.
      router.push(`/dashboard/${restaurantes[0].id}`);
      return;
    }

    // Varias marcas: dejar que el usuario elija cuál abrir.
    router.push('/configurar-restaurante');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Acceso al Panel</h1>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="emailLogin" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              id="emailLogin"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required 
            />
          </div>
          
          <div>
            <label htmlFor="passwordLogin" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              id="passwordLogin"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={cargando}
            className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/reset-password" className="text-blue-600 hover:underline font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </main>
  );
}