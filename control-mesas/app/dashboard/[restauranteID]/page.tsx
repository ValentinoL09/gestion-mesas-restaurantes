import { createClient } from '../../../src/lib/supabase-server';
import { resolverSucursalActiva } from '../../../src/lib/utils';
import type { Tables } from '../../../src/lib/database.types';
import Tablero from './_tablero';

export default async function DashboardStaff({
  params,
  searchParams,
}: {
  params: Promise<{ restauranteID: string }>;
  searchParams: Promise<{ sucursal?: string | string[] }>;
}) {
  const { restauranteID } = await params;
  const sp = await searchParams;
  const parametro = typeof sp.sucursal === 'string' ? sp.sucursal : null;

  const supabase = await createClient();

  const { data: sucursalesData } = await supabase
    .from('sucursales')
    .select('id, nombre')
    .eq('restaurante_id', restauranteID)
    .order('nombre');

  const sucursales = sucursalesData ?? [];
  const sucursalActiva = resolverSucursalActiva(sucursales, parametro);
  const sucursalActual = sucursales.find((s) => s.id === sucursalActiva) ?? null;

  let mesas: Tables<'mesas'>[] = [];
  let peticiones: Tables<'peticiones'>[] = [];
  if (sucursalActiva) {
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('mesas').select('*').eq('sucursal_id', sucursalActiva).order('numero'),
      supabase
        .from('peticiones')
        .select('*')
        .eq('sucursal_id', sucursalActiva)
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: true }),
    ]);
    mesas = m ?? [];
    peticiones = p ?? [];
  }

  return (
    <Tablero
      restauranteID={restauranteID}
      sucursalActiva={sucursalActiva}
      sucursalNombre={sucursalActual?.nombre ?? null}
      mesasIniciales={mesas}
      peticionesIniciales={peticiones}
    />
  );
}