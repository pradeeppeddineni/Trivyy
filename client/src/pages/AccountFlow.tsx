import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { StatusScreen } from '../components/StatusScreen';
import { copyText } from '../lib/share';
import { setStoredNickname } from '../lib/nickname';
import {
  authMe,
  registerAccount,
  loginAccount,
  resetAccount,
  logoutAccount,
  type Account,
  type AuthResult,
} from '../api/client';

type Screen = 'loading' | 'login' | 'register' | 'recovery' | 'reset' | 'account';

const FIELD: CSSProperties = {
  width: '100%',
  padding: '14px 15px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--ink)',
  background: 'var(--card)',
  marginTop: '8px',
};

const LABEL: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--faint)',
  marginLeft: '4px',
  display: 'block',
  marginTop: '14px',
};

const LINK: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: '14px',
  color: 'var(--accent-strong)',
  cursor: 'pointer',
  fontWeight: 700,
};

function goHome(): void {
  window.location.href = '/';
}

/** A labeled input with the label associated to the control (a11y + getByLabel). */
function Field(props: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly type?: string;
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly autoCapitalize?: string;
  readonly maxLength?: number;
}): JSX.Element {
  const { id, label, value, onChange, type, placeholder, autoComplete, autoCapitalize, maxLength } =
    props;
  return (
    <>
      <label htmlFor={id} style={LABEL}>
        {label}
      </label>
      <input
        id={id}
        style={FIELD}
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </>
  );
}

/**
 * Optional account flow (spec v3 §13.1): sign up / log in / reset with a
 * recovery code (no email). The form is UX; the API is the boundary. On mount it
 * asks /api/auth/me so a signed-in visitor sees their account.
 */
export function AccountFlow(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  // Where the recovery-code screen's "continue" goes: signed in after register,
  // back to sign-in after a reset.
  const [afterRecovery, setAfterRecovery] = useState<'account' | 'login'>('account');

  useEffect(() => {
    let active = true;
    authMe()
      .then((acc) => {
        if (!active) return;
        setAccount(acc);
        setScreen(acc ? 'account' : 'login');
      })
      .catch(() => active && setScreen('login'));
    return () => {
      active = false;
    };
  }, []);

  const resultMessage = (r: AuthResult): string =>
    r === 'rate_limited' ? 'Too many attempts. Please wait a few minutes.' : 'Incorrect details.';

  const onRegister = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const { account: acc, recoveryCode } = await registerAccount(
        username.trim(),
        password,
        nickname.trim() || undefined,
      );
      setAccount(acc);
      setStoredNickname(acc.nickname);
      setIssuedCode(recoveryCode);
      setAfterRecovery('account');
      setPassword('');
      setScreen('recovery');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }, [username, password, nickname]);

  const onLogin = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const r = await loginAccount(username.trim(), password);
      if (r === 'ok') {
        const acc = await authMe();
        setAccount(acc);
        if (acc) setStoredNickname(acc.nickname);
        setPassword('');
        setScreen('account');
      } else {
        setError(resultMessage(r));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  }, [username, password]);

  const onReset = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const r = await resetAccount(username.trim(), recoveryInput, password);
      if (r === 'invalid' || r === 'rate_limited') {
        setError(resultMessage(r));
        return;
      }
      // Reset issued a new one-time recovery code — show it once, then sign in.
      setPassword('');
      setRecoveryInput('');
      setIssuedCode(r.recoveryCode);
      setAfterRecovery('login');
      setNotice('Password reset. Please sign in.');
      setScreen('recovery');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  }, [username, recoveryInput, password]);

  const onLogout = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // best-effort
    }
    setAccount(null);
    setUsername('');
    setScreen('login');
  }, []);

  /**
   * Branded page shell for all account screens: gradient page-top strip with the
   * Trivyy logo, then a white card holding the form content. All functionality is
   * unchanged; only the shell visuals are updated.
   */
  const wrap = (children: JSX.Element): JSX.Element => (
    <AppFrame>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Branded top strip */}
        <div
          style={{
            background:
              'radial-gradient(120% 80% at 50% -20%, #4f9dff 0%, #1f6bff 40%, #4b1fb8 100%)',
            padding: '32px 24px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Logo size={56} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              color: '#fff',
              letterSpacing: '0.3px',
            }}
          >
            Trivyy
          </span>
        </div>

        {/* Card pulled up over the strip */}
        <div
          style={{
            flex: 1,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            marginTop: '-24px',
            padding: '28px 24px 32px',
            boxShadow: '0 -4px 24px rgba(43,38,74,0.12)',
          }}
        >
          {children}
        </div>
      </main>
    </AppFrame>
  );

  const heading = (text: string): JSX.Element => (
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '26px',
        margin: '0 0 4px',
        textAlign: 'center',
        color: 'var(--ink)',
      }}
    >
      {text}
    </h1>
  );

  const errorLine = error ? (
    <p
      role="alert"
      style={{
        color: 'var(--danger)',
        fontSize: '13.5px',
        margin: '12px 0 0 4px',
        fontWeight: 600,
      }}
    >
      {error}
    </p>
  ) : null;

  const noticeLine = notice ? (
    <p
      role="status"
      style={{
        color: 'var(--accent-strong)',
        fontSize: '13.5px',
        margin: '10px 0 0 4px',
        fontWeight: 600,
      }}
    >
      {notice}
    </p>
  ) : null;

  if (screen === 'loading') {
    return (
      <AppFrame>
        <StatusScreen title="Checking your account…" />
      </AppFrame>
    );
  }

  if (screen === 'account' && account) {
    return wrap(
      <>
        {heading('Your account')}
        <div
          style={{
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            padding: '16px',
            marginTop: '18px',
          }}
        >
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--ink)', fontWeight: 600 }}>
            @{account.username}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--muted)' }}>
            Playing as {account.nickname}
          </p>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="primary" onClick={goHome}>
            Back to game
          </Button>
          <Button variant="secondary" onClick={() => void onLogout()}>
            Sign out
          </Button>
        </div>
      </>,
    );
  }

  if (screen === 'recovery') {
    return wrap(
      <>
        {heading('Save your recovery code')}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--muted)',
            textAlign: 'center',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          This is the <strong>only</strong> way to reset your password — there is no email. Save it
          somewhere safe. You won&apos;t see it again.
        </p>
        <div
          style={{
            margin: '18px 0 0',
            padding: '16px',
            border: '2px dashed var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--ink)',
            background: 'var(--accent-soft)',
          }}
        >
          {issuedCode}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="secondary" onClick={() => void copyText(issuedCode)}>
            Copy code
          </Button>
          <Button variant="primary" onClick={() => setScreen(afterRecovery)}>
            I&apos;ve saved it — continue
          </Button>
        </div>
      </>,
    );
  }

  if (screen === 'register') {
    return wrap(
      <>
        {heading('Create an account')}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--muted)',
            textAlign: 'center',
            margin: '6px 0 0',
          }}
        >
          Unlocks friends, groups, and leaderboards. Guest play always stays free.
        </p>
        <Field
          id="reg-username"
          label="USERNAME"
          value={username}
          onChange={setUsername}
          autoCapitalize="none"
          placeholder="3+ chars, letters/numbers/_"
        />
        <Field
          id="reg-nickname"
          label="DISPLAY NAME (optional)"
          value={nickname}
          onChange={setNickname}
          placeholder="How others see you"
          maxLength={20}
        />
        <Field
          id="reg-password"
          label="PASSWORD"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="8+ characters"
          autoComplete="new-password"
        />
        {errorLine}
        <div style={{ marginTop: '20px' }}>
          <Button
            variant="primary"
            disabled={busy || !username.trim() || password.length < 8}
            onClick={() => void onRegister()}
          >
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            type="button"
            style={LINK}
            onClick={() => {
              setError(undefined);
              setScreen('login');
            }}
          >
            Have an account? Sign in
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button type="button" style={{ ...LINK, color: 'var(--muted)' }} onClick={goHome}>
            ← Back to game (stay a guest)
          </button>
        </div>
      </>,
    );
  }

  if (screen === 'reset') {
    return wrap(
      <>
        {heading('Reset password')}
        <Field
          id="reset-username"
          label="USERNAME"
          value={username}
          onChange={setUsername}
          autoCapitalize="none"
        />
        <Field
          id="reset-code"
          label="RECOVERY CODE"
          value={recoveryInput}
          onChange={setRecoveryInput}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
        />
        <Field
          id="reset-password"
          label="NEW PASSWORD"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="8+ characters"
          autoComplete="new-password"
        />
        {errorLine}
        <div style={{ marginTop: '20px' }}>
          <Button
            variant="primary"
            disabled={busy || !username.trim() || !recoveryInput.trim() || password.length < 8}
            onClick={() => void onReset()}
          >
            {busy ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            type="button"
            style={LINK}
            onClick={() => {
              setError(undefined);
              setScreen('login');
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </>,
    );
  }

  // Default: login
  return wrap(
    <>
      {heading('Sign in')}
      {noticeLine}
      <Field
        id="login-username"
        label="USERNAME"
        value={username}
        onChange={setUsername}
        autoCapitalize="none"
        autoComplete="username"
      />
      <Field
        id="login-password"
        label="PASSWORD"
        value={password}
        onChange={setPassword}
        type="password"
        autoComplete="current-password"
      />
      {errorLine}
      <div style={{ marginTop: '20px' }}>
        <Button
          variant="primary"
          disabled={busy || !username.trim() || !password}
          onClick={() => void onLogin()}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button
          type="button"
          style={LINK}
          onClick={() => {
            setError(undefined);
            setNotice(undefined);
            setScreen('register');
          }}
        >
          New here? Create an account
        </button>
        <button
          type="button"
          style={{ ...LINK, color: 'var(--muted)' }}
          onClick={() => {
            setError(undefined);
            setScreen('reset');
          }}
        >
          Forgot password?
        </button>
        <button type="button" style={{ ...LINK, color: 'var(--muted)' }} onClick={goHome}>
          ← Back to game (stay a guest)
        </button>
      </div>
    </>,
  );
}
