import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase-server';

export default async function ConfigurarRestauranteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <>{children}</>;
}