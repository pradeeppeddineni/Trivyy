import { useId } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

export interface AdminLoginProps {
  readonly username: string;
  readonly password: string;
  readonly onUsernameChange: (value: string) => void;
  readonly onPasswordChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly error?: string;
  readonly onBack: () => void;
}

const FIELD: CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--ink)',
  background: 'var(--card)',
  transition: 'border-color 0.15s',
};

/**
 * Admin sign-in screen. The form is UX only — the real authorization boundary
 * is the API's requireAdmin guard (server middleware/auth.ts). It just collects
 * the single admin password and surfaces a precise message on a wrong one.
 */
export function AdminLogin(props: AdminLoginProps): JSX.Element {
  const {
    username,
    password,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
    submitting,
    error,
    onBack,
  } = props;
  const userId = useId();
  const fieldId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 24px 32px' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ margin: '0 auto 18px' }}>
          <Logo size={72} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '30px',
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          Admin sign in
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--muted)',
            margin: '8px auto 0',
            maxWidth: '280px',
            lineHeight: 1.5,
          }}
        >
          Sign in to manage questions and review games.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '26px', textAlign: 'left' }}>
          <label
            htmlFor={userId}
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--faint)', marginLeft: '4px' }}
          >
            ADMIN USERNAME
          </label>
          <input
            id={userId}
            type="text"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="admin"
            autoComplete="username"
            autoFocus
            style={{ ...FIELD, marginTop: '8px', marginBottom: '16px' }}
          />
          <label
            htmlFor={fieldId}
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--faint)', marginLeft: '4px' }}
          >
            ADMIN PASSWORD
          </label>
          <input
            id={fieldId}
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            style={{ ...FIELD, marginTop: '8px' }}
          />
          {error ? (
            <p
              id={`${fieldId}-error`}
              role="alert"
              style={{
                fontSize: '13.5px',
                color: 'var(--danger)',
                margin: '9px 0 0 4px',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          ) : null}

          <div style={{ marginTop: '22px' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !username.trim() || !password.trim()}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'var(--accent-strong)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ← Back to game
          </button>
        </div>
      </div>
    </main>
  );
}
