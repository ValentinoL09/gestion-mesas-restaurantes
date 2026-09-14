import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;

  const { data: mesas, error } = await supabaseAdmin
    .from('mesas')
    .select('*')
    .eq('restaurante_id', id)
    .order('numero');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ mesas: mesas ?? [] });
}

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;

  const { data: mesas } = await supabaseAdmin
    .from('mesas')
    .select('numero')
    .eq('restaurante_id', id);

  const siguienteNumero =
    mesas && mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;

  const { data: mesa, error } = await supabaseAdmin
    .from('mesas')
    .insert({ restaurante_id: id, numero: siguienteNumero, estado: 'libre' })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ mesa }, { status: 201 });
}