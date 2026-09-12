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

function cadena(respuesta: unknown) {
  const target = {
    select: vi.fn(() => target),
    insert: vi.fn(() => target),
    update: vi.fn(() => target),
    eq: vi.fn(() => target),
    order: vi.fn(() => target),
    limit: vi.fn(() => target),
    single: vi.fn(() => Promise.resolve(respuesta)),
    then: (onFulfilled: (v: unknown) => unknown) => Promise.resolve(respuesta).then(onFulfilled),
  };
  return target;
}

function configurarSupabase(sobre: Partial<Record<string, unknown>> = {}) {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((tabla: string) => {
    const respuestas: Record<string, unknown> = {
      mesas: { data: MESA, error: null },
      restaurantes_publico: { data: { url_carta: null }, error: null },
      peticiones: { data: [], error: null },
      sesiones_clientes: { data: [], error: null },
      ...sobre,
    };
    return cadena(respuestas[tabla] ?? { data: null, error: null });
  });

  const canal = {
    on: vi.fn(() => canal),
    subscribe: vi.fn(() => canal),
  };
  (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(canal);
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
});