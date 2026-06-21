import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyText, canNativeShare, shareLink } from './share';

afterEach(() => vi.restoreAllMocks());

describe('copyText', () => {
  it('returns true when the clipboard write succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyText('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    vi.unstubAllGlobals();
  });

  it('returns false when the clipboard write fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    expect(await copyText('hello')).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('canNativeShare', () => {
  it('is false when navigator.share is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(canNativeShare()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('is true when navigator.share exists', () => {
    vi.stubGlobal('navigator', { share: vi.fn() });
    expect(canNativeShare()).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe('shareLink', () => {
  it('calls navigator.share with the payload', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    await shareLink('Title', 'text', 'https://trivyy.com/?join=ABCDE');
    expect(share).toHaveBeenCalledWith({
      title: 'Title',
      text: 'text',
      url: 'https://trivyy.com/?join=ABCDE',
    });
    vi.unstubAllGlobals();
  });

  it('swallows a dismissed/failed share', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('dismissed')) });
    await expect(shareLink('T', 't', 'u')).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
