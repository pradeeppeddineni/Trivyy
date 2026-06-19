import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { Button } from '../components/Button';
import { AdminLogin } from './AdminLogin';
import { adminLogin, adminLogout, adminWhoami } from '../api/client';

/** Admin screen state machine: probe the session, then sign in or show the panel. */
type Screen = 'checking' | 'login' | 'dashboard';

const CARD: CSSProperties = {
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--card)',
  padding: '20px',
  marginTop: '18px',
};

/** Send the browser back to the solo game (query-param routing, like ?gallery). */
function goToGame(): void {
  window.location.href = '/';
}

/**
 * Admin flow controller. On mount it asks the API whether a valid admin session
 * already exists (GET /api/admin/whoami) so a returning admin skips the form.
 * The form itself is UX; the API guard is the real boundary (auth.ts).
 */
export function AdminFlow(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('checking');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    adminWhoami()
      .then((isAdmin) => {
        if (active) {
          setScreen(isAdmin ? 'dashboard' : 'login');
        }
      })
      .catch(() => {
        if (active) {
          setScreen('login');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await adminLogin(password);
      if (result === 'ok') {
        setPassword('');
        setScreen('dashboard');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('We could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [password]);

  const onLogout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      // Logging out is best-effort; drop back to the form regardless.
    }
    setScreen('login');
  }, []);

  if (screen === 'checking') {
    return (
      <AppFrame>
        <StatusScreen title="Checking your session…" />
      </AppFrame>
    );
  }

  if (screen === 'login') {
    return (
      <AppFrame>
        <AdminLogin
          value={password}
          onChange={setPassword}
          onSubmit={() => void onSubmit()}
          submitting={submitting}
          error={error}
          onBack={goToGame}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <PlayerHeader nickname="admin" onLogoClick={goToGame} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 24px 32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '28px',
            margin: '12px 0 0',
            color: 'var(--ink)',
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
          You are signed in as the admin.
        </p>

        <div style={CARD} role="status">
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            Question management & game stats are coming soon.
          </p>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--muted)',
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}
          >
            This panel confirms admin sign-in works end to end. The CRUD and stats views land in a
            later phase.
          </p>
        </div>

        <div style={{ marginTop: '22px' }}>
          <Button variant="secondary" onClick={() => void onLogout()}>
            Sign out
          </Button>
        </div>
      </main>
    </AppFrame>
  );
}
