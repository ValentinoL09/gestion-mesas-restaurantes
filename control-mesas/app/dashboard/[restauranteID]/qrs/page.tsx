import { createClient } from '../../../../src/lib/supabase-server';
import { resolverSucursalActiva } from '../../../../src/lib/utils';
import type { Tables } from '../../../../src/lib/database.types';
import GeneradorQRs from './_qrs';

export default async function PaginaQRs({
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
  if (sucursalActiva) {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .eq('sucursal_id', sucursalActiva)
      .order('numero');
    mesas = data ?? [];
  }

  return (
    <GeneradorQRs
      restauranteID={restauranteID}
      sucursalActiva={sucursalActiva}
      sucursalNombre={sucursalActual?.nombre ?? null}
      mesasIniciales={mesas}
    />
  );
}