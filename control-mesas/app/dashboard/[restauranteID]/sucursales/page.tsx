import { createClient } from '../../../../src/lib/supabase-server';
import PanelSucursales from './_panel-sucursales';

export default async function GestionSucursales({
  params,
}: {
  params: Promise<{ restauranteID: string }>;
}) {
  const { restauranteID } = await params;
  const supabase = await createClient();

  const [{ data: sucursales }, { data: mesas }] = await Promise.all([
    supabase
      .from('sucursales')
      .select('*')
      .eq('restaurante_id', restauranteID)
      .order('creado_en'),
    supabase.from('mesas').select('sucursal_id').eq('restaurante_id', restauranteID),
  ]);

  const conteoMesas: Record<string, number> = {};
  mesas?.forEach((m) => {
    conteoMesas[m.sucursal_id] = (conteoMesas[m.sucursal_id] ?? 0) + 1;
  });

  return (
    <PanelSucursales
      restauranteID={restauranteID}
      sucursales={sucursales ?? []}
      conteoMesas={conteoMesas}
    />
  );
}