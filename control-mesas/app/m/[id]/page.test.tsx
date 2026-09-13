import { Suspense, act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PantallaComensal from './page';

const { supabase } = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
    removeChannel: vi.fn(),
    channel: vi.fn(),
  };
  return { supabase };
});

vi.mock('../../../src/lib/supabase', () => ({ supabase }));

const MESA = { id: 'mesa-1', numero: 5, restaurante_id: 'rest-1', estado: 'libre' };

const RESTAURANTE_DEFAULT = {
  url_carta: null,
  logo_url: null,
  color_primario: '#7c3aed',
  color_secundario: '#0f172a',
  nombre: 'Pizzería Don Gato',
};

function configurarSupabase(
  sobre: Partial<Record<string, unknown>> = {},
  registrosInserts: { tabla: string; payload: unknown }[] = []
) {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((tabla: string) => {
    const respuestas: Record<string, unknown> = {
      mesas: { data: MESA, error: null },
      restaurantes_publico: { data: RESTAURANTE_DEFAULT, error: null },
      peticiones: { data: [], error: null },
      sesiones_clientes: { data: [], error: null },
      ...sobre,
    };
    const target = {
      select: vi.fn(() => target),
      insert: vi.fn((payload: unknown) => {
        registrosInserts.push({ tabla, payload });
        return target;
      }),
      update: vi.fn(() => target),
      eq: vi.fn(() => target),
      order: vi.fn(() => target),
      limit: vi.fn(() => target),
      single: vi.fn(() => Promise.resolve(respuestas[tabla] ?? { data: null, error: null })),
      then: (onFulfilled: (v: unknown) => unknown) =>
        Promise.resolve(respuestas[tabla] ?? { data: null, error: null }).then(onFulfilled),
    };
    return target;
  });

  const canal = {
    on: vi.fn(() => canal),
    subscribe: vi.fn(() => canal),
  };
  (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(canal);

  return registrosInserts;
}

async function renderComensal() {
  let utils: ReturnType<typeof render> | undefined;
  await act(async () => {
    utils = render(
      <Suspense fallback={null}>
        <PantallaComensal params={Promise.resolve({ id: 'mesa-1' })} />
      </Suspense>
    );
  });
  return utils!;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  cleanup();
});

describe('PantallaComensal', () => {
  it('muestra la mesa y los botones de asistencia', async () => {
    configurarSupabase();
    await renderComensal();

    expect(screen.getByRole('heading', { name: 'Mesa 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Llamar al Mozo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pedir la Cuenta/ })).toBeInTheDocument();
  });

  it('bloquea la pantalla si la mesa ya está siendo usada por otro dispositivo', async () => {
    configurarSupabase({
      sesiones_clientes: { data: [{ id: 'otro-token' }], error: null },
    });
    await renderComensal();

    expect(screen.getByRole('heading', { name: 'Mesa en Uso' })).toBeInTheDocument();
  });

  it('deshabilita el botón al enviar una petición (anti-spam)', async () => {
    configurarSupabase();
    await renderComensal();

    const boton = screen.getByRole('button', { name: /Llamar al Mozo/ });
    await userEvent.click(boton);

    expect(await screen.findByText(/mozo está en camino/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mozo avisado/ })).toBeDisabled();
  });

  it('muestra el nombre del restaurante cuando no tiene logo', async () => {
    configurarSupabase();
    await renderComensal();

    expect(screen.getByText('Pizzería Don Gato')).toBeInTheDocument();
  });

  it('muestra el logo del restaurante cuando lo tiene', async () => {
    configurarSupabase({
      restaurantes_publico: { data: { ...RESTAURANTE_DEFAULT, logo_url: '/logo-pizzeria.png' }, error: null },
    });
    await renderComensal();

    expect(screen.getByRole('img', { name: 'Pizzería Don Gato' })).toBeInTheDocument();
    expect(screen.queryByText('Pizzería Don Gato')).not.toBeInTheDocument();
  });

  it('muestra el selector de método de pago al tocar Pedir la Cuenta', async () => {
    configurarSupabase();
    await renderComensal();

    await userEvent.click(screen.getByRole('button', { name: /Pedir la Cuenta/ }));

    expect(screen.getByRole('button', { name: /Efectivo \/ Transferencia/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tarjeta/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
  });

  it('envía la petición con metodo_pago "tarjeta" al elegir Tarjeta', async () => {
    const inserts = configurarSupabase();
    await renderComensal();

    await userEvent.click(screen.getByRole('button', { name: /Pedir la Cuenta/ }));
    await userEvent.click(screen.getByRole('button', { name: /Tarjeta/ }));

    expect(await screen.findByText(/cuenta está en camino/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cuenta pedida/ })).toBeDisabled();

    const peticionCuenta = inserts.find((i) => i.tabla === 'peticiones');
    expect(peticionCuenta?.payload).toMatchObject({
      tipo: 'pedir_cuenta',
      metodo_pago: 'tarjeta',
      estado: 'pendiente',
    });
  });

  it('envía la petición con metodo_pago "efectivo" al elegir Efectivo / Transferencia', async () => {
    const inserts = configurarSupabase();
    await renderComensal();

    await userEvent.click(screen.getByRole('button', { name: /Pedir la Cuenta/ }));
    await userEvent.click(screen.getByRole('button', { name: /Efectivo \/ Transferencia/ }));

    expect(await screen.findByText(/cuenta está en camino/)).toBeInTheDocument();

    const peticionCuenta = inserts.find((i) => i.tabla === 'peticiones');
    expect(peticionCuenta?.payload).toMatchObject({
      tipo: 'pedir_cuenta',
      metodo_pago: 'efectivo',
      estado: 'pendiente',
    });
  });
});