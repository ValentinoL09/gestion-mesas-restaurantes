import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/mesas'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const { sucursalId } = body;

  if (!sucursalId) {
    return Response.json({ error: 'Faltan datos: sucursalId.' }, { status: 400 });
  }

  const { data: mesas } = await supabaseAdmin
    .from('mesas')
    .select('numero')
    .eq('sucursal_id', sucursalId);

  const siguienteNumero =
    mesas && mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;

  const { data: mesa, error } = await supabaseAdmin
    .from('mesas')
    .insert({ restaurante_id: id, sucursal_id: sucursalId, numero: siguienteNumero, estado: 'libre' })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ mesa }, { status: 201 });
}