import { redirect } from 'next/navigation';
import { createClient } from '../../../src/lib/supabase-server';

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
    .select('id')
    .eq('id', restauranteID)
    .eq('usuario_id', user.id)
    .single();

  if (!restaurante) redirect('/login');

  return <>{children}</>;
}