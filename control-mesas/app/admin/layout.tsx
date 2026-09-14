import { redirect } from 'next/navigation';
import { createClient } from '../../src/lib/supabase-server';
import { esAdmin } from '../../src/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) redirect('/login');

  return (
    <div
      className="min-h-screen font-sans"
      style={
        {
          '--t-primario': '#2563eb',
          '--t-secundario': '#0a0a0a',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}