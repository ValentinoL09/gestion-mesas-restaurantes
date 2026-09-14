import { NextRequest } from 'next/server';
import { obtenerAdmin } from '../../../../../../src/lib/requerirAdmin';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/logo'>
) {
  const admin = await obtenerAdmin();
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;

  const formData = await request.formData();
  const archivo = formData.get('logo');

  if (!(archivo instanceof File)) {
    return Response.json({ error: 'Falta el archivo de logo.' }, { status: 400 });
  }

  if (!archivo.type.startsWith('image/')) {
    return Response.json({ error: 'El archivo debe ser una imagen.' }, { status: 400 });
  }

  if (archivo.size > MAX_LOGO_BYTES) {
    return Response.json({ error: 'La imagen no puede superar los 2 MB.' }, { status: 400 });
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const rutaLogo = `${id}/logo`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('logos')
    .upload(rutaLogo, bytes, {
      contentType: archivo.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const logoUrl = supabaseAdmin.storage.from('logos').getPublicUrl(rutaLogo).data.publicUrl;

  const { error: updateError } = await supabaseAdmin
    .from('restaurantes')
    .update({ logo_url: logoUrl })
    .eq('id', id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ logo_url: logoUrl });
}