// Normaliza NOTARY_SERVICE_URL para que siempre termine en /api/v1,
// sin importar si la variable de entorno ya incluye el sufijo o no.
export function getNotaryBaseUrl(): string {
  let baseUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3004/api/v1';
  if (baseUrl && !baseUrl.endsWith('/api/v1')) {
    baseUrl = baseUrl.replace(/\/$/, '') + '/api/v1';
  }
  return baseUrl;
}
