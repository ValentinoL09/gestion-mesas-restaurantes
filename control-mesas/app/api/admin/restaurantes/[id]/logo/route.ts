import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../src/lib/supabase-admin';
import { autorizarAdmin, errorInterno } from '../../../../../../src/lib/api';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Verifica la firma binaria para aceptar solo imágenes reales. */
function esImagenPorBytes(bytes: Buffer): boolean {
  if (bytes.length < 12) return false;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
  // WebP (RIFF....WEBP)
  if (
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }
  return false;
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/restaurantes/[id]/logo'>
) {
  const auth = await autorizarAdmin(request);
  if (!auth.ok) return auth.respuesta;

  const { id } = await ctx.params;

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get('logo');

  if (!(archivo instanceof File)) {
    return Response.json({ error: 'Falta el archivo de logo.' }, { status: 400 });
  }

  if (!archivo.type.startsWith('image/')) {
    return Response.json({ error: 'El archivo debe ser una imagen.' }, { status: 400 });
  }

  if (archivo.size > MAX_LOGO_BYTES) {
    return Response.json({ error: 'La imagen no puede superar los 2 MB.' }, { status: 400 });
  }

  const { data: restaurante } = await supabaseAdmin
    .from('restaurantes')
    .select('id')
    .eq('id', id)
    .single();

  if (!restaurante) return Response.json({ error: 'Restaurante no encontrado.' }, { status: 404 });

  const bytes = Buffer.from(await archivo.arrayBuffer());

  if (!esImagenPorBytes(bytes)) {
    return Response.json({ error: 'El archivo no parece una imagen válida.' }, { status: 400 });
  }

  const rutaLogo = `${id}/logo`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('logos')
    .upload(rutaLogo, bytes, {
      contentType: archivo.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) return errorInterno('POST logo (upload)', uploadError);

  const logoUrl = supabaseAdmin.storage.from('logos').getPublicUrl(rutaLogo).data.publicUrl;

  const { error: updateError } = await supabaseAdmin
    .from('restaurantes')
    .update({ logo_url: logoUrl })
    .eq('id', id);

  if (updateError) return errorInterno('POST logo (update)', updateError);

  return Response.json({ logo_url: logoUrl });
}
