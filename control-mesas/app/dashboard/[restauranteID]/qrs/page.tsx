'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase';
import { useProtegerRestaurante } from '../../../../src/lib/useProtegerRestaurante';
import NavDashboard from '../_nav';
import type { Tables } from '../../../../src/lib/database.types';
import { QRCodeSVG } from 'qrcode.react';

type Mesa = Tables<'mesas'>;

export default function GeneradorQRs({ params }: { params: Promise<{ restauranteID: string }> }) {
  const { restauranteID } = use(params);
  const { verificando } = useProtegerRestaurante(restauranteID);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [urlBase] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  const [urlCarta, setUrlCarta] = useState('');
  const [guardandoCarta, setGuardandoCarta] = useState(false);
  const [mensajeCarta, setMensajeCarta] = useState('');

  const cargarMesas = useCallback(async () => {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .order('numero');
    
    if (data) setMesas(data);
    setCargando(false);
  }, [restauranteID]);

  const cargarUrlCarta = useCallback(async () => {
    const { data } = await supabase
      .from('restaurantes')
      .select('url_carta')
      .eq('id', restauranteID)
      .single();

    if (data?.url_carta) setUrlCarta(data.url_carta);
  }, [restauranteID]);

  useEffect(() => {
    const inicializar = async () => {
      await cargarMesas();
      await cargarUrlCarta();
    };
    inicializar();
  }, [cargarMesas, cargarUrlCarta]);

  async function guardarUrlCarta() {
    setGuardandoCarta(true);
    setMensajeCarta('');

    const url = urlCarta.trim();

    const { error } = await supabase
      .from('restaurantes')
      .update({ url_carta: url || null })
      .eq('id', restauranteID);

    if (error) {
      setMensajeCarta('❌ No se pudo guardar.');
    } else {
      setMensajeCarta('✅ Carta actualizada.');
      setTimeout(() => setMensajeCarta(''), 3000);
    }
    setGuardandoCarta(false);
  }

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
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Agregar Mesa {mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            🖨️ Imprimir QRs
          </button>
        </div>
      </div>

      {/* Carta digital configurable (Oculta al imprimir) */}
      <div className="print:hidden max-w-4xl mx-auto mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Carta Digital</h2>
        <p className="text-gray-500 text-sm mb-4">
          Si tu restaurante tiene una carta digital, pega su URL aquí. El QR mostrará el botón
          &quot;Ver Carta Digital&quot; al comensal. Déjalo vacío si el QR solo debe servir para el sistema de mozos.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://tucarta.ejemplo.com/menu"
            value={urlCarta}
            onChange={(e) => setUrlCarta(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all"
          />
          <button
            onClick={guardarUrlCarta}
            disabled={guardandoCarta}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {guardandoCarta ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        {mensajeCarta && <p className="mt-3 text-sm font-medium text-gray-700">{mensajeCarta}</p>}
      </div>

      {/* Grilla de QRs (Optimizada para impresión) */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-8">
        {mesas.map((mesa) => {
          const urlQR = `${urlBase}/m/${mesa.id}`;
          
          return (
            <div key={mesa.id} className="bg-white p-6 rounded-2xl border-2 border-gray-200 flex flex-col items-center text-center shadow-sm break-inside-avoid print:shadow-none print:border-gray-400">
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