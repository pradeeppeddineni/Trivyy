# Trivyy UI Overhaul — Phase 0 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the overhauled foundation — electric-blue rebrand, dark mode, a persistent bottom nav, PWA / full-screen install, and a Framer Motion transition base — without redesigning individual screens yet.

**Architecture:** Evolve the existing token system (`client/src/styles/tokens.css`, ARC-3) and component library rather than rebuild. A `ThemeProvider` sets `data-theme` on `<html>` driving a `[data-theme="dark"]` token cascade; a `BottomNav` drives the existing query-param navigation; `vite-plugin-pwa` makes the SPA installable; Framer Motion standardizes transitions.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest + React Testing Library (jsdom), Framer Motion, vite-plugin-pwa, sharp (icon generation, dev-only).

---

## File Structure

- `client/src/styles/tokens.css` — **modify**: blue accent, `[data-theme="dark"]` block, safe-area helpers.
- `client/src/theme/ThemeProvider.tsx` — **create**: context, `useTheme`, persistence, OS default.
- `client/src/theme/ThemeProvider.test.tsx` — **create**: provider/hook tests.
- `client/src/components/ThemeToggle.tsx` — **create**: accessible dark-mode switch.
- `client/src/components/ThemeToggle.test.tsx` — **create**.
- `client/src/components/BottomNav.tsx` — **create**: 5-tab nav, raised Play.
- `client/src/components/BottomNav.test.tsx` — **create**.
- `client/src/nav.ts` — **create**: pure helper mapping query params → active tab key.
- `client/src/nav.test.ts` — **create**.
- `client/src/components/PageTransition.tsx` — **create**: Framer Motion fade-up wrapper, reduced-motion aware.
- `client/src/pages/SettingsFlow.tsx` — **create**: settings screen (theme toggle, install, links).
- `client/src/App.tsx` — **modify**: add `?settings` route; render `BottomNav` on tab screens.
- `client/src/main.tsx` — **modify**: wrap `<App/>` in `<ThemeProvider>`.
- `client/index.html` — **modify**: `theme-color` meta, `viewport-fit=cover`.
- `client/vite.config.ts` — **modify**: add `VitePWA`.
- `client/public/icon.svg` — **create**: brand logo source.
- `client/scripts/gen-icons.mjs` — **create**: SVG → PNG icons (sharp).
- `client/package.json` — **modify**: add deps + `icons` script.
- `client/vitest.config.ts` — **modify**: extend coverage `include`.
- `rules.md`, `.specify/trivia-app-spec.md` — **modify**: theme/PWA rules (docs task).

---

## Task 1: Rebrand accent tokens to electric blue

**Files:**

- Modify: `client/src/styles/tokens.css:12-17` and the accent shadow lines (`--shadow-accent*`, `--shadow-logo`) and the `pulseRing` keyframe.

- [ ] **Step 1: Edit the accent + accent-shadow tokens**

In `client/src/styles/tokens.css`, replace the `/* ---- Accent ---- */` block:

```css
/* ---- Accent ---- */
--accent: #1f6bff;
--accent-strong: #1657e0;
--accent-soft: #eef4ff;
--accent-tint: #eef3fe;
--accent-glow: rgba(31, 107, 255, 0.35);
```

Replace the accent shadows:

```css
--shadow-accent: 0 8px 20px rgba(31, 107, 255, 0.34);
--shadow-accent-soft: 0 6px 16px rgba(31, 107, 255, 0.3);
--shadow-accent-card: 0 10px 24px rgba(31, 107, 255, 0.26);
```

Replace `--shadow-logo`:

```css
--shadow-logo: 0 12px 28px rgba(31, 107, 255, 0.34);
```

In the `@keyframes pulseRing` block, replace the three `rgba(108, 92, 231, ...)` values with `rgba(31, 107, 255, ...)` (same alphas: 0.35, 0, 0).

Also replace the accent-tinted border tokens for cohesion:

```css
--border-accent: #d9e6ff;
--border-accent-soft: #e2ecff;
--border-dashed: #b9cdf2;
```

- [ ] **Step 2: Typecheck and build to confirm CSS still parses**

Run: `npm run typecheck --workspace client && npm run build --workspace client`
Expected: both succeed (CSS is bundled by Vite without error).

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/tokens.css
git commit -m "feat(ui): rebrand accent tokens to electric blue"
```

---

## Task 2: Add dark-mode token cascade

**Files:**

- Modify: `client/src/styles/tokens.css` (append a `[data-theme="dark"]` block after the `:root {…}` block, before the `* { box-sizing }` rule).

- [ ] **Step 1: Append the dark theme block**

Insert immediately after the closing `}` of `:root` (currently line 116):

```css
/* Dark theme — overrides only the surface/ink/border tokens; accent + category
 * hues are reused (with a lifted accent for contrast on dark surfaces). No
 * component may hard-code a color; all values come from these tokens (ARC-3). */
[data-theme='dark'] {
  --accent: #4f9dff;
  --accent-strong: #2f7fff;
  --accent-soft: #16233f;
  --accent-tint: #16233f;
  --accent-glow: rgba(79, 157, 255, 0.4);

  --page-bg: #0a1020;
  --surface: #121a2e;
  --surface-muted: #172138;
  --surface-faint: #172138;
  --card: #16203a;
  --card-tint: #1b2741;
  --admin-bg: #0c1426;

  --ink: #eaf0ff;
  --ink-deep: #ffffff;
  --body: #e3e9f7;
  --body-soft: #aab4cf;
  --muted: #8c97b6;
  --faint: #74809f;
  --faint-soft: #5c6685;
  --placeholder: #5c6685;
  --score-total: #5c6685;

  --border: #243150;
  --border-soft: #222e4a;
  --border-faint: #1e2942;
  --border-accent: #2a3c63;
  --border-accent-soft: #243a63;
  --stat-border: #222e4a;
  --track: #202c46;

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.45);
  --shadow-card-soft: 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-frame: 0 0 60px rgba(0, 0, 0, 0.6);
}
```

- [ ] **Step 2: Build to confirm the CSS parses**

Run: `npm run build --workspace client`
Expected: success.

- [ ] **Step 3: Manually verify by toggling the attribute (temporary)**

Run: `npm run dev --workspace client`, open the app, and in the browser console run `document.documentElement.setAttribute('data-theme','dark')`.
Expected: the page background and surfaces turn dark; text stays readable.

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/tokens.css
git commit -m "feat(ui): add dark-mode token cascade"
```

---

## Task 3: ThemeProvider + useTheme hook (TDD)

**Files:**

- Create: `client/src/theme/ThemeProvider.tsx`
- Test: `client/src/theme/ThemeProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeProvider';

function Probe(): JSX.Element {
  const { theme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>flip</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('defaults to light when nothing is stored and OS is light', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('uses the stored theme over the OS preference', () => {
    localStorage.setItem('trivyy.theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('toggles and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('flip'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStorage.getItem('trivyy.theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('throws if useTheme is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/useTheme/);
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test --workspace client -- ThemeProvider`
Expected: FAIL ("Failed to resolve import './ThemeProvider'").

- [ ] **Step 3: Write the implementation**

Create `client/src/theme/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'trivyy.theme';

interface ThemeContextValue {
  readonly theme: Theme;
  readonly setTheme: (t: Theme) => void;
  readonly toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function getInitialTheme(): Theme {
  return readStored() ?? (osPrefersDark() ? 'dark' : 'light');
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a1020' : '#1f6bff');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage disabled (private mode) — runtime theme still applies */
    }
  }, [theme]);

  const toggle = (): void => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test --workspace client -- ThemeProvider`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/theme/ThemeProvider.tsx client/src/theme/ThemeProvider.test.tsx
git commit -m "feat(ui): add ThemeProvider with persistence and OS default"
```

---

## Task 4: Wire ThemeProvider into the app root

**Files:**

- Modify: `client/src/main.tsx:14-22`

- [ ] **Step 1: Import and wrap**

In `client/src/main.tsx`, add the import after the tokens import:

```tsx
import './styles/tokens.css';
import { ThemeProvider } from './theme/ThemeProvider';
```

Replace the render call:

```tsx
createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Build + typecheck**

Run: `npm run typecheck --workspace client && npm run build --workspace client`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add client/src/main.tsx
git commit -m "feat(ui): mount ThemeProvider at the app root"
```

---

## Task 5: ThemeToggle component (TDD)

**Files:**

- Create: `client/src/components/ThemeToggle.tsx`
- Test: `client/src/components/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('reflects and flips the theme via an accessible switch', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const sw = screen.getByRole('switch', { name: /dark mode/i });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test --workspace client -- ThemeToggle`
Expected: FAIL ("Failed to resolve import './ThemeToggle'").

- [ ] **Step 3: Write the implementation**

Create `client/src/components/ThemeToggle.tsx`:

```tsx
import type { CSSProperties } from 'react';
import { useTheme } from '../theme/ThemeProvider';

const TRACK = (on: boolean): CSSProperties => ({
  width: 46,
  height: 27,
  borderRadius: 'var(--radius-pill)',
  background: on ? 'var(--accent)' : 'var(--track)',
  position: 'relative',
  border: 'none',
  cursor: 'pointer',
  transition: 'background var(--t)',
  flex: '0 0 auto',
});

const KNOB = (on: boolean): CSSProperties => ({
  position: 'absolute',
  top: 3,
  left: on ? 22 : 3,
  width: 21,
  height: 21,
  borderRadius: '50%',
  background: '#fff',
  transition: 'left var(--t)',
});

export function ThemeToggle(): JSX.Element {
  const { theme, toggle } = useTheme();
  const on = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Dark mode"
      onClick={toggle}
      style={TRACK(on)}
    >
      <span style={KNOB(on)} />
    </button>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test --workspace client -- ThemeToggle`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ThemeToggle.tsx client/src/components/ThemeToggle.test.tsx
git commit -m "feat(ui): add accessible ThemeToggle switch"
```

---

## Task 6: Active-tab nav helper (TDD)

**Files:**

- Create: `client/src/nav.ts`
- Test: `client/src/nav.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test --workspace client -- nav`
Expected: FAIL ("Failed to resolve import './nav'").

- [ ] **Step 3: Write the implementation**

Create `client/src/nav.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test --workspace client -- nav`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/nav.ts client/src/nav.test.ts
git commit -m "feat(ui): add active-tab nav helper"
```

---

## Task 7: BottomNav component (TDD)

**Files:**

- Create: `client/src/components/BottomNav.tsx`
- Test: `client/src/components/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders five tabs and marks the active one', () => {
    render(<BottomNav active="friends" onNavigate={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: /friends/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navigates to the tab search string on click', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav active="home" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /you/i }));
    expect(onNavigate).toHaveBeenCalledWith('?me');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test --workspace client -- BottomNav`
Expected: FAIL ("Failed to resolve import './BottomNav'").

- [ ] **Step 3: Write the implementation**

Create `client/src/components/BottomNav.tsx`:

```tsx
import type { CSSProperties } from 'react';
import { TAB_ITEMS } from '../nav';

export interface BottomNavProps {
  readonly active: string;
  /** Injected for tests; defaults to changing the window query string. */
  readonly onNavigate?: (search: string) => void;
}

const BAR: CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 'calc(12px + env(safe-area-inset-bottom))',
  width: 'min(var(--app-width), 100vw)',
  paddingLeft: 12,
  paddingRight: 12,
  boxSizing: 'border-box',
  zIndex: 40,
};

const INNER: CSSProperties = {
  height: 64,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-2xl)',
  boxShadow: 'var(--shadow-frame)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
};

function tabStyle(isActive: boolean): CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isActive ? 'var(--accent)' : 'var(--muted)',
  };
}

const PLAY: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 'var(--radius-xl)',
  background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'var(--shadow-accent)',
  transform: 'translateY(-14px)',
  border: '4px solid var(--surface)',
  cursor: 'pointer',
};

export function BottomNav({ active, onNavigate }: BottomNavProps): JSX.Element {
  const go =
    onNavigate ??
    ((s: string) => {
      window.location.search = s;
    });
  return (
    <nav style={BAR} aria-label="Primary">
      <div style={INNER}>
        {TAB_ITEMS.map((t) =>
          t.primary ? (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active === t.key ? 'page' : undefined}
              onClick={() => go(t.search)}
              style={{ background: 'transparent', border: 'none' }}
            >
              <span style={PLAY}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active === t.key ? 'page' : undefined}
              onClick={() => go(t.search)}
              style={tabStyle(active === t.key)}
            >
              {t.label}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test --workspace client -- BottomNav`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/BottomNav.tsx client/src/components/BottomNav.test.tsx
git commit -m "feat(ui): add BottomNav with raised Play button"
```

---

## Task 8: Render BottomNav on tab screens

**Files:**

- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add the settings route and the nav shell**

Replace the body of `App` in `client/src/App.tsx`. Add the imports at the top:

```tsx
import { BottomNav } from './components/BottomNav';
import { SettingsFlow } from './pages/SettingsFlow';
import { activeTab } from './nav';
```

Inside `App`, after computing `params`, add:

```tsx
if (params.has('settings')) {
  return <SettingsFlow />;
}
```

Wrap the returned screen so the nav renders on tab screens. Replace the final `return` chain with a single computed `screen` and a wrapper:

```tsx
const tab = activeTab(params);

let screen: JSX.Element;
if (params.has('admin')) screen = <AdminFlow />;
else if (params.has('account')) screen = <AccountFlow />;
else if (params.has('friend')) screen = <FriendsFlow inviteCode={params.get('friend') ?? ''} />;
else if (params.has('friends')) screen = <FriendsFlow />;
else if (params.has('gjoin')) screen = <GroupsFlow autoJoinCode={params.get('gjoin') ?? ''} />;
else if (params.has('groups')) screen = <GroupsFlow />;
else if (params.has('me')) screen = <ProfileFlow />;
else if (params.has('join')) screen = <JoinFlow code={params.get('join') ?? ''} />;
else if (params.has('duel')) screen = <DuelFlow />;
else if (params.has('group')) screen = <GroupFlow groupId={params.get('for') ?? undefined} />;
else if (params.has('gallery')) screen = <Gallery />;
else screen = <SoloFlow />;

return (
  <>
    {screen}
    {tab !== null && <BottomNav active={tab} />}
  </>
);
```

Remove the now-unused earlier `if (...) return <.../>;` blocks for the screens you just moved into the `screen` assignment (keep only the `?settings` early return added above). Keep the file's existing top doc comment and add a line documenting `?settings`.

- [ ] **Step 2: Add bottom padding so content clears the nav**

In `client/src/components/AppFrame.tsx`, add to the `FRAME` style object:

```tsx
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck --workspace client && npm run build --workspace client`
Expected: success. (`SettingsFlow` is created in Task 9; if you execute out of order, create a stub first.)

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/AppFrame.tsx
git commit -m "feat(ui): render BottomNav on tab screens; add settings route"
```

---

## Task 9: SettingsFlow page

**Files:**

- Create: `client/src/pages/SettingsFlow.tsx`
- Test: `client/src/pages/SettingsFlow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SettingsFlow } from './SettingsFlow';

describe('SettingsFlow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('renders a heading and the dark-mode switch', () => {
    render(
      <ThemeProvider>
        <SettingsFlow />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /dark mode/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test --workspace client -- SettingsFlow`
Expected: FAIL ("Failed to resolve import './SettingsFlow'").

- [ ] **Step 3: Write the implementation**

Create `client/src/pages/SettingsFlow.tsx`:

```tsx
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { ThemeToggle } from '../components/ThemeToggle';

const WRAP: CSSProperties = {
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};
const H1: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 24,
  color: 'var(--ink)',
  margin: 0,
};
const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  fontWeight: 600,
  color: 'var(--body)',
};
const LABEL: CSSProperties = { flex: 1 };
const LINK: CSSProperties = { ...ROW, textDecoration: 'none', cursor: 'pointer' };

export function SettingsFlow(): JSX.Element {
  return (
    <AppFrame>
      <div style={WRAP}>
        <h1 style={H1}>Settings</h1>
        <div style={ROW}>
          <span style={LABEL}>Dark mode</span>
          <ThemeToggle />
        </div>
        <a style={LINK} href="?me">
          Edit profile &amp; avatar
        </a>
        <a style={LINK} href="?account">
          Account
        </a>
        <a style={{ ...LINK, color: 'var(--danger)' }} href="?">
          Back to home
        </a>
      </div>
    </AppFrame>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test --workspace client -- SettingsFlow`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/SettingsFlow.tsx client/src/pages/SettingsFlow.test.tsx
git commit -m "feat(ui): add Settings page with dark-mode toggle"
```

---

## Task 10: Framer Motion page-transition wrapper (TDD)

**Files:**

- Modify: `client/package.json` (add `framer-motion`)
- Create: `client/src/components/PageTransition.tsx`
- Test: `client/src/components/PageTransition.test.tsx`

- [ ] **Step 1: Install Framer Motion**

Run: `npm install framer-motion@^11 --workspace client`
Expected: adds `framer-motion` to `client/package.json` dependencies.

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition } from './PageTransition';

describe('PageTransition', () => {
  it('renders its children', () => {
    render(
      <PageTransition>
        <p>hello</p>
      </PageTransition>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test --workspace client -- PageTransition`
Expected: FAIL ("Failed to resolve import './PageTransition'").

- [ ] **Step 4: Write the implementation**

Create `client/src/components/PageTransition.tsx`:

```tsx
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PageTransitionProps {
  readonly children: ReactNode;
}

/** Fade-and-rise entry for a screen; collapses to instant under reduced motion. */
export function PageTransition({ children }: PageTransitionProps): JSX.Element {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: [0.34, 1.42, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test --workspace client -- PageTransition`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/package.json package-lock.json client/src/components/PageTransition.tsx client/src/components/PageTransition.test.tsx
git commit -m "feat(ui): add Framer Motion page-transition wrapper"
```

---

## Task 11: Brand icon source + PNG generation

**Files:**

- Create: `client/public/icon.svg`
- Create: `client/scripts/gen-icons.mjs`
- Modify: `client/package.json` (add `sharp` devDep + `icons` script)

- [ ] **Step 1: Create the SVG logo**

Create `client/public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f6bff"/>
      <stop offset="1" stop-color="#4f9dff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <path d="M256 96l46 112 122 9-93 80 29 119-104-64-104 64 29-119-93-80 122-9z" fill="#fff"/>
</svg>
```

- [ ] **Step 2: Add sharp and the icons script**

Run: `npm install -D sharp@^0.33 --workspace client`

Then in `client/package.json` add to `scripts`:

```json
    "icons": "node scripts/gen-icons.mjs"
```

- [ ] **Step 3: Write the generator**

Create `client/scripts/gen-icons.mjs`:

```js
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const svg = readFileSync(join(pub, 'icon.svg'));

const targets = [
  { size: 192, file: 'pwa-192x192.png' },
  { size: 512, file: 'pwa-512x512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

for (const t of targets) {
  await sharp(svg).resize(t.size, t.size).png().toFile(join(pub, t.file));
  console.log('wrote', t.file);
}
```

- [ ] **Step 4: Generate the PNGs**

Run: `npm run icons --workspace client`
Expected: writes `client/public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`.

- [ ] **Step 5: Commit**

```bash
git add client/public/icon.svg client/public/pwa-192x192.png client/public/pwa-512x512.png client/public/apple-touch-icon.png client/scripts/gen-icons.mjs client/package.json package-lock.json
git commit -m "feat(ui): add brand icon and PNG generation"
```

---

## Task 12: PWA / installable + full-screen

**Files:**

- Modify: `client/package.json` (add `vite-plugin-pwa`)
- Modify: `client/vite.config.ts`
- Modify: `client/index.html`

- [ ] **Step 1: Install the plugin**

Run: `npm install -D vite-plugin-pwa@^0.21 --workspace client`

- [ ] **Step 2: Configure the plugin**

Replace `client/vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The dev server proxies /api to the Express backend so the SPA and API share
// an origin in development (keeps the session cookie first-party).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trivyy',
        short_name: 'Trivyy',
        description: 'Turn-based trivia with friends.',
        theme_color: '#1f6bff',
        background_color: '#0a1020',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the built app shell only; the API is always network (API-6).
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  preview: {
    port: 4173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
```

- [ ] **Step 3: Add meta tags for theme color and full-screen**

In `client/index.html`, inside `<head>` after the viewport meta, replace the viewport line and add:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#1f6bff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 4: Build and confirm the manifest + service worker are emitted**

Run: `npm run build --workspace client`
Expected: build output lists `dist/manifest.webmanifest` and `dist/sw.js` (or `dist/registerSW.js`).

- [ ] **Step 5: Commit**

```bash
git add client/vite.config.ts client/index.html client/package.json package-lock.json
git commit -m "feat(ui): make the SPA an installable, full-screen PWA"
```

---

## Task 13: Extend client coverage include

**Files:**

- Modify: `client/vitest.config.ts:17`

- [ ] **Step 1: Add the new units to coverage**

In `client/vitest.config.ts`, replace the `include` under `coverage`:

```ts
      include: [
        'src/lib/**',
        'src/components/Logo.tsx',
        'src/components/ThemeToggle.tsx',
        'src/components/BottomNav.tsx',
        'src/components/PageTransition.tsx',
        'src/theme/**',
        'src/nav.ts',
      ],
```

- [ ] **Step 2: Run the full client suite with coverage**

Run: `npm run test --workspace client`
Expected: PASS; coverage for the included files >= 80% (DOD-1).

- [ ] **Step 3: Commit**

```bash
git add client/vitest.config.ts
git commit -m "test(ui): gate coverage on the new theme/nav components"
```

---

## Task 14: E2E dark-mode screenshot (DOD-3)

**Files:**

- Create: `e2e/tests/theme.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test('home renders in light and dark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await page.screenshot({ path: 'test-results/home-light.png', fullPage: true });

  await page.evaluate(() => localStorage.setItem('trivyy.theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'test-results/home-dark.png', fullPage: true });
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e`
Expected: PASS; two screenshots written under `e2e/test-results/`.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/theme.spec.ts
git commit -m "test(e2e): screenshot home in light and dark themes"
```

---

## Task 15: Update governance docs

**Files:**

- Modify: `.specify/trivia-app-spec.md` (add a UI/theme/PWA section, bump to v4)
- Modify: `rules.md` (add the theme-token + PWA rules)
- Modify: `docs/superpowers/specs/2026-06-21-trivyy-ui-overhaul-design.md` (mark Phase 0 status: implemented)

- [ ] **Step 1: Add a rule to rules.md**

Under the UI/ARC rules section, add:

```markdown
- **ARC-3a (theming):** The app supports light and dark themes via a
  `[data-theme]` cascade over the design tokens. Components read colors only
  from tokens; no component may hard-code a color value. The active theme is
  chosen by the user (persisted) defaulting to the OS preference.
- **UI-1 (installable):** The client ships a web manifest and a service worker
  that caches only the built app shell (never `/api`), so the app is installable
  and runs full-screen on phones.
```

- [ ] **Step 2: Add a UI section to the app spec**

In `.specify/trivia-app-spec.md`, add a short "§10 Look & feel" section noting: electric-blue brand, light/dark themes, bottom-nav navigation, installable PWA, Framer Motion transitions; bump the version header to v4.

- [ ] **Step 3: Mark the design doc Phase 0 status**

In `docs/superpowers/specs/2026-06-21-trivyy-ui-overhaul-design.md`, change the Phase 0 row status note to "implemented".

- [ ] **Step 4: Commit**

```bash
git add rules.md .specify/trivia-app-spec.md docs/superpowers/specs/2026-06-21-trivyy-ui-overhaul-design.md
git commit -m "docs: record theme + PWA rules and Phase 0 status"
```

---

## Final verification (before opening the PR)

- [ ] Run the full gates from the repo root:

```bash
npm run typecheck && npm run lint && npm test && npm run test --workspace client
npx prettier --check "client/**/*.{ts,tsx,css}" "e2e/**/*.ts"
npm run build --workspace client
```

Expected: all pass; client build emits the manifest + service worker.

- [ ] Commit the design doc + this plan if not already committed, then open the PR:

```bash
git add docs/superpowers/
git commit -m "docs: Phase 0 UI overhaul design + plan"
```

- [ ] Open a PR titled `feat(ui): Phase 0 foundation — blue rebrand, dark mode, bottom nav, PWA`, watch CI (`gh pr checks --watch`), squash-merge when green, then deploy the Pi (rebuild only; no migration).
