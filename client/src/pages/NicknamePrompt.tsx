import { useState } from 'react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { NicknameInput } from '../components/NicknameInput';

export interface NicknamePromptProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly initial?: string;
  readonly cta: string;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onSubmit: (nickname: string) => void;
  readonly onBack?: () => void;
}

/**
 * First screen for the multiplayer flows: pick a nickname before creating or
 * joining a game. The nickname becomes the session player on submit.
 */
export function NicknamePrompt(props: NicknamePromptProps): JSX.Element {
  const { title, subtitle, initial = '', cta, busy, error, onSubmit, onBack } = props;
  const [nickname, setNickname] = useState(initial);

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 24px 32px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ margin: '0 auto 18px' }}>
          <Logo size={72} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '28px',
            margin: 0,
            textAlign: 'center',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontSize: '15px',
              color: 'var(--muted)',
              margin: '8px auto 0',
              maxWidth: '280px',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        <div style={{ marginTop: '24px' }}>
          <NicknameInput value={nickname} onChange={setNickname} />
        </div>
        {error ? (
          <p
            role="alert"
            style={{
              fontSize: '13.5px',
              color: 'var(--danger)',
              margin: '10px 0 0 4px',
              fontWeight: 600,
            }}
          >
            {error}
          </p>
        ) : null}

        <div style={{ marginTop: '22px' }}>
          <Button
            variant="primary"
            disabled={busy || !nickname.trim()}
            onClick={() => onSubmit(nickname.trim())}
          >
            {busy ? 'Just a moment…' : cta}
          </Button>
        </div>

        {onBack ? (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
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
              ← Back to home
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
