import { createClient } from '@supabase/supabase-js';

// Pegamos los strings crudos temporalmente
const supabaseUrl = "https://tmnzlkkaixgezesbozsd.supabase.co";
const supabaseKey = "sb_publishable_uogDXy7ijMsQ-VrF5r5N6w_3OWeRzvM";

export const supabase = createClient(supabaseUrl, supabaseKey);