'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { urlSegura, colorSegura } from '../../../src/lib/utils';
import type { Tables, TablesInsert } from '../../../src/lib/database.types';

type TemaComensal = {
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
};

const TEMA_COMENSAL_DEFAULT: TemaComensal = {
  nombre: 'SmartTable',
  logoUrl: null,
  colorPrimario: '#2563eb',
  colorSecundario: '#0a0a0a',
};

export default function PantallaComensal({
  id,
  mesa,
  restaurante,
  tiposPendientes,
}: {
  id: string;
  mesa: Tables<'mesas'>;
  restaurante: {
    url_carta: string | null;
    url_resenas: string | null;
    logo_url: string | null;
    color_primario: string | null;
    color_secundario: string | null;
    nombre: string | null;
  } | null;
  tiposPendientes: string[];
}) {
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [metodoSeleccionando, setMetodoSeleccionando] = useState(false);
  const [mostrarModalResena, setMostrarModalResena] = useState(false);
  const [tiposPendientesActuales, setTiposPendientesActuales] = useState<Set<string>>(
    new Set(tiposPendientes)
  );

  const urlCarta = urlSegura(restaurante?.url_carta);
  const urlResenas = urlSegura(restaurante?.url_resenas);
  const tema: TemaComensal = {
    nombre: restaurante?.nombre || TEMA_COMENSAL_DEFAULT.nombre,
    logoUrl: urlSegura(restaurante?.logo_url),
    colorPrimario: colorSegura(restaurante?.color_primario, TEMA_COMENSAL_DEFAULT.colorPrimario),
    colorSecundario: colorSegura(restaurante?.color_secundario, TEMA_COMENSAL_DEFAULT.colorSecundario),
  };

  function marcarTipo(tipo: string, pendiente: boolean) {
    setTiposPendientesActuales((actuales) => {
      const nuevos = new Set(actuales);
      if (pendiente) nuevos.add(tipo);
      else nuevos.delete(tipo);
      return nuevos;
    });
  }

  useEffect(() => {
    let vigente = true;

    async function inicializarSesion() {
      // 1. Lógica Anti-QR Fantasma (Sesiones)
      const { data: sesionesActivas } = await supabase
        .from('sesiones_clientes')
        .select('id')
        .eq('mesa_id', id)
        .eq('activa', true);

      const miToken = localStorage.getItem(`token_mesa_${id}`);
      const haySesionActiva = (sesionesActivas?.length ?? 0) > 0;
      const soySesionActiva = sesionesActivas?.some((s) => s.id === miToken) ?? false;

      if (mesa.estado === 'ocupada' && haySesionActiva && !soySesionActiva) {
        // La mesa la está operando OTRO dispositivo.
        setBloqueado(true);
      } else {
        // Mesa libre (o ya es mi sesión): ocuparla de forma atómica. El RPC
        // cierra sesiones viejas/fantasma y crea una nueva para este dispositivo.
        const { data: sesionId, error: ocuparError } = await supabase.rpc('ocupar_mesa', {
          p_mesa_id: id,
        });

        if (!ocuparError && sesionId) {
          localStorage.setItem(`token_mesa_${id}`, sesionId);
        } else {
          console.error('No se pudo ocupar la mesa:', ocuparError);
          setBloqueado(true);
        }
      }

      if (vigente) setCargando(false);
    }

    inicializarSesion();

    // 2. MAGIA EN VIVO: escuchar si el mozo nos expulsa Y si atiende peticiones
    const canalComensal = supabase
      .channel(`mesa-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mesas',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new.estado === 'libre') {
            setBloqueado(true);
            localStorage.removeItem(`token_mesa_${id}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peticiones',
          filter: `mesa_id=eq.${id}`,
        },
        (payload) => {
          // Refrescar botones: al atenderse una petición (UPDATE/DELETE) o al
          // crearse de nuevo (INSERT), se re-habilita o deshabilita el botón.
          const nuevo = payload.new as { tipo?: string; estado?: string } | null;
          const anterior = payload.old as { tipo?: string } | null;
          const tipo = nuevo?.tipo ?? anterior?.tipo;
          if (!tipo) return;
          if (payload.eventType === 'INSERT') {
            marcarTipo(tipo, nuevo?.estado === 'pendiente');
          } else if (payload.eventType === 'UPDATE') {
            marcarTipo(tipo, nuevo?.estado === 'pendiente');
          } else if (payload.eventType === 'DELETE') {
            marcarTipo(tipo, false);
          }
        }
      )
      .subscribe();

    return () => {
      vigente = false;
      supabase.removeChannel(canalComensal);
    };
  }, [id, mesa.estado]);

  useEffect(() => {
    if (!mostrarModalResena) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMostrarModalResena(false);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [mostrarModalResena]);

  async function enviarPeticion(
    tipo: 'llamar_mozo' | 'pedir_cuenta',
    metodo?: 'efectivo' | 'tarjeta'
  ) {
    if (bloqueado || tiposPendientesActuales.has(tipo)) return;

    setMensaje('Enviando...');

    const peticion: TablesInsert<'peticiones'> =
      tipo === 'pedir_cuenta'
        ? {
            mesa_id: id,
            restaurante_id: mesa.restaurante_id,
            sucursal_id: mesa.sucursal_id,
            tipo,
            estado: 'pendiente',
            metodo_pago: metodo,
          }
        : {
            mesa_id: id,
            restaurante_id: mesa.restaurante_id,
            sucursal_id: mesa.sucursal_id,
            tipo,
            estado: 'pendiente',
          };

    const { error } = await supabase.from('peticiones').insert(peticion);

    if (error) {
      setMensaje('❌ Ya hay una solicitud vigente para esto.');
      setTimeout(() => setMensaje(''), 3000);
    } else {
      marcarTipo(tipo, true);
      if (tipo === 'pedir_cuenta') {
        setMetodoSeleccionando(false);
        if (urlResenas) setMostrarModalResena(true);
      }
      setMensaje(tipo === 'pedir_cuenta' ? '✅ ¡La cuenta está en camino!' : '✅ ¡Tu mozo está en camino!');
      setTimeout(() => setMensaje(''), 3000);
    }
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando mesa...</div>;

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
  const llamadoMozo = tiposPendientesActuales.has('llamar_mozo');
  const pedidaCuenta = tiposPendientesActuales.has('pedir_cuenta');

  const varsIdentidad = {
    '--t-primario': tema.colorPrimario,
    '--t-secundario': tema.colorSecundario,
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans" style={varsIdentidad}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 text-center">

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            {tema.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tema.logoUrl} alt={tema.nombre} className="h-22 sm:h-28 w-auto max-w-[14rem] rounded-xl object-contain" />
            ) : (
              <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--t-primario)]">{tema.nombre}</h2>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-800">Mesa {mesa.numero}</h1>
            <p className="text-gray-500">¿En qué podemos ayudarte?</p>
          </div>
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
              className="block w-full py-4 bg-[var(--t-secundario)] text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md"
            >
              📖 Ver Carta Digital
            </a>
          )}

          {urlCarta && (
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">O solicita asistencia</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
          )}

          <button
            onClick={() => enviarPeticion('llamar_mozo')}
            disabled={llamadoMozo}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors shadow-md active:scale-95 disabled:active:scale-100 ${
              llamadoMozo
                ? 'bg-gray-200 text-gray-500 cursor-default'
                : 'bg-[var(--t-primario)] text-white hover:opacity-90'
            }`}
          >
            {llamadoMozo ? '👋 Mozo avisado' : '👋 Llamar al Mozo'}
          </button>

          {metodoSeleccionando && !pedidaCuenta ? (
            <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-700">¿Cómo va a pagar?</p>
              <button
                onClick={() => enviarPeticion('pedir_cuenta', 'efectivo')}
                className="w-full py-3.5 rounded-xl font-semibold bg-[var(--t-secundario)] text-white hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98]"
              >
                💵 Efectivo / Transferencia
              </button>
              <button
                onClick={() => enviarPeticion('pedir_cuenta', 'tarjeta')}
                className="w-full py-3.5 rounded-xl font-semibold bg-[var(--t-primario)] text-white hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98]"
              >
                💳 Tarjeta
              </button>
              <button
                onClick={() => setMetodoSeleccionando(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMetodoSeleccionando(true)}
              disabled={pedidaCuenta}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors shadow-md active:scale-95 disabled:active:scale-100 ${
                pedidaCuenta
                  ? 'bg-gray-200 text-gray-500 cursor-default'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {pedidaCuenta ? '💳 Cuenta pedida' : '💳 Pedir la Cuenta'}
            </button>
          )}

          {urlResenas && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 text-center space-y-3">
              <div className="text-3xl leading-none">⭐⭐⭐⭐⭐</div>
              <p className="text-sm font-semibold text-gray-700">
                ¿Te gustó la atención? Ayudanos con tu reseña en Google.
              </p>
              <a
                href={urlResenas}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-md active:scale-[0.98]"
              >
                ⭐ Dejanos tu reseña
              </a>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 pt-6">
          Sesión segura vinculada.
        </p>
      </div>

      {mostrarModalResena && urlResenas && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tituloResena"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setMostrarModalResena(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">⭐</div>
            <h2 id="tituloResena" className="text-xl font-bold text-gray-800">
              ¿Nos dejás una reseña?
            </h2>
            <p className="text-sm text-gray-500">
              Tu opinión nos ayuda a mejorar y a que más gente nos conozca. ¡Gracias por tu visita!
            </p>
            <a
              href={urlResenas}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMostrarModalResena(false)}
              className="block w-full py-3.5 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-md"
            >
              Sí, dejar mi reseña
            </a>
            <button
              onClick={() => setMostrarModalResena(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </main>
  );
}