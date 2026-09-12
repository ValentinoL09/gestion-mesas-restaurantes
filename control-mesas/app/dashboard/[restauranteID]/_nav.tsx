import Link from 'next/link';

export default function NavDashboard({ restauranteID, actual }: { restauranteID: string; actual: 'tablero' | 'qrs' | 'configuracion' }) {
  const classes = (activo: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activo ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <nav className="w-full flex items-center gap-1 bg-white border-b border-gray-200 px-6 py-3 print:hidden shadow-sm">
      <Link href="/" className="text-xl font-black tracking-tighter text-gray-900 mr-6">
        Smart<span className="text-blue-600">Table</span>
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