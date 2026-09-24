import { createClient } from '../../../src/lib/supabase-server';
import PantallaComensal from './_comensal';
import type { Tables } from '../../../src/lib/database.types';

export default async function MesaComensal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mesaData } = await supabase
    .from('mesas')
    .select('*')
    .eq('id', id)
    .single();

  if (!mesaData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Mesa no encontrada 😕
      </div>
    );
  }

  const mesa: Tables<'mesas'> = mesaData;

  const [{ data: restaurante }, { data: peticiones }] = await Promise.all([
    supabase
      .from('restaurantes_publico')
      .select('url_carta, url_resenas, logo_url, color_primario, color_secundario, nombre')
      .eq('id', mesa.restaurante_id)
      .single(),
    supabase
      .from('peticiones')
      .select('tipo')
      .eq('mesa_id', id)
      .eq('estado', 'pendiente'),
  ]);

  return (
    <PantallaComensal
      id={id}
      mesa={mesa}
      restaurante={restaurante ?? null}
      tiposPendientes={(peticiones ?? []).map((p) => p.tipo)}
    />
  );
}