'use client';

import { useEffect } from 'react';

/**
 * Sincroniza la URL con la sucursal activa sin disparar una navegación de
 * React (history.replaceState evita la ida y vuelta al servidor).
 */
export default function SincronizarSucursal({ activa }: { activa: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sucursal') !== activa) {
      params.set('sucursal', activa);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [activa]);

  return null;
}