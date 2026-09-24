import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../src/lib/api';
import {
  LIMITE_NOMBRE,
  MAX_MESAS_POR_SUCURSAL,
  MAX_SUCURSALES,
  MIN_PASSWORD,
  emailValido,
  enteroEnRango,
  textoEnRango,
} from '../../../../src/lib/validacion';

export async function POST(request: NextRequest) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const body = (await request.json().catch(() => ({}))) ?? {};
  const { email, password, nombre, sucursales = [], cantidadMesas = 0 } = body;

  if (!emailValido(email)) {
    return Response.json({ error: 'El email del dueño no es válido.' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 72) {
    return Response.json(
      { error: `La contraseña debe tener entre ${MIN_PASSWORD} y 72 caracteres.` },
      { status: 400 }
    );
  }

  if (!textoEnRango(nombre, 1, LIMITE_NOMBRE)) {
    return Response.json({ error: 'El nombre debe tener entre 1 y 120 caracteres.' }, { status: 400 });
  }

  if (!Array.isArray(sucursales) || sucursales.length === 0 || sucursales.length > MAX_SUCURSALES) {
    return Response.json(
      { error: `El restaurante debe tener entre 1 y ${MAX_SUCURSALES} sucursales.` },
      { status: 400 }
    );
  }

  const cantidad = enteroEnRango(cantidadMesas, 0, MAX_MESAS_POR_SUCURSAL);
  if (cantidad === null) {
    return Response.json(
      { error: `Las mesas por sucursal deben ser un entero entre 0 y ${MAX_MESAS_POR_SUCURSAL}.` },
      { status: 400 }
    );
  }

  const nombresSucursales = sucursales.map((s) => {
    const nombreSuc = typeof s === 'object' && s !== null ? String((s as { nombre?: unknown }).nombre ?? '') : '';
    return nombreSuc.trim().slice(0, LIMITE_NOMBRE);
  });

  const { data: nuevoUsuario, error: errorUsuario } = await supabaseAdmin.auth.admin.createUser({
    email: String(email).trim(),
    password,
    email_confirm: true,
  });

  if (errorUsuario) {
    return Response.json({ error: 'No se pudo crear la cuenta del dueño.' }, { status: 400 });
  }

  const { data: restaurante, error: errorRestaurante } = await supabaseAdmin
    .from('restaurantes')
    .insert({ nombre: String(nombre).trim(), usuario_id: nuevoUsuario.user.id })
    .select()
    .single();

  if (errorRestaurante) {
    await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return errorInterno('POST restaurante', errorRestaurante);
  }

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
    return errorInterno('POST restaurante (sucursales)', errorSucursales);
  }

  if (cantidad > 0) {
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
