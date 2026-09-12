import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from './page';
import { EMAIL_COMERCIAL } from '../src/lib/contacto';

describe('LandingPage', () => {
  it('muestra la marca y los CTAs de venta', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/SmartTable/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Solicitar Demo/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Consultar/ }).length).toBeGreaterThan(0);
  });

  it('muestra la sección de contacto con el correo comercial', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { name: 'Hablemos de tu restaurante' })).toBeInTheDocument();
    expect(screen.getAllByText(EMAIL_COMERCIAL).length).toBeGreaterThan(0);
  });

  it('no expone el registro libre', () => {
    render(<LandingPage />);
    expect(document.querySelector('a[href="/registro"]')).toBeNull();
  });
});