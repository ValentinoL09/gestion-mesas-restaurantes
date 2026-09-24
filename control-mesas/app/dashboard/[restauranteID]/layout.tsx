import { redirect } from 'next/navigation';
import { createClient } from '../../../src/lib/supabase-server';
import { urlSegura, colorSegura } from '../../../src/lib/utils';
import { TemaProvider, TEMA_DEFAULT, type TemaRestaurante } from './_tema';
import { SucursalesProvider } from './_sucursales';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restauranteID: string }>;
}) {
  const { restauranteID } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('id, nombre, logo_url, color_primario, color_secundario')
    .eq('id', restauranteID)
    .eq('usuario_id', user.id)
    .single();

  if (!restaurante) redirect('/login');

  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('id, nombre')
    .eq('restaurante_id', restauranteID)
    .order('nombre');

  const tema: TemaRestaurante = {
    nombre: restaurante.nombre,
    logoUrl: urlSegura(restaurante.logo_url),
    colorPrimario: colorSegura(restaurante.color_primario, TEMA_DEFAULT.colorPrimario),
    colorSecundario: colorSegura(restaurante.color_secundario, TEMA_DEFAULT.colorSecundario),
  };

  return (
    <TemaProvider tema={tema}>
      <SucursalesProvider sucursales={sucursales ?? []}>
        <div
          className="min-h-screen font-sans"
          style={
            {
              '--t-primario': tema.colorPrimario,
              '--t-secundario': tema.colorSecundario,
            } as React.CSSProperties
          }
        >
          {children}
        </div>
      </SucursalesProvider>
    </TemaProvider>
  );
}