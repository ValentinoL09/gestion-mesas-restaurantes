import type { NextConfig } from 'next';

// Origen de Supabase derivado del entorno para no depender de un comodín fijo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseHttp = 'https://*.supabase.co';
let supabaseWs = 'wss://*.supabase.co';
try {
  const u = new URL(supabaseUrl);
  supabaseHttp = u.origin;
  supabaseWs = `wss://${u.host}`;
} catch {
  // Sin URL válida se mantiene el comodín por defecto.
}

const esDesarrollo = process.env.NODE_ENV !== 'production';

// CSP pragmática: permite lo que Next (scripts inline de hidratación) y
// Supabase (API, storage y realtime) necesitan, y bloquea el resto.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHttp}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHttp} ${supabaseWs}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const headersSeguridad = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [{ source: '/(.*)', headers: headersSeguridad }];
  },
};

export default nextConfig;
