/**
 * The curated category set shown in the UI. Mirrors the rows inserted by the
 * `three_modes_and_categories` migration; the slugs MUST match.
 */
export const CURATED_CATEGORIES = [
  { slug: 'science', label: 'Science', icon: '🔬' },
  { slug: 'geography', label: 'Geography', icon: '🌍' },
  { slug: 'movies', label: 'Movies', icon: '🎬' },
  { slug: 'music', label: 'Music', icon: '🎵' },
  { slug: 'history', label: 'History', icon: '📜' },
  { slug: 'tech', label: 'Tech', icon: '💻' },
] as const;

export type CategorySlug = (typeof CURATED_CATEGORIES)[number]['slug'];

/**
 * Map an OpenTDB category name onto one of the six curated slugs, or `null` when
 * it doesn't fit (those questions still appear under "Surprise me"). Keyword
 * matching is robust to OpenTDB's "Entertainment:"/"Science:" prefixes. Order
 * matters: more specific buckets (tech) are checked before the broad `science`.
 */
export function mapOpenTdbCategory(name: string): CategorySlug | null {
  const n = name.toLowerCase();
  if (n.includes('geography')) return 'geography';
  if (n.includes('history') || n.includes('mythology') || n.includes('politics')) return 'history';
  if (n.includes('music')) return 'music';
  if (
    n.includes('film') ||
    n.includes('television') ||
    n.includes('anime') ||
    n.includes('cartoon')
  )
    return 'movies';
  if (
    n.includes('computer') ||
    n.includes('gadget') ||
    n.includes('video game') ||
    n.includes('board game') ||
    n.includes('vehicle')
  )
    return 'tech';
  if (
    n.includes('science') ||
    n.includes('nature') ||
    n.includes('mathematic') ||
    n.includes('animal')
  )
    return 'science';
  return null;
}
