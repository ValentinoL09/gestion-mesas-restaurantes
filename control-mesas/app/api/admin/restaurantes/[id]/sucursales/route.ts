import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../../src/lib/api';
import {
  LIMITE_NOMBRE,
  MAX_MESAS_POR_SUCURSAL,
  MAX_SUCURSALES,
  enteroEnRango,
  textoEnRango,
} from '../../../../../../src/lib/validacion';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/sucursales'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const { nombre, cantidadMesas } = body;

  if (nombre != null && nombre !== '' && !textoEnRango(nombre, 1, LIMITE_NOMBRE)) {
    return Response.json({ error: 'El nombre de la sucursal no puede superar los 120 caracteres.' }, { status: 400 });
  }

  const cantidad = enteroEnRango(cantidadMesas ?? 0, 0, MAX_MESAS_POR_SUCURSAL);
  if (cantidad === null) {
    return Response.json(
      { error: `Las mesas deben ser un entero entre 0 y ${MAX_MESAS_POR_SUCURSAL}.` },
      { status: 400 }
    );
  }

  const { data: existentes } = await supabaseAdmin
    .from('sucursales')
    .select('id')
    .eq('restaurante_id', id);

  if ((existentes?.length ?? 0) >= MAX_SUCURSALES) {
    return Response.json(
      { error: `No se pueden superar las ${MAX_SUCURSALES} sucursales.` },
      { status: 400 }
    );
  }

  const nombreFinal = String(nombre ?? '').trim() || `Sucursal ${(existentes?.length ?? 0) + 1}`;

  const { data: sucursal, error } = await supabaseAdmin
    .from('sucursales')
    .insert({ restaurante_id: id, nombre: nombreFinal })
    .select()
    .single();

  if (error) return errorInterno('POST sucursal', error);

  if (cantidad > 0) {
    const filas = Array.from({ length: cantidad }, (_, i) => ({
      restaurante_id: id,
      sucursal_id: sucursal.id,
      numero: i + 1,
      estado: 'libre',
    }));

    const { error: errorMesas } = await supabaseAdmin.from('mesas').insert(filas);
    if (errorMesas) {
      console.error('Admin: no se pudieron crear las mesas de la sucursal:', errorMesas.message);
    }
  }

  return Response.json({ sucursal }, { status: 201 });
}
