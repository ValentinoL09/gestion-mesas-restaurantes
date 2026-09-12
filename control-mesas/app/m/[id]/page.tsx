'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import type { Tables } from '../../../src/lib/database.types';

export default function PantallaComensal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [mesa, setMesa] = useState<Tables<'mesas'> | null>(null);
  const [urlCarta, setUrlCarta] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  
  // Nuevos estados para la Fase 5
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function inicializarMesa() {
      // 1. Buscar los datos de la mesa
      const { data: mesaData } = await supabase
        .from('mesas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!mesaData) {
        setCargando(false);
        return; 
      }
      setMesa(mesaData);

      // 1b. Carta digital configurable: si el restaurante definió una URL,
      // el comensal puede abrir su carta (si no, el QR es solo para mozos).
      const { data: restaurante } = await supabase
        .from('restaurantes_publico')
        .select('url_carta')
        .eq('id', mesaData.restaurante_id)
        .single();

      if (restaurante?.url_carta) {
        setUrlCarta(restaurante.url_carta);
      }

      // 2. Lógica Anti-QR Fantasma (Sesiones)
      const { data: sesionesActivas } = await supabase
        .from('sesiones_clientes')
        .select('id')
        .eq('mesa_id', id)
        .eq('activa', true)
        .limit(1); 

      const sesionActiva = sesionesActivas?.[0];
      const miToken = localStorage.getItem(`token_mesa_${id}`);

      if (sesionActiva) {
        if (sesionActiva.id !== miToken) {
          setBloqueado(true);
        }
      } else {
        const { data: nuevaSesion } = await supabase
          .from('sesiones_clientes')
          .insert({ mesa_id: id, activa: true })
          .select('id')
          .single();

        if (nuevaSesion) {
          localStorage.setItem(`token_mesa_${id}`, nuevaSesion.id);
          await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', id);
        }
      }
      
      setCargando(false);
    }
    
    inicializarMesa();

    // 3. MAGIA EN VIVO: Escuchar si el mozo nos expulsa
    const canalComensal = supabase
      .channel(`mesa-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'mesas',
        filter: `id=eq.${id}` // Escuchamos cambios específicos en ESTA mesa
      }, (payload) => {
        // Si el mozo pasó la mesa a 'libre', bloqueamos la pantalla del cliente inmediatamente
        if (payload.new.estado === 'libre') {
          setBloqueado(true);
          // Opcional: Borramos su token local para que no quede basura
          localStorage.removeItem(`token_mesa_${id}`); 
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalComensal);
    };
  }, [id]);

  async function enviarPeticion(tipo: 'llamar_mozo' | 'pedir_cuenta') {
    if (!mesa || bloqueado) return;
    
    setMensaje('Enviando...');

    const { error } = await supabase
      .from('peticiones')
      .insert({
        mesa_id: id,
        restaurante_id: mesa.restaurante_id,
        tipo: tipo,
        estado: 'pendiente'
      });

    if (error) {
      setMensaje('❌ Hubo un error al avisar al mozo.');
    } else {
      setMensaje('✅ ¡Tu mozo está en camino!');
      setTimeout(() => setMensaje(''), 3000);
    }
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando mesa...</div>;
  if (!mesa) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Mesa no encontrada 😕</div>;

  // PANTALLA DE BLOQUEO (Si otro cliente ya ocupó la mesa)
  if (bloqueado) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4 border-t-4 border-red-500">
          <span className="text-5xl">🔒</span>
          <h1 className="text-2xl font-bold text-gray-800">Mesa en Uso</h1>
          <p className="text-gray-500 text-sm">
            Esta mesa ya está siendo operada por otro dispositivo. Si crees que es un error, por favor llama al mozo de forma tradicional.
          </p>
        </div>
      </main>
    );
  }

  // PANTALLA NORMAL (Si es mi sesión)
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 text-center">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Mesa {mesa.numero}</h1>
          <p className="text-gray-500">¿En qué podemos ayudarte?</p>
        </div>

        {mensaje && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg font-medium animate-pulse">
            {mensaje}
          </div>
        )}

        <div className="space-y-4 pt-4">
          {urlCarta && (
            <a
              href={urlCarta}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              📖 Ver Carta Digital
            </a>
          )}
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">O solicita asistencia</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={() => enviarPeticion('llamar_mozo')}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md active:scale-95"
          >
            👋 Llamar al Mozo
          </button>

          <button 
            onClick={() => enviarPeticion('pedir_cuenta')}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors shadow-md active:scale-95"
          >
            💳 Pedir la Cuenta
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-6">
          Sesión segura vinculada.
        </p>
      </div>
    </main>
  );
}