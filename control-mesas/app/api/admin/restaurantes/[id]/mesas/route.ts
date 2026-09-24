import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../../src/lib/api';
import { MAX_MESAS_POR_SUCURSAL, limpiarTexto } from '../../../../../../src/lib/validacion';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const sucursalId = limpiarTexto(body.sucursalId);

  if (!sucursalId) {
    return Response.json({ error: 'Faltan datos: sucursalId.' }, { status: 400 });
  }

  // La sucursal debe pertenecer al restaurante indicado.
  const { data: sucursal } = await supabaseAdmin
    .from('sucursales')
    .select('id')
    .eq('id', sucursalId)
    .eq('restaurante_id', id)
    .single();

  if (!sucursal) {
    return Response.json({ error: 'Sucursal no encontrada.' }, { status: 404 });
  }

  const { data: mesas } = await supabaseAdmin
    .from('mesas')
    .select('numero')
    .eq('sucursal_id', sucursalId);

  if ((mesas?.length ?? 0) >= MAX_MESAS_POR_SUCURSAL) {
    return Response.json(
      { error: `No se pueden superar las ${MAX_MESAS_POR_SUCURSAL} mesas por sucursal.` },
      { status: 400 }
    );
  }

  const siguienteNumero =
    mesas && mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;

  const { data: mesa, error } = await supabaseAdmin
    .from('mesas')
    .insert({ restaurante_id: id, sucursal_id: sucursalId, numero: siguienteNumero, estado: 'libre' })
    .select()
    .single();

  if (error) return errorInterno('POST mesa', error);

  return Response.json({ mesa }, { status: 201 });
}
