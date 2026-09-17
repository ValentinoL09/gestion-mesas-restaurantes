import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { email, password, nombre, sucursales = [], cantidadMesas = 0 } = body ?? {};

  if (!email || !password || !nombre) {
    return Response.json(
      { error: 'Faltan datos: email, password y nombre del restaurante.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(sucursales) || sucursales.length === 0) {
    return Response.json(
      { error: 'El restaurante necesita al menos una sucursal.' },
      { status: 400 }
    );
  }

  const nombresSucursales = sucursales.map((s) => {
    const nombreSuc = typeof s === 'object' && s !== null ? String(s.nombre ?? '') : '';
    return nombreSuc.trim();
  });

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

  // Crear las sucursales de la marca (con/título por defecto si el nombre es vacío).
  const filasSucursales = nombresSucursales.map((nombreSuc, i) => ({
    restaurante_id: restaurante.id,
    nombre: nombreSuc || `Sucursal ${i + 1}`,
  }));

  const { data: sucursalesCreadas, error: errorSucursales } = await supabaseAdmin
    .from('sucursales')
    .insert(filasSucursales)
    .select('id');

  if (errorSucursales) {
    await supabaseAdmin.from('restaurantes').delete().eq('id', restaurante.id);
    await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return Response.json({ error: errorSucursales.message }, { status: 500 });
  }

  const cantidad = Number(cantidadMesas);
  if (Number.isInteger(cantidad) && cantidad > 0) {
    const filas = sucursalesCreadas.flatMap((suc) =>
      Array.from({ length: cantidad }, (_, j) => ({
        restaurante_id: restaurante.id,
        sucursal_id: suc.id,
        numero: j + 1,
        estado: 'libre',
      }))
    );

    const { error: errorMesas } = await supabaseAdmin.from('mesas').insert(filas);
    if (errorMesas) {
      console.error('Admin: no se pudieron crear las mesas iniciales:', errorMesas.message);
    }
  }

  return Response.json({ restaurante }, { status: 201 });
}