import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../src/lib/api';
import {
  LIMITE_NOMBRE,
  colorHexValido,
  textoEnRango,
  urlValida,
} from '../../../../../src/lib/validacion';
import type { TablesUpdate } from '../../../../../src/lib/database.types';

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/admin/restaurantes/[id]'>) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};

  const cambios: TablesUpdate<'restaurantes'> = {};

  if ('nombre' in body) {
    if (!textoEnRango(body.nombre, 1, LIMITE_NOMBRE)) {
      return Response.json({ error: 'El nombre debe tener entre 1 y 120 caracteres.' }, { status: 400 });
    }
    cambios.nombre = String(body.nombre).trim();
  }

  if ('url_carta' in body) {
    const carta = body.url_carta;
    if (carta !== null && carta !== '' && urlValida(carta) === null) {
      return Response.json({ error: 'La URL de la carta debe ser un enlace http(s) válido.' }, { status: 400 });
    }
    cambios.url_carta = urlValida(carta);
  }

  if ('url_resenas' in body) {
    const resenas = body.url_resenas;
    if (resenas !== null && resenas !== '' && urlValida(resenas) === null) {
      return Response.json({ error: 'La URL de reseñas debe ser un enlace http(s) válido.' }, { status: 400 });
    }
    cambios.url_resenas = urlValida(resenas);
  }

  if ('logo_url' in body) {
    const logo = body.logo_url;
    if (logo !== null && logo !== '' && urlValida(logo) === null) {
      return Response.json({ error: 'La URL del logo no es válida.' }, { status: 400 });
    }
    cambios.logo_url = urlValida(logo);
  }

  if ('color_primario' in body) {
    const color = colorHexValido(body.color_primario);
    if (!color) return Response.json({ error: 'El color principal debe ser hexadecimal (#rrggbb).' }, { status: 400 });
    cambios.color_primario = color;
  }

  if ('color_secundario' in body) {
    const color = colorHexValido(body.color_secundario);
    if (!color) return Response.json({ error: 'El color secundario debe ser hexadecimal (#rrggbb).' }, { status: 400 });
    cambios.color_secundario = color;
  }

  if (Object.keys(cambios).length === 0) {
    return Response.json({ error: 'Sin cambios para guardar.' }, { status: 400 });
  }

  const { data: restaurante, error } = await supabaseAdmin
    .from('restaurantes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorInterno('PUT restaurante', error);

  return Response.json({ restaurante });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

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
  if (error) return errorInterno('DELETE restaurante', error);

  if (restaurante.usuario_id) {
    await supabaseAdmin.auth.admin.deleteUser(restaurante.usuario_id);
  }

  return Response.json({ ok: true });
}
