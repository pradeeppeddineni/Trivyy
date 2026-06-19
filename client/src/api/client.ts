/** Thin fetch wrapper for the Trivyy REST API. */

export interface SessionResponse {
  nickname: string;
}

export async function createSession(nickname: string): Promise<SessionResponse> {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    throw new Error('Could not start a session');
  }
  return (await res.json()) as SessionResponse;
}
