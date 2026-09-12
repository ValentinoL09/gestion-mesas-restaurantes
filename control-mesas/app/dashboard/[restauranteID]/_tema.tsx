'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type TemaRestaurante = {
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
};

// Marca por defecto: SmartTable. Un restaurante que todavía no se
// personalizó muestra la marca SmartTable hasta cargar su identidad.
export const TEMA_DEFAULT: TemaRestaurante = {
  nombre: 'SmartTable',
  logoUrl: '/logo.jpg',
  colorPrimario: '#2563eb',
  colorSecundario: '#0a0a0a',
};

const TemaContext = createContext<TemaRestaurante>(TEMA_DEFAULT);

export function TemaProvider({ tema, children }: { tema: TemaRestaurante; children: ReactNode }) {
  return <TemaContext.Provider value={tema}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}