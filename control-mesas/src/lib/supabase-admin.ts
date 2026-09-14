import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Cliente con la SERVICE ROLE KEY: ignora las políticas RLS.
 * SOLO debe usarse en el servidor (Route Handlers / Server Components).
 * NUNCA debe exponerse al navegador.
 */
export const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);