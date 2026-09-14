import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../../../src/lib/supabase-admin';

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas/[mesaId]'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id, mesaId } = await ctx.params;

  await supabaseAdmin.from('sesiones_clientes').delete().eq('mesa_id', mesaId);
  await supabaseAdmin.from('peticiones').delete().eq('mesa_id', mesaId);

  const { error } = await supabaseAdmin
    .from('mesas')
    .delete()
    .eq('id', mesaId)
    .eq('restaurante_id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas/[mesaId]'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id, mesaId } = await ctx.params;
  const body = await request.json();
  const numero = Number(body?.numero);

  if (!Number.isInteger(numero) || numero < 1) {
    return Response.json({ error: 'Número de mesa inválido.' }, { status: 400 });
  }

  const { data: mesa, error } = await supabaseAdmin
    .from('mesas')
    .update({ numero })
    .eq('id', mesaId)
    .eq('restaurante_id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ mesa });
}