'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

/**
 * Verifica que haya una sesión activa Y que el usuario logueado
 * sea el dueño del restauranteID que está pidiendo la página.
 * Si algo falla, redirige a /login.
 *
 * Uso dentro de un componente 'use client':
 *   const { verificando } = useProtegerRestaurante(restauranteID);
 *   if (verificando) return <Cargando />;
 */
export function useProtegerRestaurante(restauranteID: string) {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function verificar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: restaurante } = await supabase
        .from('restaurantes')
        .select('id')
        .eq('usuario_id', session.user.id)
        .eq('id', restauranteID)
        .single();

      if (!vigente) return;

      if (!restaurante) {
        // El usuario está logueado, pero no es dueño de ESTE restaurante
        router.replace('/login');
        return;
      }

      setVerificando(false);
    }

    verificar();

    return () => {
      vigente = false;
    };
  }, [restauranteID, router]);

  return { verificando };
}
