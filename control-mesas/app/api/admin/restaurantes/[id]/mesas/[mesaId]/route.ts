import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../../../src/lib/api';
import { enteroEnRango } from '../../../../../../../src/lib/validacion';

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas/[mesaId]'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id, mesaId } = await ctx.params;

  // Verificar que la mesa pertenece al restaurante ANTES de borrar en cascada.
  const { data: mesa } = await supabaseAdmin
    .from('mesas')
    .select('id')
    .eq('id', mesaId)
    .eq('restaurante_id', id)
    .single();

  if (!mesa) return Response.json({ error: 'Mesa no encontrada.' }, { status: 404 });

  await supabaseAdmin.from('sesiones_clientes').delete().eq('mesa_id', mesaId);
  await supabaseAdmin.from('peticiones').delete().eq('mesa_id', mesaId);

  const { error } = await supabaseAdmin.from('mesas').delete().eq('id', mesaId);
  if (error) return errorInterno('DELETE mesa', error);

  return Response.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas/[mesaId]'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id, mesaId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const numero = enteroEnRango(body.numero, 1, 9999);

  if (numero === null) {
    return Response.json({ error: 'Número de mesa inválido.' }, { status: 400 });
  }

  const { data: mesa, error } = await supabaseAdmin
    .from('mesas')
    .update({ numero })
    .eq('id', mesaId)
    .eq('restaurante_id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Ese número de mesa ya está en uso en la sucursal.' }, { status: 409 });
    }
    return errorInterno('PATCH mesa', error);
  }

  if (!mesa) return Response.json({ error: 'Mesa no encontrada.' }, { status: 404 });

  return Response.json({ mesa });
}
