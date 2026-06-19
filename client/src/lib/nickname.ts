/**
 * The chosen nickname persisted across query-param navigations (Home → ?duel /
 * ?group / ?join reload the page, dropping React state). sessionStorage keeps it
 * for the tab so the player does not have to retype it between screens.
 */
const KEY = 'trivyy:nickname';

export function getStoredNickname(): string {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStoredNickname(value: string): void {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // Private-mode or storage-disabled: fall back to retyping. Non-fatal.
  }
}
