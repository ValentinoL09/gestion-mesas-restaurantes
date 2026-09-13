export function minutosTranscurridos(fechaIso: string, ahora: Date = new Date()): string {
  const dif = Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 60000);
  return dif < 1 ? 'ahora' : `hace ${dif} min`;
}

export function urlMesaQR(urlBase: string, mesaId: string): string {
  return `${urlBase}/m/${mesaId}`;
}

export function etiquetaCuenta(metodoPago: string | null): string {
  return metodoPago === 'tarjeta'
    ? '💳 Paga con Tarjeta'
    : '💵 Paga con Efectivo / Transferencia';
}