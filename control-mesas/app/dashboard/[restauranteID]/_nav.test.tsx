import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TemaProvider } from './_tema';
import { SucursalesProvider } from './_sucursales';
import NavDashboard from './_nav';

const { useSearchParamsMock, usePathnameMock, useRouterMock } = vi.hoisted(() => ({
  useSearchParamsMock: { get: vi.fn() },
  usePathnameMock: vi.fn(),
  useRouterMock: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => useSearchParamsMock,
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock,
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  useSearchParamsMock.get.mockReturnValue(null);
  usePathnameMock.mockReturnValue('/dashboard/r-1');
});

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

  it('no muestra el selector si hay una sola sucursal', () => {
    render(
      <SucursalesProvider sucursales={[{ id: 's-1', nombre: 'Sucursal 1' }]}>
        <NavDashboard restauranteID="r-1" actual="tablero" />
      </SucursalesProvider>
    );

    expect(screen.queryByRole('combobox', { name: 'Sucursal activa' })).not.toBeInTheDocument();
  });

  it('muestra el selector y links con ?sucursal= cuando hay varias sucursales', () => {
    render(
      <SucursalesProvider
        sucursales={[
          { id: 's-1', nombre: 'Sucursal 1' },
          { id: 's-2', nombre: 'Sucursal 2' },
        ]}
      >
        <NavDashboard restauranteID="r-1" actual="tablero" />
      </SucursalesProvider>
    );

    const select = screen.getByRole('combobox', { name: 'Sucursal activa' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tablero/ })).toHaveAttribute(
      'href',
      '/dashboard/r-1?sucursal=s-1'
    );
  });

  it('los links conservan la sucursal activa del parámetro', () => {
    useSearchParamsMock.get.mockReturnValue('s-2');
    render(
      <SucursalesProvider
        sucursales={[
          { id: 's-1', nombre: 'Sucursal 1' },
          { id: 's-2', nombre: 'Sucursal 2' },
        ]}
      >
        <NavDashboard restauranteID="r-1" actual="qrs" />
      </SucursalesProvider>
    );

    expect(screen.getByRole('link', { name: 'QRs' })).toHaveAttribute(
      'href',
      '/dashboard/r-1/qrs?sucursal=s-2'
    );
  });
});