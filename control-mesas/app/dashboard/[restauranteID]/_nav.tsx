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

  // La marca del restaurante nunca sale del restaurante: desde cualquier
  // sección vuelve a las mesas. El logo vive en una caja FIJA, así todos los
  // restaurantes ocupan lo mismo sin importar la proporción de su imagen (que
  // además llega normalizada a 512px por lado mayor). El nombre se recorta en
  // vez de empujar los links de sección.
  const marca = (
    <>
      {tema.logoUrl && (
        <span className="flex h-24 sm:h-28 w-32 sm:w-44 shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tema.logoUrl} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </span>
      )}
      <span className="min-w-0 max-w-[12rem] sm:max-w-[16rem] truncate text-2xl sm:text-3xl font-black tracking-tighter text-gray-900">
        {tema.nombre}
      </span>
    </>
  );

  return (
    <nav className="w-full flex items-center gap-1 bg-white border-b border-gray-200 px-6 py-3 print:hidden shadow-sm overflow-x-auto">
      {actual === 'tablero' ? (
        <div className="flex items-center gap-2.5 mr-6">{marca}</div>
      ) : (
        <Link href={conSucursal(`/dashboard/${restauranteID}`)} className="flex items-center gap-2.5 mr-6">
          {marca}
        </Link>
      )}
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