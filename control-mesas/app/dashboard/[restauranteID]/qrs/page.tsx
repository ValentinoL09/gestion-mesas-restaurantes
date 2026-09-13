'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase';
import { useProtegerRestaurante } from '../../../../src/lib/useProtegerRestaurante';
import NavDashboard from '../_nav';
import { useTema } from '../_tema';
import { urlMesaQR } from '../../../../src/lib/utils';
import type { Tables } from '../../../../src/lib/database.types';
import { QRCodeSVG } from 'qrcode.react';

type Mesa = Tables<'mesas'>;

export default function GeneradorQRs({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerRestaurante(restauranteID);
  const tema = useTema();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [urlBase] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  const cargarMesas = useCallback(async () => {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .order('numero');
    
    if (data) setMesas(data);
    setCargando(false);
  }, [restauranteID]);

  useEffect(() => {
    const inicializar = async () => {
      await cargarMesas();
    };
    inicializar();
  }, [cargarMesas]);

  async function agregarMesa() {
    const siguienteNumero = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1;
    
    const { error } = await supabase
      .from('mesas')
      .insert({ restaurante_id: restauranteID, numero: siguienteNumero, estado: 'libre' });
      
    if (error) {
      console.error("Error al agregar mesa:", JSON.stringify(error, null, 2));
    } else {
      cargarMesas();
    }
  }

  if (verificando) return <div className="p-10 text-center">Verificando acceso...</div>;
  if (cargando) return <div className="p-10 text-center">Cargando QRs...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavDashboard restauranteID={restauranteID} actual="qrs" />
      <div className="p-8">
      
      {/* Controles (Ocultos al imprimir) */}
      <div className="print:hidden max-w-4xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Generador de QRs</h1>
          <p className="text-gray-500 text-sm mt-1">Crea nuevas mesas o imprime la hoja (Ctrl + P).</p>
        </div>
        <div className="space-x-4">
          <button 
            onClick={agregarMesa}
            className="px-6 py-3 bg-[var(--t-primario)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            + Agregar Mesa {mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-[var(--t-secundario)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            Imprimir QRs
          </button>
        </div>
      </div>

      {/* Grilla de QRs (Optimizada para impresión) */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-8">
        {mesas.map((mesa) => {
          const urlQR = urlMesaQR(urlBase, mesa.id);
          
          return (
            <div key={mesa.id} className="bg-white p-6 rounded-2xl border-2 border-gray-200 flex flex-col items-center text-center shadow-sm break-inside-avoid print:shadow-none print:border-gray-400">
              <h2 className="text-xs font-bold tracking-widest text-[var(--t-primario)] uppercase mb-1">{tema.nombre}</h2>
              <h2 className="text-3xl font-black text-gray-800 mb-4">MESA {mesa.numero}</h2>
              
              <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4">
                <QRCodeSVG value={urlQR} size={150} level="H" includeMargin={false} />
              </div>
              
              <p className="text-xs text-gray-400 truncate w-full" title={urlQR}>
                Escanear para acceder
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}