import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormConfiguracion from './_form';

const { supabase, normalizarLogoMock } = vi.hoisted(() => {
  const supabase = {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  };
  // El normalizador real necesita canvas; acá se lo aísla porque tiene sus
  // propios tests en src/lib/normalizar-logo.test.ts.
  const normalizarLogoMock = vi.fn(async (archivo: File) => archivo);
  return { supabase, normalizarLogoMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/r-1/configuracion',
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('../../../../src/lib/supabase', () => ({ supabase }));
vi.mock('../../../../src/lib/normalizar-logo', () => ({ normalizarLogo: normalizarLogoMock }));

const INICIAL_DEFAULT: {
  nombre: string;
  url_carta: string;
  url_resenas: string;
  logo_url: string | null;
} = {
  nombre: '',
  url_carta: '',
  url_resenas: '',
  logo_url: null,
};

function configurarSupabase(respuestasUpdate: { error: null } | { error: Error } = { error: null }) {
  const registrosUpdate: { payload: unknown }[] = [];

  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const target = {
      select: vi.fn(() => target),
      update: vi.fn((payload: unknown) => {
        registrosUpdate.push({ payload });
        return target;
      }),
      eq: vi.fn(() => target),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
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

async function renderConfiguracion(inicial: typeof INICIAL_DEFAULT = INICIAL_DEFAULT) {
  await act(async () => {
    render(<FormConfiguracion restauranteID="r-1" initial={inicial} />);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  normalizarLogoMock.mockImplementation(async (archivo: File) => archivo);
  URL.createObjectURL = vi.fn(() => 'blob:preview-url');
  URL.revokeObjectURL = vi.fn();
});

describe('FormConfiguracion', () => {
  it('muestra nombre, url_carta y logo iniciales del restaurante', async () => {
    await renderConfiguracion({
      nombre: 'Pizzeria Don Gato',
      url_carta: '/carta.pdf',
      url_resenas: 'https://g.page/r/abc/review',
      logo_url: '/logo-don-gato.png',
    });

    expect(screen.getByDisplayValue('Pizzeria Don Gato')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/carta.pdf')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo del restaurante' })).toHaveAttribute('src', '/logo-don-gato.png');
  });

  it('muestra el logo por defecto cuando el restaurante no tiene logo', async () => {
    await renderConfiguracion();

    expect(screen.getByRole('img', { name: 'Logo del restaurante' })).toHaveAttribute('src', '/logo.png');
  });

  it('guarda nombre y url_carta sin tocar el logo', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion({ nombre: 'Local', url_carta: '', url_resenas: '', logo_url: '/logo.png' });

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

  it('guarda la URL de reseñas de Google', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion();

    await userEvent.type(
      screen.getByLabelText('URL de reseñas de Google'),
      'https://g.page/r/abc/review'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Configuración guardada/)).toBeInTheDocument();
    expect(updates[0].payload).toMatchObject({
      url_resenas: 'https://g.page/r/abc/review',
    });
  });

  it('rechaza una URL de reseñas con esquema no permitido', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion();

    await userEvent.type(
      screen.getByLabelText('URL de reseñas de Google'),
      'javascript:alert(1)'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/debe empezar con http/)).toBeInTheDocument();
    expect(updates).toHaveLength(0);
  });

  it('sube el logo nuevo y guarda su URL pública al guardar', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion();

    const archivo = new File(['logo'], 'logo.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Subir logo'), {
        target: { files: [archivo] },
      });
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

  it('sube el logo ya normalizado, no el archivo original', async () => {
    configurarSupabase();
    await renderConfiguracion();

    const original = new File(['logo'], 'logo.png', { type: 'image/png' });
    const normalizado = new File(['recortado'], 'logo.png', { type: 'image/png' });
    normalizarLogoMock.mockResolvedValue(normalizado);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Subir logo'), {
        target: { files: [original] },
      });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Configuración guardada/)).toBeInTheDocument();
    expect(normalizarLogoMock).toHaveBeenCalledWith(original);
    expect((supabase.storage.from as ReturnType<typeof vi.fn>).mock.results[0].value.upload).toHaveBeenCalledWith(
      'r-1/logo',
      normalizado,
      { upsert: true, cacheControl: '3600' }
    );
  });

  it('quita el logo al guardar', async () => {
    const updates = configurarSupabase();
    await renderConfiguracion({ nombre: '', url_carta: '', url_resenas: '', logo_url: 'https://cdn.test/logos/r-1/logo' });

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