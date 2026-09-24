import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../../../src/lib/api';

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/sucursales/[sucursalId]'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id, sucursalId } = await ctx.params;

  const { data: sucursal } = await supabaseAdmin
    .from('sucursales')
    .select('restaurante_id')
    .eq('id', sucursalId)
    .single();

  if (!sucursal || sucursal.restaurante_id !== id) {
    return Response.json({ error: 'Sucursal no encontrada.' }, { status: 404 });
  }

  const { count } = await supabaseAdmin
    .from('sucursales')
    .select('id', { count: 'exact', head: true })
    .eq('restaurante_id', id);

  if ((count ?? 0) <= 1) {
    return Response.json({ error: 'No se puede eliminar la única sucursal.' }, { status: 400 });
  }

  const { data: mesas } = await supabaseAdmin
    .from('mesas')
    .select('id')
    .eq('sucursal_id', sucursalId);
  const mesaIds = mesas?.map((m) => m.id) ?? [];

  if (mesaIds.length > 0) {
    await supabaseAdmin.from('sesiones_clientes').delete().in('mesa_id', mesaIds);
    await supabaseAdmin.from('peticiones').delete().in('mesa_id', mesaIds);
  }
  await supabaseAdmin.from('peticiones').delete().eq('sucursal_id', sucursalId);
  await supabaseAdmin.from('mesas').delete().eq('sucursal_id', sucursalId);
  const { error } = await supabaseAdmin.from('sucursales').delete().eq('id', sucursalId);
  if (error) return errorInterno('DELETE sucursal', error);

  return Response.json({ ok: true });
}
