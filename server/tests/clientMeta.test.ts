import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { clientMeta } from '../src/lib/clientMeta';

/** Minimal Request stub exposing just header() + ip. */
function fakeReq(headers: Record<string, string>, ip?: string): Request {
  return {
    header: (name: string) => headers[name.toLowerCase()],
    ip,
  } as unknown as Request;
}

describe('clientMeta', () => {
  it('reads Cloudflare ip + country headers', () => {
    const meta = clientMeta(fakeReq({ 'cf-connecting-ip': '203.0.113.7', 'cf-ipcountry': 'us' }));
    expect(meta.ip).toBe('203.0.113.7');
    expect(meta.country).toBe('US');
  });

  it('falls back to req.ip when no CF header is present', () => {
    const meta = clientMeta(fakeReq({}, '198.51.100.4'));
    expect(meta.ip).toBe('198.51.100.4');
    expect(meta.country).toBeNull();
  });

  it('treats XX / T1 (unknown / Tor) as no country', () => {
    expect(clientMeta(fakeReq({ 'cf-ipcountry': 'XX' })).country).toBeNull();
    expect(clientMeta(fakeReq({ 'cf-ipcountry': 'T1' })).country).toBeNull();
  });

  it('returns nulls when nothing is available', () => {
    const meta = clientMeta(fakeReq({}));
    expect(meta.ip).toBeNull();
    expect(meta.country).toBeNull();
  });
});
