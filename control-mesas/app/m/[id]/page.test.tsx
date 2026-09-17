import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PantallaComensal from './_comensal';

const { supabase } = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
    removeChannel: vi.fn(),
    channel: vi.fn(),
    rpc: vi.fn(),
  };
  return { supabase };
});

vi.mock('../../../src/lib/supabase', () => ({ supabase }));

const MESA = {
  id: 'mesa-1',
  numero: 5,
  restaurante_id: 'rest-1',
  sucursal_id: 'suc-1',
  estado: 'libre',
  qr_url: null,
};

const RESTAURANTE_DEFAULT: {
  url_carta: string | null;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  nombre: string;
} = {
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
  (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 'sesion-nueva', error: null });

  return registrosInserts;
}

function renderComensal(
  props: Partial<{
    mesa: typeof MESA;
    restaurante: typeof RESTAURANTE_DEFAULT | null;
    tiposPendientes: string[];
  }> = {}
) {
  return act(async () => {
    render(
      <PantallaComensal
        id="mesa-1"
        mesa={props.mesa ?? MESA}
        restaurante={props.restaurante ?? RESTAURANTE_DEFAULT}
        tiposPendientes={props.tiposPendientes ?? []}
      />
    );
  });
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

  it('bloquea la pantalla si la mesa está ocupada por OTRO dispositivo', async () => {
    configurarSupabase({
      sesiones_clientes: { data: [{ id: 'otro-token' }], error: null },
    });
    await renderComensal({ mesa: { ...MESA, estado: 'ocupada' } });

    expect(screen.getByRole('heading', { name: 'Mesa en Uso' })).toBeInTheDocument();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('toma la mesa vía RPC aunque exista una sesión vieja fantasma (mesa libre)', async () => {
    configurarSupabase({
      sesiones_clientes: { data: [{ id: 'sesion-fantasma' }], error: null },
    });
    await renderComensal();

    expect(screen.getByRole('heading', { name: 'Mesa 5' })).toBeInTheDocument();
    expect(supabase.rpc).toHaveBeenCalledWith('ocupar_mesa', { p_mesa_id: 'mesa-1' });
    expect(localStorage.getItem('token_mesa_mesa-1')).toBe('sesion-nueva');
  });

  it('ocupa la mesa vía RPC y guarda la sesión al escanear una mesa libre', async () => {
    configurarSupabase();
    await renderComensal();

    expect(supabase.rpc).toHaveBeenCalledWith('ocupar_mesa', { p_mesa_id: 'mesa-1' });
    expect(localStorage.getItem('token_mesa_mesa-1')).toBe('sesion-nueva');
  });

  it('no muestra "O solicita asistencia" cuando el restaurante no tiene carta digital', async () => {
    configurarSupabase();
    await renderComensal();

    expect(screen.queryByText(/solicita asistencia/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver Carta Digital/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pedir la Cuenta/ })).toBeInTheDocument();
  });

  it('muestra la carta digital y "O solicita asistencia" cuando el restaurante tiene url_carta', async () => {
    configurarSupabase();
    await renderComensal({ restaurante: { ...RESTAURANTE_DEFAULT, url_carta: '/carta.pdf' } });

    expect(screen.getByRole('link', { name: /Ver Carta Digital/ })).toBeInTheDocument();
    expect(screen.getByText(/solicita asistencia/)).toBeInTheDocument();
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
    configurarSupabase();
    await renderComensal({ restaurante: { ...RESTAURANTE_DEFAULT, logo_url: '/logo-pizzeria.png' } });

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