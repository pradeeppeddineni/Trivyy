import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { NicknameInput } from '../components/NicknameInput';

export interface HomeProps {
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly onPlaySolo: () => void;
  readonly onComingSoon: (label: string) => void;
  readonly onAdmin: () => void;
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

const LOGO: CSSProperties = {
  position: 'relative',
  width: '92px',
  height: '92px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--accent)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'var(--shadow-logo)',
  marginBottom: '22px',
};

/**
 * Home screen (design source of truth): logo, nickname, the three mode buttons,
 * a "Have a code?" link and an Admin link. Play solo is wired fully; the other
 * modes route to a "Coming soon" placeholder for now.
 */
export function Home(props: HomeProps): JSX.Element {
  const { nickname, onNicknameChange, onPlaySolo, onComingSoon, onAdmin } = props;

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
        <div style={LOGO}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: '#fff',
              fontSize: '52px',
              lineHeight: 1,
              marginTop: '-2px',
            }}
          >
            T
          </span>
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
          <Button
            variant="secondary"
            leftIcon={<span aria-hidden>⚔️</span>}
            onClick={() => onComingSoon('Challenge a friend')}
          >
            Challenge a friend
          </Button>
          <Button
            variant="warning"
            leftIcon={<span aria-hidden>👥</span>}
            onClick={() => onComingSoon('Play together')}
          >
            Play together
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => onComingSoon('Join by code')}
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
      </div>

      <div style={{ textAlign: 'center', marginTop: '26px' }}>
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
    </main>
  );
}
