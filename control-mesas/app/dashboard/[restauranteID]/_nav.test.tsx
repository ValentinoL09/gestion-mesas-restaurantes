import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemaProvider } from './_tema';
import NavDashboard from './_nav';

describe('NavDashboard', () => {
  it('muestra el nombre y logo del restaurante con su tema', () => {
    render(
      <TemaProvider
        tema={{
          nombre: 'Parrilla Don Pedro',
          logoUrl: '/logo-don-pedro.png',
          colorPrimario: '#7c3aed',
          colorSecundario: '#0f172a',
        }}
      >
        <NavDashboard restauranteID="r-1" actual="tablero" />
      </TemaProvider>
    );

    expect(screen.getByText('Parrilla Don Pedro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'QRs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tablero/ })).toBeInTheDocument();
  });

  it('sin tema personalizado muestra la marca SmartTable por defecto', () => {
    render(<NavDashboard restauranteID="r-1" actual="qrs" />);

    expect(screen.getByText('SmartTable')).toBeInTheDocument();
  });
});