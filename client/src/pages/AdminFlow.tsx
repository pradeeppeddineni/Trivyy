import { useCallback, useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { adminLogin, adminLogout, adminWhoami } from '../api/client';

/** Admin screen state machine: probe the session, then sign in or show the panel. */
type Screen = 'checking' | 'login' | 'dashboard';

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
      <AdminDashboard onLogout={() => void onLogout()} />
    </AppFrame>
  );
}
