import { notFound } from 'next/navigation';
import NavAdmin from '../_nav';
import EditarRestaurante from './_editar';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

export default async function AdminDetalle({
  params,
}: {
  params: Promise<{ restauranteID: string }>;
}) {
  const { restauranteID } = await params;

  const { data: restaurante } = await supabaseAdmin
    .from('restaurantes')
    .select('*')
    .eq('id', restauranteID)
    .single();

  if (!restaurante) notFound();

  const { data: sucursales } = await supabaseAdmin
    .from('sucursales')
    .select('*')
    .eq('restaurante_id', restauranteID)
    .order('creado_en');

  const { data: mesas } = await supabaseAdmin.from('mesas').select('sucursal_id');
  const conteoMesas = new Map<string, number>();
  mesas?.forEach((m) =>
    conteoMesas.set(m.sucursal_id, (conteoMesas.get(m.sucursal_id) ?? 0) + 1)
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="detalle" volverA="/admin" />
      <EditarRestaurante
        restauranteID={restauranteID}
        restaurante={restaurante}
        sucursales={(sucursales ?? []).map((s) => ({
          ...s,
          cantidad_mesas: conteoMesas.get(s.id) ?? 0,
        }))}
      />
    </div>
  );
}