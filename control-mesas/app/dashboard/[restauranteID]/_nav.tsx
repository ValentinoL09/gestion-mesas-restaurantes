'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTema } from './_tema';
import { useSucursales } from './_sucursales';

type Seccion = 'tablero' | 'qrs' | 'sucursales' | 'configuracion';

const RUTAS: { clave: Seccion; href: (id: string) => string; etiqueta: string }[] = [
  { clave: 'tablero', href: (id) => `/dashboard/${id}`, etiqueta: 'Tablero' },
  { clave: 'qrs', href: (id) => `/dashboard/${id}/qrs`, etiqueta: 'QRs' },
  { clave: 'sucursales', href: (id) => `/dashboard/${id}/sucursales`, etiqueta: 'Sucursales' },
  { clave: 'configuracion', href: (id) => `/dashboard/${id}/configuracion`, etiqueta: 'Configuración' },
];

export default function NavDashboard({
  restauranteID,
  actual,
}: {
  restauranteID: string;
  actual: Seccion;
}) {
  const tema = useTema();
  const sucursales = useSucursales();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sucursalActiva = searchParams.get('sucursal') ?? (sucursales[0]?.id ?? '');

  function conSucursal(ruta: string): string {
    return sucursalActiva ? `${ruta}?sucursal=${sucursalActiva}` : ruta;
  }

  function cambiarSucursal(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sucursal', id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const classes = (activo: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activo ? 'bg-[var(--t-primario)] text-white' : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <nav className="w-full flex items-center gap-1 bg-white border-b border-gray-200 px-6 py-3 print:hidden shadow-sm">
      <Link href="/" className="flex items-center gap-2.5 mr-6">
        {tema.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tema.logoUrl} alt={tema.nombre} className="h-22 sm:h-28 rounded-lg object-contain" />
        )}
        <span className="text-xl font-black tracking-tighter text-gray-900">{tema.nombre}</span>
      </Link>
      {RUTAS.map((ruta) => (
        <Link
          key={ruta.clave}
          href={conSucursal(ruta.href(restauranteID))}
          className={classes(actual === ruta.clave)}
        >
          {ruta.etiqueta}
        </Link>
      ))}
      {sucursales.length > 1 && (
        <select
          aria-label="Sucursal activa"
          value={sucursalActiva}
          onChange={(e) => cambiarSucursal(e.target.value)}
          className="ml-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-gray-800 outline-none cursor-pointer"
        >
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      )}
    </nav>
  );
}