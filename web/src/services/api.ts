import { getSupabase } from './supabase';

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.error === "string" && obj.error) return obj.error;
  if (typeof obj.message === "string" && obj.message) return obj.message;
  return null;
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const token = data.session?.access_token;
  if (!token) throw new Error('No session token');
  return token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown | FormData } = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  let body = options.body;
  if (options.json !== undefined || options.body) {
    if (options.json instanceof FormData) {
       body = options.json;
    } else {
      headers.set('Content-Type', 'application/json');
      body = options.json !== undefined ? JSON.stringify(options.json) : options.body;
    }  
  }

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    body,
    credentials: 'include',
  });

  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const msg = extractErrorMessage(payload) ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return payload as T;
}


