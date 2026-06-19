/**
 * The curated category set shown in Setup. Slugs MUST match the server's
 * `categories` table (server/src/seed/categories.ts and the migration). The
 * `any` tile is "Surprise me" — no filter, sent as no categorySlug.
 */
export interface CategoryChoice {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
}

export const SURPRISE_ME: CategoryChoice = { slug: 'any', label: 'Surprise me', icon: '🎲' };

export const CATEGORIES: ReadonlyArray<CategoryChoice> = [
  { slug: 'science', label: 'Science', icon: '🔬' },
  { slug: 'geography', label: 'Geography', icon: '🌍' },
  { slug: 'movies', label: 'Movies', icon: '🎬' },
  { slug: 'music', label: 'Music', icon: '🎵' },
  { slug: 'history', label: 'History', icon: '📜' },
  { slug: 'tech', label: 'Tech', icon: '💻' },
];

export const SETUP_CATEGORIES: ReadonlyArray<CategoryChoice> = [SURPRISE_ME, ...CATEGORIES];
