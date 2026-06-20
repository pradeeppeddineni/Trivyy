import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { NicknameInput } from '../components/NicknameInput';

export interface HomeProps {
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly onPlaySolo: () => void;
  readonly onChallenge: () => void;
  readonly onTogether: () => void;
  readonly onJoin: () => void;
  readonly onAccount: () => void;
  readonly onAdmin: () => void;
  /** Display name of the signed-in account, if any (null = guest). */
  readonly accountName?: string | null;
}

const HERO: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  paddingTop: '24px',
};

/**
 * Home screen (design source of truth): logo, nickname, the three mode buttons,
 * a "Have a code?" link and an Admin link. Play solo is wired fully; the other
 * modes route to a "Coming soon" placeholder for now.
 */
export function Home(props: HomeProps): JSX.Element {
  const {
    nickname,
    onNicknameChange,
    onPlaySolo,
    onChallenge,
    onTogether,
    onJoin,
    onAccount,
    onAdmin,
    accountName,
  } = props;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 24px 32px',
      }}
    >
      <div style={HERO}>
        <div style={{ marginBottom: '22px' }}>
          <Logo size={92} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '46px',
            margin: 0,
            letterSpacing: '0.5px',
            color: 'var(--ink)',
          }}
        >
          Trivyy
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--muted)',
            margin: '8px 0 0',
            maxWidth: '280px',
            lineHeight: 1.5,
          }}
        >
          Quick trivia duels with friends. Pick a name, pick a topic, go.
        </p>
      </div>

      <div style={{ marginTop: '8px' }}>
        <NicknameInput
          value={nickname}
          onChange={onNicknameChange}
          confirmation={nickname.trim() ? `You're playing as ${nickname.trim()}` : undefined}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '22px',
          }}
        >
          <Button variant="primary" leftIcon={<span aria-hidden>🎯</span>} onClick={onPlaySolo}>
            Play solo
          </Button>
          <Button variant="secondary" leftIcon={<span aria-hidden>⚔️</span>} onClick={onChallenge}>
            Challenge a friend
          </Button>
          <Button variant="warning" leftIcon={<span aria-hidden>👥</span>} onClick={onTogether}>
            Play together
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            type="button"
            onClick={onJoin}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'var(--accent-strong)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Have a code? Join a game →
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onAccount}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'var(--accent-strong)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {accountName ? `@${accountName}` : 'Sign in / sign up'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '22px' }}>
        <button
          type="button"
          onClick={onAdmin}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: 'var(--faint-soft)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Admin
        </button>
      </div>

      <footer
        style={{
          textAlign: 'center',
          marginTop: '14px',
          fontSize: '11.5px',
          color: 'var(--faint-soft)',
          lineHeight: 1.5,
        }}
      >
        Questions from the{' '}
        <a
          href="https://opentdb.com"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: 'var(--faint)', fontWeight: 600 }}
        >
          Open Trivia Database
        </a>
        , licensed CC BY-SA 4.0.
      </footer>
    </main>
  );
}
