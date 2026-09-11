'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface Mesa {
  id: string;
  numero: number;
}

interface Peticion {
  id: string;
  mesa_id: string;
  tipo: 'llamar_mozo' | 'pedir_cuenta';
  estado: string;
  creado_en: string;
}

export default function DashboardStaff({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());

  const cargarDatos = useCallback(async () => {
    // 1. Buscar mesas
    const { data: mesasData } = await supabase
      .from('mesas')
      .select('id, numero')
      .eq('restaurante_id', restauranteID)
      .order('numero');
    
    if (mesasData) setMesas(mesasData);

    // 2. Buscar peticiones pendientes (¡Corregido a creado_en!)
    const { data: peticionesData, error } = await supabase
      .from('peticiones')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: true });
    
    if (error) console.error("Error cargando peticiones:", error);
    if (peticionesData) setPeticiones(peticionesData);
    
    setCargando(false);
  }, [restauranteID]);

  useEffect(() => {
    cargarDatos();

    const intervaloReloj = setInterval(() => setHoraActual(new Date()), 60000);

    const canal = supabase
      .channel('control-mesas')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'peticiones',
        filter: `restaurante_id=eq.${restauranteID}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          try { new Audio('/alerta.mp3').play().catch(() => {}); } catch (e) { }
        }
        cargarDatos();
      })
      .subscribe();

    return () => {
      clearInterval(intervaloReloj);
      supabase.removeChannel(canal);
    };
  }, [cargarDatos, restauranteID]);

  async function marcarAtendido(peticionId: string) {
    const { error } = await supabase
      .from('peticiones')
      .update({ estado: 'atendida' })
      .eq('id', peticionId);
      
    if (error) {
      console.error("Error al marcar como atendido:", error);
    } else {
      cargarDatos(); 
    }
  }

  async function liberarMesa(mesaId: string) {
    const { error } = await supabase
      .from('peticiones')
      .update({ estado: 'atendida' })
      .eq('mesa_id', mesaId)
      .eq('estado', 'pendiente');
      
    if (error) {
      console.error("Error al liberar la mesa:", error);
    } else {
      cargarDatos(); 
    }
  }

  const minutosTranscurridos = (fechaIso: string) => {
    const dif = Math.floor((horaActual.getTime() - new Date(fechaIso).getTime()) / 60000);
    return dif < 1 ? 'ahora' : `hace ${dif} min`;
  };

  if (cargando) return <div className="p-10 text-center">Cargando tablero...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 p-4 flex flex-col h-auto md:h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Cola de Pedidos</h2>
        
        {peticiones.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">Sin pedidos pendientes</p>
        ) : (
          <div className="space-y-4">
            {peticiones.map(pet => {
              const mesa = mesas.find(m => m.id === pet.mesa_id);
              const esCuenta = pet.tipo === 'pedir_cuenta';
              
              return (
                <div key={pet.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${esCuenta ? 'border-green-500' : 'border-yellow-400'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">Mesa {mesa?.numero || '?'}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {minutosTranscurridos(pet.creado_en)}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700 mb-4">
                    {esCuenta ? '💳 Pide la cuenta' : '👋 Llama al mozo'}
                  </p>
                  <button 
                    onClick={() => marcarAtendido(pet.id)}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Marcar Atendido
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <main className="flex-1 p-6 md:p-10 bg-gray-50 h-auto md:h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Mapa del Local</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mesas.map(mesa => {
            const pedidosMesa = peticiones.filter(p => p.mesa_id === mesa.id);
            const pideCuenta = pedidosMesa.some(p => p.tipo === 'pedir_cuenta');
            const llamaMozo = pedidosMesa.some(p => p.tipo === 'llamar_mozo');
            
            let colorFondo = 'bg-white border-gray-200';
            let animacion = '';
            
            if (pideCuenta) {
              colorFondo = 'bg-green-100 border-green-400';
              animacion = 'animate-pulse';
            } else if (llamaMozo) {
              colorFondo = 'bg-yellow-100 border-yellow-400';
              animacion = 'animate-pulse';
            }

            return (
              <div key={mesa.id} className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 shadow-sm transition-all duration-300 ${colorFondo} ${animacion}`}>
                <span className="text-4xl font-black text-gray-800 mb-2">{mesa.numero}</span>
                
                {pedidosMesa.length > 0 ? (
                  <div className="flex gap-2">
                    {llamaMozo && <span className="text-xl" title="Llamando al mozo">👋</span>}
                    {pideCuenta && <span className="text-xl" title="Pidiendo cuenta">💳</span>}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Libre</span>
                )}

                {pedidosMesa.length === 0 && (
                  <button 
                    onClick={() => liberarMesa(mesa.id)}
                    className="absolute bottom-2 text-xs text-gray-400 hover:text-gray-700 underline"
                  >
                    Liberar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

    </div>
  );
}