'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { esAdmin } from './admin';

/**
 * Verifica que haya una sesión activa Y que el usuario logueado sea
 * el admin de la plataforma. Si algo falla, redirige a /login.
 *
 * Uso dentro de un componente 'use client':
 *   const { verificando } = useProtegerAdmin();
 *   if (verificando) return <Cargando />;
 */
export function useProtegerAdmin() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function verificar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !esAdmin(session.user.email)) {
        router.replace('/login');
        return;
      }

      if (!vigente) return;

      setVerificando(false);
    }

    verificar();

    return () => {
      vigente = false;
    };
  }, [router]);

  return { verificando };
}