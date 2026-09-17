import NavAdmin from './_nav';
import ListaAdmin from './_lista';
import { supabaseAdmin } from '../../src/lib/supabase-admin';

export default async function AdminRestaurantes() {
  const { data: restaurantes, error } = await supabaseAdmin
    .from('restaurantes')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);

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

  const { data: sucursales } = await supabaseAdmin.from('sucursales').select('restaurante_id');
  const conteoSucursales = new Map<string, number>();
  sucursales?.forEach((s) =>
    conteoSucursales.set(s.restaurante_id, (conteoSucursales.get(s.restaurante_id) ?? 0) + 1)
  );

  const lista = (restaurantes ?? []).map((r) => ({
    ...r,
    email_dueño: r.usuario_id ? correos.get(r.usuario_id) ?? null : null,
    cantidad_mesas: conteoMesas.get(r.id) ?? 0,
    cantidad_sucursales: conteoSucursales.get(r.id) ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavAdmin actual="lista" />
      <ListaAdmin restaurantes={lista} />
    </div>
  );
}