'use client';

import Link from 'next/link';
import { useTema } from './_tema';

export default function NavDashboard({
  restauranteID,
  actual,
}: {
  restauranteID: string;
  actual: 'tablero' | 'qrs' | 'configuracion';
}) {
  const tema = useTema();

  const classes = (activo: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activo ? 'bg-[var(--t-primario)] text-white' : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <nav className="w-full flex items-center gap-1 bg-white border-b border-gray-200 px-6 py-3 print:hidden shadow-sm">
      <Link href="/" className="flex items-center gap-2.5 mr-6">
        {tema.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tema.logoUrl} alt={tema.nombre} className="w-9 h-9 rounded-lg object-contain" />
        )}
        <span className="text-xl font-black tracking-tighter text-gray-900">{tema.nombre}</span>
      </Link>
      <Link href={`/dashboard/${restauranteID}`} className={classes(actual === 'tablero')}>
        Tablero
      </Link>
      <Link href={`/dashboard/${restauranteID}/qrs`} className={classes(actual === 'qrs')}>
        QRs
      </Link>
      <Link href={`/dashboard/${restauranteID}/configuracion`} className={classes(actual === 'configuracion')}>
        Configuración
      </Link>
    </nav>
  );
}