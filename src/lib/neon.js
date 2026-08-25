export const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-calm-shape-aux4hut6.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth';
export const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || '';

export async function dataApi(path, { token, method = 'GET', body, headers = {} } = {}) {
  if (!neonDataApiUrl) throw new Error('VITE_NEON_DATA_API_URL não configurada.');
  const response = await fetch(`${neonDataApiUrl}/${path.replace(/^\//, '')}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(await response.text() || `Neon Data API ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}
