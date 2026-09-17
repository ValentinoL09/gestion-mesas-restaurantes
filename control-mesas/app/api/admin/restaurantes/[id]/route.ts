import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../src/lib/supabase-admin';
import type { TablesUpdate } from '../../../../../src/lib/database.types';

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/admin/restaurantes/[id]'>) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json()) ?? {};

  const cambios: TablesUpdate<'restaurantes'> = {};
  if ('nombre' in body) cambios.nombre = body.nombre ?? null;
  if ('url_carta' in body) cambios.url_carta = body.url_carta ?? null;
  if ('logo_url' in body) cambios.logo_url = body.logo_url ?? null;
  if ('color_primario' in body) cambios.color_primario = body.color_primario ?? null;
  if ('color_secundario' in body) cambios.color_secundario = body.color_secundario ?? null;

  if (Object.keys(cambios).length === 0) {
    return Response.json({ error: 'Sin cambios para guardar.' }, { status: 400 });
  }

  const { data: restaurante, error } = await supabaseAdmin
    .from('restaurantes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ restaurante });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;

  const { data: restaurante } = await supabaseAdmin
    .from('restaurantes')
    .select('usuario_id')
    .eq('id', id)
    .single();

  if (!restaurante) return Response.json({ error: 'Restaurante no encontrado.' }, { status: 404 });

  const { data: mesas } = await supabaseAdmin.from('mesas').select('id').eq('restaurante_id', id);
  const mesaIds = mesas?.map((m) => m.id) ?? [];

  if (mesaIds.length > 0) {
    await supabaseAdmin.from('sesiones_clientes').delete().in('mesa_id', mesaIds);
    await supabaseAdmin.from('peticiones').delete().in('mesa_id', mesaIds);
  }
  await supabaseAdmin.from('peticiones').delete().eq('restaurante_id', id);
  await supabaseAdmin.from('mesas').delete().eq('restaurante_id', id);
  await supabaseAdmin.from('sucursales').delete().eq('restaurante_id', id);

  const { error } = await supabaseAdmin.from('restaurantes').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (restaurante.usuario_id) {
    await supabaseAdmin.auth.admin.deleteUser(restaurante.usuario_id);
  }

  return Response.json({ ok: true });
}