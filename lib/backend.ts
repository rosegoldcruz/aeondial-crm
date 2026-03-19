function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

export const BACKEND_URL =
  sanitizeEnv(process.env.NEXT_PUBLIC_AEONDIAL_BACKEND_URL) ||
  sanitizeEnv(process.env.NEXT_PUBLIC_BACKEND_URL) ||
  'http://localhost:4000';

export const ORG_ID = sanitizeEnv(process.env.NEXT_PUBLIC_ORG_ID) || 'default-tenant';
export const USER_ID = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ID) || 'crm-user';
export const USER_ROLE = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ROLE) || 'admin';

export function getApiHeaders(orgId = ORG_ID): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-org-id': orgId,
    'x-user-id': USER_ID,
    'x-role': USER_ROLE,
  };
}

export function toWebSocketUrl(httpUrl: string): string {
  if (httpUrl.startsWith('https://')) {
    return httpUrl.replace('https://', 'wss://');
  }
  if (httpUrl.startsWith('http://')) {
    return httpUrl.replace('http://', 'ws://');
  }
  return httpUrl;
}

export async function apiGet<T>(path: string, orgId = ORG_ID): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: getApiHeaders(orgId),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  orgId = ORG_ID,
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: getApiHeaders(orgId),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}
