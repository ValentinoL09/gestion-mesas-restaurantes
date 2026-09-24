// Crea la cuenta del administrador de la plataforma en Supabase Auth.
//
// Uso (requiere Node 20+; lee NEXT_PUBLIC_SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY desde .env.local):
//
//   $env:ADMIN_PASSWORD = "contraseña"
//   node --env-file=.env.local scripts/crear_admin.mjs
//
// La contraseña se pasa por variable de entorno para no quedar en el repo.
// Es idempotente: si el email ya existe, avisa y termina sin error.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL || 'contacto.smarttable@gmail.com';
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (!password || password.length < 6) {
  console.error('Falta ADMIN_PASSWORD (mínimo 6 caracteres).');
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  const msg = error.message.toLowerCase();
  if (msg.includes('already') || msg.includes('exists') || error.code === 'user_exists') {
    console.log(`El email ${email} ya existe en Supabase Auth. No se hizo nada.`);
  } else {
    console.error(`No se pudo crear el usuario: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`Cuenta creada: ${email} (id ${data.user.id}), con email confirmado.`);
}