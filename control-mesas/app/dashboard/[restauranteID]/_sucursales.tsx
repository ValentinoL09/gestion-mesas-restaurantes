'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type Sucursal = {
  id: string;
  nombre: string;
};

const SucursalesContext = createContext<Sucursal[]>([]);

export function SucursalesProvider({
  sucursales,
  children,
}: {
  sucursales: Sucursal[];
  children: ReactNode;
}) {
  return <SucursalesContext.Provider value={sucursales}>{children}</SucursalesContext.Provider>;
}

export function useSucursales() {
  return useContext(SucursalesContext);
}