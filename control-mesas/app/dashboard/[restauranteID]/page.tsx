'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useProtegerRestaurante } from '../../../src/lib/useProtegerRestaurante';
import NavDashboard from './_nav';
import { minutosTranscurridos, etiquetaCuenta } from '../../../src/lib/utils';
import type { Tables } from '../../../src/lib/database.types';

export default function DashboardStaff({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerRestaurante(restauranteID);

  const [mesas, setMesas] = useState<Tables<'mesas'>[]>([]);
  const [peticiones, setPeticiones] = useState<Tables<'peticiones'>[]>([]);
  const [cargando, setCargando] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());
  const [errorLiberar, setErrorLiberar] = useState('');

  const cargarDatos = useCallback(async () => {
    // 1. Buscar mesas (Ahora también pedimos la columna 'estado')
    const { data: mesasData } = await supabase
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .order('numero');
    
    if (mesasData) setMesas(mesasData);

    // 2. Buscar peticiones pendientes
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
    const inicializar = async () => {
      await cargarDatos();
    };
    inicializar();

    const intervaloReloj = setInterval(() => setHoraActual(new Date()), 60000);

    // 3. Magia en Vivo: Escuchamos peticiones Y el estado de las mesas
    const canal = supabase
      .channel('control-mesas')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'peticiones',
        filter: `restaurante_id=eq.${restauranteID}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          try { new Audio('/alerta.mp3').play().catch(() => {}); } catch { }
        }
        cargarDatos();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'mesas',
        filter: `restaurante_id=eq.${restauranteID}` // Escuchamos cuando la mesa cambia a ocupada/libre
      }, () => {
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
      
    if (error) console.error("Error al marcar como atendido:", error);
    else cargarDatos(); 
  }

  // Libera la mesa de forma ATÓMICA vía RPC transaccional:
  // marca peticiones atendidas + cierra sesiones + pasa la mesa a 'libre'.
  async function liberarMesa(mesaId: string) {
    setErrorLiberar('');
    const { error } = await supabase.rpc('liberar_mesa', { p_mesa_id: mesaId });

    if (error) {
      console.error("Error al liberar la mesa:", error);
      setErrorLiberar('No se pudo liberar la mesa. Intenta de nuevo.');
    } else {
      await cargarDatos();
    }
  }

  if (verificando) return <div className="p-10 text-center">Verificando acceso...</div>;
  if (cargando) return <div className="p-10 text-center">Cargando tablero...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <NavDashboard restauranteID={restauranteID} actual="tablero" />
      <div className="flex flex-col md:flex-row">
      
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
                      {minutosTranscurridos(pet.creado_en, horaActual)}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700 mb-4">
                    {esCuenta ? etiquetaCuenta(pet.metodo_pago) : '👋 Llama al mozo'}
                  </p>
                  <button 
                    onClick={() => marcarAtendido(pet.id)}
                    className="w-full py-2 bg-[var(--t-secundario)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity"
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mapa del Local</h1>
        </div>

        {errorLiberar && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{errorLiberar}</div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mesas.map(mesa => {
            const pedidosMesa = peticiones.filter(p => p.mesa_id === mesa.id);
            const pideCuenta = pedidosMesa.some(p => p.tipo === 'pedir_cuenta');
            const llamaMozo = pedidosMesa.some(p => p.tipo === 'llamar_mozo');
            
            // Colores basados en pedidos O en estado de ocupación
            let colorFondo = 'bg-white border-gray-200';
            let animacion = '';
            
            if (pideCuenta) {
              colorFondo = 'bg-green-100 border-green-400';
              animacion = 'animate-pulse';
            } else if (llamaMozo) {
              colorFondo = 'bg-yellow-100 border-yellow-400';
              animacion = 'animate-pulse';
            } else if (mesa.estado === 'ocupada') {
              // Si la mesa está ocupada pero no llamaron al mozo, se ve grisácea
              colorFondo = 'bg-gray-200 border-gray-400 shadow-inner';
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
                  <span className="text-sm font-medium text-gray-500">
                    {mesa.estado === 'ocupada' ? 'Ocupada' : 'Libre'}
                  </span>
                )}

                {/* Botón de Liberar (Visible si está libre u ocupada sin alertas críticas) */}
                {pedidosMesa.length === 0 && (
                  <button 
                    onClick={() => liberarMesa(mesa.id)}
                    className="absolute bottom-2 text-xs text-gray-500 hover:text-gray-900 hover:font-bold underline transition-all"
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
    </div>
  );
}