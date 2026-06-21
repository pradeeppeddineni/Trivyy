/* eslint-disable */
/**
 * Schema v10 — player avatars (spec Phase 1 UI overhaul). Avatars are stored
 * as processed webp blobs in Postgres (bytea) rather than on disk — no compose
 * volume change required. A player may use either an uploaded image OR a preset
 * colour key, never both; both null means no avatar set.
 */

exports.up = (pgm) => {
  pgm.addColumn('players', {
    /** Preset colour key (e.g. 'blue', 'green'). Null when an upload is active. */
    avatar_preset: { type: 'text' },
    /** Processed 256×256 webp image bytes (metadata stripped). Null when preset is active. */
    avatar_image: { type: 'bytea' },
    /** MIME type for the stored image — always 'image/webp' when set. */
    avatar_mime: { type: 'text' },
    /** Last time the avatar was updated; used for cache busting. */
    avatar_updated_at: { type: 'timestamptz' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('players', ['avatar_preset', 'avatar_image', 'avatar_mime', 'avatar_updated_at']);
};
