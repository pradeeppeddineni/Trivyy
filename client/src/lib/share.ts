/** Small wrappers around the clipboard + Web Share APIs, with safe fallbacks. */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareLink(title: string, text: string, url: string): Promise<void> {
  try {
    if (canNativeShare()) {
      await navigator.share({ title, text, url });
    }
  } catch {
    // User dismissed the share sheet, or it is unavailable — non-fatal.
  }
}
