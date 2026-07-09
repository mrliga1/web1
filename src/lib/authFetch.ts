import { supabase } from '../supabase';

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
