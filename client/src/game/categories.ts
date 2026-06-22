/**
 * The curated category set shown in Setup. Slugs MUST match the server's
 * `categories` table (server/src/seed/categories.ts and the migration). The
 * `any` tile is "Surprise me" — no filter, sent as no categorySlug.
 *
 * The `icon` field previously held an emoji. It is now the slug string used
 * to render a <CategoryIcon slug={icon} /> in place of a literal emoji.
 * All rendering uses CategoryIcon; no emoji is emitted.
 */
export interface CategoryChoice {
  readonly slug: string;
  readonly label: string;
  /** Slug key passed to CategoryIcon — same as `slug`. Kept for source compatibility. */
  readonly icon: string;
}

export const SURPRISE_ME: CategoryChoice = { slug: 'any', label: 'Surprise me', icon: 'any' };

export const CATEGORIES: ReadonlyArray<CategoryChoice> = [
  { slug: 'science', label: 'Science', icon: 'science' },
  { slug: 'geography', label: 'Geography', icon: 'geography' },
  { slug: 'movies', label: 'Movies', icon: 'movies' },
  { slug: 'music', label: 'Music', icon: 'music' },
  { slug: 'history', label: 'History', icon: 'history' },
  { slug: 'tech', label: 'Tech', icon: 'tech' },
];

export const SETUP_CATEGORIES: ReadonlyArray<CategoryChoice> = [SURPRISE_ME, ...CATEGORIES];
