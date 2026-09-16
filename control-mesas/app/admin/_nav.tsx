'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

export default function NavAdmin({
  actual,
  volverA = '/admin',
}: {
  actual: 'lista' | 'nuevo' | 'detalle';
  volverA?: string;
}) {
  const router = useRouter();

  const classes = (activo: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activo ? 'bg-[var(--t-primario)] text-white' : 'text-gray-600 hover:bg-gray-200'
    }`;

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="w-full flex items-center gap-1 bg-white border-b border-gray-200 px-6 py-3 shadow-sm print:hidden">
      <Link href="/admin" className="flex items-center gap-2.5 mr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="SmartTable" className="h-16 w-auto object-contain" />
        <span className="text-xl font-black tracking-tighter text-gray-900">Admin</span>
      </Link>
      {actual !== 'lista' && (
        <Link href={volverA} className="text-sm font-medium text-gray-500 hover:text-gray-900 mr-2">
          ← Volver
        </Link>
      )}
      <Link href="/admin" className={classes(actual === 'lista')}>
        Restaurantes
      </Link>
      <Link href="/admin/nuevo" className={classes(actual === 'nuevo')}>
        Nuevo restaurante
      </Link>
      <div className="ml-auto">
        <button
          onClick={cerrarSesion}
          className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}