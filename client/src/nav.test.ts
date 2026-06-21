import { describe, it, expect } from 'vitest';
import { activeTab, TAB_ITEMS } from './nav';

describe('activeTab', () => {
  it('maps known params to a tab key', () => {
    expect(activeTab(new URLSearchParams(''))).toBe('home');
    expect(activeTab(new URLSearchParams('?solo'))).toBe('home');
    expect(activeTab(new URLSearchParams('?friends'))).toBe('friends');
    expect(activeTab(new URLSearchParams('?groups'))).toBe('boards');
    expect(activeTab(new URLSearchParams('?me'))).toBe('you');
  });

  it('returns null for screens that are not tabs', () => {
    expect(activeTab(new URLSearchParams('?duel'))).toBeNull();
    expect(activeTab(new URLSearchParams('?admin'))).toBeNull();
    expect(activeTab(new URLSearchParams('?join=ABCDE'))).toBeNull();
    expect(activeTab(new URLSearchParams('?account'))).toBeNull();
  });

  it('exposes five tab items in order', () => {
    expect(TAB_ITEMS.map((t) => t.key)).toEqual(['home', 'friends', 'play', 'boards', 'you']);
  });
});
