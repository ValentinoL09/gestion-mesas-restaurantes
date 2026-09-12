import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Registro from './page';

const { replaceMock, supabase } = vi.hoisted(() => {
  const replaceMock = vi.fn();
  const supabase = {
    auth: { signUp: vi.fn(), resend: vi.fn() },
    from: vi.fn(),
  };
  return { replaceMock, supabase };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock('../../src/lib/supabase', () => ({ supabase }));

function cadena(respuesta: unknown) {
  const target = {
    select: vi.fn(() => target),
    insert: vi.fn(() => target),
    eq: vi.fn(() => target),
    single: vi.fn(() => Promise.resolve(respuesta)),
    then: (onFulfilled: (v: unknown) => unknown) => Promise.resolve(respuesta).then(onFulfilled),
  };
  return target;
}

async function completarFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre del restaurante'), 'Parrilla Don Pedro');
  await user.type(screen.getByLabelText('Correo Electrónico'), 'dueno@ejemplo.com');
  await user.type(screen.getByLabelText('Contraseña'), 'contrasena123');
  await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Registro', () => {
  it('crea el restaurante y va al dashboard cuando la cuenta queda activa', async () => {
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: { user: { id: 'u-1' } } },
      error: null,
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
      cadena({ data: { id: 'r-1' }, error: null })
    );

    const user = userEvent.setup();
    render(<Registro />);
    await completarFormulario(user);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith('restaurantes');
    });
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/dashboard/r-1'));
  });

  it('muestra "Revisa tu correo" cuando la confirmación de email está activa', async () => {
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const user = userEvent.setup();
    render(<Registro />);
    await completarFormulario(user);

    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('muestra el error cuando falla el signUp', async () => {
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'El email ya está registrado.' },
    });

    const user = userEvent.setup();
    render(<Registro />);
    await completarFormulario(user);

    expect(await screen.findByText('El email ya está registrado.')).toBeInTheDocument();
  });
});