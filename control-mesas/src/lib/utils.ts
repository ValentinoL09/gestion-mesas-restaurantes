export function minutosTranscurridos(fechaIso: string, ahora: Date = new Date()): string {
  const dif = Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 60000);
  return dif < 1 ? 'ahora' : `hace ${dif} min`;
}

export function urlMesaQR(urlBase: string, mesaId: string): string {
  return `${urlBase}/m/${mesaId}`;
}