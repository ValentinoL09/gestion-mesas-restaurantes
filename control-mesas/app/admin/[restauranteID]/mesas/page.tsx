import NavAdmin from '../../_nav';
import AdminMesas from './_mesas';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';

export default async function AdminMesasPage({
  params,
}: {
  params: Promise<{ restauranteID: string }>;
}) {
  const { restauranteID } = await params;

  const [{ data: restaurante }, { data: sucursales }, { data: mesas }] = await Promise.all([
    supabaseAdmin.from('restaurantes').select('nombre').eq('id', restauranteID).single(),
    supabaseAdmin
      .from('sucursales')
      .select('id, nombre')
      .eq('restaurante_id', restauranteID)
      .order('creado_en'),
    supabaseAdmin
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .order('numero'),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="detalle" volverA={`/admin/${restauranteID}`} />
      <AdminMesas
        restauranteID={restauranteID}
        nombre={restaurante?.nombre ?? ''}
        sucursales={sucursales ?? []}
        mesas={mesas ?? []}
      />
    </div>
  );
}