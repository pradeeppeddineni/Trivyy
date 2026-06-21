/** Bottom-nav tabs. `search` is the query string each tab navigates to. */
export interface TabItem {
  readonly key: string;
  readonly label: string;
  readonly search: string;
  readonly primary?: boolean;
}

export const TAB_ITEMS: ReadonlyArray<TabItem> = [
  { key: 'home', label: 'Home', search: '' },
  { key: 'friends', label: 'Friends', search: '?friends' },
  { key: 'play', label: 'Play', search: '?solo', primary: true },
  { key: 'boards', label: 'Boards', search: '?groups' },
  { key: 'you', label: 'You', search: '?me' },
];

/**
 * The active tab for the current query params, or null on non-tab screens
 * (duel/group/join/admin/account) where the nav is hidden. The home tab covers
 * both the default screen and the solo setup (`?solo`).
 */
export function activeTab(params: URLSearchParams): string | null {
  if (params.has('friends') || params.has('friend')) return 'friends';
  if (params.has('groups') || params.has('gjoin')) return 'boards';
  if (params.has('me')) return 'you';
  if (params.has('solo') || [...params.keys()].length === 0) return 'home';
  return null;
}
