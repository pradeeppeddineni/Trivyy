import type { Request } from 'express';
import { getOrCreatePlayer, type PlayerRow } from '../services/playerService';
import { clientMeta } from '../lib/clientMeta';

/**
 * Resolve the players row for the current request from the session. A game needs
 * a player id; the player is keyed on `req.sessionID` (SEC-3). Returns null when
 * the session has no nickname yet so the route can answer 401 without leaking.
 * Passes client meta so location + last_seen_at stay fresh on every interaction.
 */
export async function resolveCurrentPlayer(req: Request): Promise<PlayerRow | null> {
  const nickname = req.session.nickname;
  if (!nickname) {
    return null;
  }
  return getOrCreatePlayer(req.sessionID, nickname, clientMeta(req));
}
