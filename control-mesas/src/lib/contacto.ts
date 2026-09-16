export const NOMBRE_PRODUCTO = 'SmartTable';

export const EMAIL_COMERCIAL = 'contacto@smarttable.com';

const ASUNTO_PREDETERMINADO = `Consulta por ${NOMBRE_PRODUCTO}`;

const CUERPO_PREDETERMINADO = `Hola ${NOMBRE_PRODUCTO}:

Me gustaría recibir más información sobre el sistema de mesas por QR.

Quedo atento/a.`;

export function urlGmailCompose(): string {
  return (
    'https://mail.google.com/mail/?view=cm&fs=1' +
    `&to=${encodeURIComponent(EMAIL_COMERCIAL)}` +
    `&su=${encodeURIComponent(ASUNTO_PREDETERMINADO)}` +
    `&body=${encodeURIComponent(CUERPO_PREDETERMINADO)}`
  );
}