import { notFound } from 'next/navigation';
import { createClient } from '../../../../src/lib/supabase-server';
import FormConfiguracion from './_form';

export default async function ConfiguracionRestaurante({
  params,
}: {
  params: Promise<{ restauranteID: string }>;
}) {
  const { restauranteID } = await params;
  const supabase = await createClient();

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('nombre, url_carta, url_resenas, logo_url')
    .eq('id', restauranteID)
    .single();

  if (!restaurante) notFound();

  return (
    <FormConfiguracion
      restauranteID={restauranteID}
      initial={{
        nombre: restaurante.nombre ?? '',
        url_carta: restaurante.url_carta ?? '',
        url_resenas: restaurante.url_resenas ?? '',
        logo_url: restaurante.logo_url ?? null,
      }}
    />
  );
}