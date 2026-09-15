import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/sucursales'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;

  const { data: sucursales, error } = await supabaseAdmin
    .from('sucursales')
    .select('*')
    .eq('restaurante_id', id)
    .order('creado_en');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: mesas } = await supabaseAdmin.from('mesas').select('sucursal_id');
  const conteoMesas = new Map<string, number>();
  mesas?.forEach((m) =>
    conteoMesas.set(m.sucursal_id, (conteoMesas.get(m.sucursal_id) ?? 0) + 1)
  );

  return Response.json({
    sucursales: (sucursales ?? []).map((s) => ({
      ...s,
      cantidad_mesas: conteoMesas.get(s.id) ?? 0,
    })),
  });
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/sucursales'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const { nombre, cantidadMesas } = body;

  const { data: existentes } = await supabaseAdmin
    .from('sucursales')
    .select('id')
    .eq('restaurante_id', id);

  // Nombre vacío ⇒ el número de sucursal que sigue.
  const nombreFinal = String(nombre ?? '').trim() || `Sucursal ${(existentes?.length ?? 0) + 1}`;

  const { data: sucursal, error } = await supabaseAdmin
    .from('sucursales')
    .insert({ restaurante_id: id, nombre: nombreFinal })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const cantidad = Number(cantidadMesas);
  if (Number.isInteger(cantidad) && cantidad > 0) {
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