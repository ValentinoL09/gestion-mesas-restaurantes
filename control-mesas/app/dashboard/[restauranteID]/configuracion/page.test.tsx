import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfiguracionRestaurante from './page';

const { supabase } = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  };
  return { supabase };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/dashboard/r-1/configuracion',
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('../../../../src/lib/supabase', () => ({ supabase }));
vi.mock('../../../../src/lib/useProtegerRestaurante', () => ({
  useProtegerRestaurante: () => ({ verificando: false }),
}));

const RESTAURANTE: Record<string, unknown> = {
  nombre: 'Mi Local',
  url_carta: null,
  logo_url: null,
};

function configurarSupabase(
  restaurante: Record<string, unknown> = {},
  respuestasUpdate: { error: null } | { error: Error } = { error: null }
) {
  const registrosUpdate: { payload: unknown }[] = [];

  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((tabla: string) => {
    const target = {
      select: vi.fn(() => target),
      update: vi.fn((payload: unknown) => {
        registrosUpdate.push({ payload });
        return target;
      }),
      eq: vi.fn(() => target),
      single: vi.fn(() =>
        Promise.resolve(
          tabla === 'restaurantes' ? { data: { ...RESTAURANTE, ...restaurante }, error: null } : { data: null, error: null }
        )
      ),
      then: (onFulfilled: (v: unknown) => unknown) => Promise.resolve(respuestasUpdate).then(onFulfilled),
    };
    return target;
  });

  const ruta = 'r-1/logo';
  (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
    upload: vi.fn(async () => ({ error: null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: `https://cdn.test/logos/${ruta}` } })),
  });

  return registrosUpdate;
}

async function renderConfiguracion() {
  await act(async () => {
    render(<ConfiguracionRestaurante params={Promise.resolve({ restauranteID: 'r-1' })} />);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  URL.createObjectURL = vi.fn(() => 'blob:preview-url');
});

describe('ConfiguracionRestaurante', () => {
  it('carga nombre, url_carta y logo del restaurante', async () => {
    configurarSupabase({ nombre: 'Pizzeria Don Gato', url_carta: '/carta.pdf', logo_url: '/logo-don-gato.png' });
    await renderConfiguracion();

    expect(screen.getByDisplayValue('Pizzeria Don Gato')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/carta.pdf')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo del restaurante' })).toHaveAttribute('src', '/logo-don-gato.png');
  });

  it('muestra el logo por defecto cuando el restaurante no tiene logo', async () => {
    configurarSupabase();
    await renderConfiguracion();

    expect(screen.getByRole('img', { name: 'Logo del restaurante' })).toHaveAttribute('src', '/logo.png');
  });

  it('guarda nombre y url_carta sin tocar el logo', async () => {
    const updates = configurarSupabase({ nombre: 'Local', logo_url: '/logo.png' });
    await renderConfiguracion();

    await userEvent.clear(screen.getByLabelText('Nombre del local'));
    await userEvent.type(screen.getByLabelText('Nombre del local'), 'Local Viejo');
    await userEvent.clear(screen.getByLabelText('URL de la carta digital'));
    await userEvent.type(screen.getByLabelText('URL de la carta digital'), 'https://carta.ejemplo.com/menu');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Configuración guardada/)).toBeInTheDocument();
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toMatchObject({
      nombre: 'Local Viejo',
      url_carta: 'https://carta.ejemplo.com/menu',
    });
    expect(updates[0].payload).not.toHaveProperty('logo_url');
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('sube el logo nuevo y guarda su URL pública al guardar', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion();

    const archivo = new File(['logo'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Subir logo'), {
      target: { files: [archivo] },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Configuración guardada/)).toBeInTheDocument();
    expect(supabase.storage.from).toHaveBeenCalledWith('logos');
    expect((supabase.storage.from as ReturnType<typeof vi.fn>).mock.results[0].value.upload).toHaveBeenCalledWith(
      'r-1/logo',
      archivo,
      { upsert: true, cacheControl: '3600' }
    );
    expect(updates[0].payload).toMatchObject({
      logo_url: 'https://cdn.test/logos/r-1/logo',
    });
  });

  it('quita el logo al guardar', async () => {
    const updates = configurarSupabase({ logo_url: 'https://cdn.test/logos/r-1/logo' });
    await renderConfiguracion();

    await userEvent.click(screen.getByRole('button', { name: 'Quitar logo' }));
    expect(screen.getByText(/Se quitará el logo/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Configuración guardada/)).toBeInTheDocument();
    expect(updates[0].payload).toMatchObject({ logo_url: null });
  });

  it('muestra error si el archivo elegido no es una imagen', async () => {
    configurarSupabase();
    await renderConfiguracion();

    const archivo = new File(['datos'], 'menu.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Subir logo'), {
      target: { files: [archivo] },
    });

    expect(screen.getByText(/debe ser una imagen/)).toBeInTheDocument();
  });
});