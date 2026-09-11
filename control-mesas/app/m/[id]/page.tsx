'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

export default function PantallaComensal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Estados para guardar los datos de la mesa y controlar la interfaz
  const [mesa, setMesa] = useState<{ numero: number; restaurante_id: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  // 1. Buscar los datos de la mesa cuando carga la página
  useEffect(() => {
    async function cargarMesa() {
      const { data, error } = await supabase
        .from('mesas')
        .select('numero, restaurante_id')
        .eq('id', id)
        .single();
      
      if (data) {
        setMesa(data);
      } else {
        console.error("Error cargando mesa:", error);
      }
      setCargando(false);
    }
    cargarMesa();
  }, [id]);

  // 2. Función para enviar el pedido al mozo
  async function enviarPeticion(tipo: 'llamar_mozo' | 'pedir_cuenta') {
    if (!mesa) return;
    
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
      console.error(error);
    } else {
      setMensaje('¡Tu mozo está en camino!');
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setMensaje(''), 3000);
    }
  }

  // Pantalla de carga mientras busca el número de mesa
  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando mesa...</div>;
  }

  // Si el ID es incorrecto y no encontró la mesa
  if (!mesa) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Mesa no encontrada </div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 text-center">
        
        {/* Encabezado Dinámico */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Mesa {mesa.numero}</h1>
          <p className="text-gray-500">¿En qué podemos ayudarte?</p>
        </div>

        {/* Feedback visual para el usuario */}
        {mensaje && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
            {mensaje}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="space-y-4 pt-4">
          <button className="w-full py-4 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors shadow-md">
            Ver Carta Digital
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">O solicita asistencia</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={() => enviarPeticion('llamar_mozo')}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md active:scale-95"
          >
            Llamar al Mozo
          </button>

          <button 
            onClick={() => enviarPeticion('pedir_cuenta')}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors shadow-md active:scale-95"
          >
            Pedir la Cuenta
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-6">
          ID seguro: {id.slice(0, 8)}...
        </p>
      </div>
    </main>
  );
}