import sharp from 'sharp';
import { pool } from '../db/pool';

/**
 * Avatar management service (spec Phase 1 UI overhaul, ARC-2). No Express types
 * here — I/O only via the Postgres pool and the sharp image processor. A player
 * may have either an uploaded image (stored as webp bytea) or a colour preset key,
 * never both. The contract is clear: setting one clears the other.
 *
 * OBS-1: image bytes are never logged.
 */

/** Colour preset keys available for selection. */
export const AVATAR_PRESETS = ['blue', 'green', 'pink', 'amber', 'violet', 'teal'] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/** Row shape returned by avatar-column queries. */
interface AvatarRow {
  avatar_preset: string | null;
  avatar_image: Buffer | null;
  avatar_mime: string | null;
}

/**
 * Process and store an uploaded image for a player. Validates the MIME type,
 * resizes to 256×256 cover-crop, converts to WebP at quality 80 (which also
 * strips metadata), and persists as bytea. Clears any preset.
 *
 * Throws `AvatarError` for validation failures (caller maps to 400).
 */
export async function setUploadedAvatar(
  playerId: string,
  buffer: Buffer,
  mime: string,
): Promise<void> {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new AvatarError('unsupported_mime_type');
  }

  // Resize + convert; this also strips EXIF/metadata (OBS-1).
  const processed = await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  await pool.query(
    `UPDATE players
        SET avatar_image      = $2,
            avatar_mime       = 'image/webp',
            avatar_updated_at = now(),
            avatar_preset     = NULL
      WHERE id = $1`,
    [playerId, processed],
  );
}

/**
 * Set a colour preset avatar for a player. Validates the key against the fixed
 * preset list and clears any stored image. Throws `AvatarError` on unknown key.
 */
export async function setPresetAvatar(playerId: string, key: string): Promise<void> {
  if (!(AVATAR_PRESETS as ReadonlyArray<string>).includes(key)) {
    throw new AvatarError('unknown_preset');
  }

  await pool.query(
    `UPDATE players
        SET avatar_preset     = $2,
            avatar_updated_at = now(),
            avatar_image      = NULL,
            avatar_mime       = NULL
      WHERE id = $1`,
    [playerId, key],
  );
}

/**
 * Retrieve a player's stored avatar image. Returns the processed buffer and its
 * MIME type, or null when the player has no uploaded image.
 */
export async function getAvatar(playerId: string): Promise<{ image: Buffer; mime: string } | null> {
  const result = await pool.query<AvatarRow>(
    `SELECT avatar_image, avatar_mime FROM players WHERE id = $1`,
    [playerId],
  );
  const row = result.rows[0];
  if (!row || !row.avatar_image || !row.avatar_mime) {
    return null;
  }
  return { image: row.avatar_image, mime: row.avatar_mime };
}

/**
 * Get the current avatar kind + preset key for a player (used by stats endpoint).
 * Returns a lightweight summary without loading image bytes.
 */
export async function getAvatarMeta(
  playerId: string,
): Promise<{ kind: 'none' | 'preset' | 'upload'; preset: string | null }> {
  const result = await pool.query<Pick<AvatarRow, 'avatar_preset' | 'avatar_image'>>(
    `SELECT avatar_preset, avatar_image IS NOT NULL AS has_image FROM players WHERE id = $1`,
    [playerId],
  );
  const row = result.rows[0];
  if (!row) {
    return { kind: 'none', preset: null };
  }
  // avatar_image comes back as boolean because of the IS NOT NULL expression
  const hasImage = (row as unknown as { has_image: boolean }).has_image;
  if (hasImage) {
    return { kind: 'upload', preset: null };
  }
  if (row.avatar_preset) {
    return { kind: 'preset', preset: row.avatar_preset };
  }
  return { kind: 'none', preset: null };
}

/** Domain error for avatar validation failures (not internal errors). */
export class AvatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarError';
  }
}
