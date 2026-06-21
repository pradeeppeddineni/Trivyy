/**
 * Region filter options for the setup screen (spec §5.6). 'any' means no region
 * filter; the rest are ISO-3166 alpha-2 codes the server filters questions by.
 * Kept short and curated; the admin can author questions for any region code.
 */
export interface RegionOption {
  readonly code: string; // 'any' | ISO alpha-2
  readonly label: string;
}

export const REGIONS: ReadonlyArray<RegionOption> = [
  { code: 'any', label: 'Anywhere' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'US', label: '🇺🇸 USA' },
  { code: 'GB', label: '🇬🇧 UK' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'CA', label: '🇨🇦 Canada' },
];
