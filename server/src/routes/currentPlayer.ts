import type { Request } from 'express';
import { getOrCreatePlayer, getPlayerById, type PlayerRow } from '../services/playerService';
import { clientMeta } from '../lib/clientMeta';

/**
 * Resolve the players row for the current request from the session. A registered
 * player is identified by `req.session.playerId` and works on any device; a
 * guest falls back to the nickname keyed on `req.sessionID` (SEC-3). Returns
 * null when neither is present so the route can answer 401 without leaking.
 * Refreshes client meta (location + last_seen_at) on every interaction.
 */
export async function resolveCurrentPlayer(req: Request): Promise<PlayerRow | null> {
  if (req.session.playerId) {
    return getPlayerById(req.session.playerId, clientMeta(req));
  }
  const nickname = req.session.nickname;
  if (!nickname) {
    return null;
  }
  return getOrCreatePlayer(req.sessionID, nickname, clientMeta(req));
}
