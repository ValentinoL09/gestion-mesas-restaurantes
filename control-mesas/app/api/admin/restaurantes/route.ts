import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';

export async function GET() {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { data: restaurantes, error } = await supabaseAdmin
    .from('restaurantes')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: usuarios } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const correos = new Map<string, string>();
  usuarios?.users.forEach((u) => correos.set(u.id, u.email ?? ''));

  const { data: mesas } = await supabaseAdmin.from('mesas').select('restaurante_id');
  const conteoMesas = new Map<string, number>();
  mesas?.forEach((m) =>
    conteoMesas.set(m.restaurante_id, (conteoMesas.get(m.restaurante_id) ?? 0) + 1)
  );

  return Response.json({
    restaurantes: (restaurantes ?? []).map((r) => ({
      ...r,
      email_dueño: r.usuario_id ? correos.get(r.usuario_id) ?? null : null,
      cantidad_mesas: conteoMesas.get(r.id) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { email, password, nombre, cantidadMesas = 0 } = body ?? {};

  if (!email || !password || !nombre) {
    return Response.json(
      { error: 'Faltan datos: email, password y nombre del restaurante.' },
      { status: 400 }
    );
  }

  const { data: nuevoUsuario, error: errorUsuario } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errorUsuario) {
    return Response.json({ error: errorUsuario.message }, { status: 400 });
  }

  const { data: restaurante, error: errorRestaurante } = await supabaseAdmin
    .from('restaurantes')
    .insert({ nombre, usuario_id: nuevoUsuario.user.id })
    .select()
    .single();

  if (errorRestaurante) {
    await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return Response.json({ error: errorRestaurante.message }, { status: 500 });
  }

  const cantidad = Number(cantidadMesas);
  if (Number.isInteger(cantidad) && cantidad > 0) {
    const filas = Array.from({ length: cantidad }, (_, i) => ({
      restaurante_id: restaurante.id,
      numero: i + 1,
      estado: 'libre',
    }));

    const { error: errorMesas } = await supabaseAdmin.from('mesas').insert(filas);
    if (errorMesas) {
      console.error('Admin: no se pudieron crear las mesas iniciales:', errorMesas.message);
    }
  }

  return Response.json({ restaurante }, { status: 201 });
}