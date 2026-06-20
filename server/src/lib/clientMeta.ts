import type { Request } from 'express';

export interface ClientMeta {
  readonly ip: string | null;
  readonly country: string | null;
}

/**
 * Coarse client metadata for analytics, read from Cloudflare's edge headers
 * (forwarded by nginx). `CF-Connecting-IP` is the real client IP; `CF-IPCountry`
 * is the ISO country code. These are stored for the single-admin dashboard only
 * — never logged and never returned to players (rules SEC-6). Cloudflare uses
 * `XX`/`T1` for unknown/Tor, which we treat as no country.
 */
export function clientMeta(req: Request): ClientMeta {
  const country = (req.header('cf-ipcountry') ?? '').toUpperCase();
  const ip = req.header('cf-connecting-ip') ?? req.ip ?? null;
  return {
    ip: ip || null,
    country: country && country !== 'XX' && country !== 'T1' ? country : null,
  };
}
