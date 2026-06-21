import { describe, it, expect, vi, afterEach } from 'vitest';
import { loginAccount, authMe } from './client';

function mockFetch(status: number, body: unknown = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('loginAccount status mapping', () => {
  it('maps 200 → ok', async () => {
    mockFetch(200, { account: {} });
    expect(await loginAccount('ada', 'pw')).toBe('ok');
  });
  it('maps 401 → invalid', async () => {
    mockFetch(401);
    expect(await loginAccount('ada', 'pw')).toBe('invalid');
  });
  it('maps 429 → rate_limited', async () => {
    mockFetch(429);
    expect(await loginAccount('ada', 'pw')).toBe('rate_limited');
  });
});

describe('authMe', () => {
  it('returns null for a guest (401)', async () => {
    mockFetch(401);
    expect(await authMe()).toBeNull();
  });
  it('returns the account when signed in', async () => {
    mockFetch(200, { account: { id: '1', nickname: 'Ada', username: 'ada', inviteCode: 'ABCDE' } });
    const acc = await authMe();
    expect(acc?.username).toBe('ada');
  });
});
