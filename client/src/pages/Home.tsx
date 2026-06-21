import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { HomeHeroScene } from '../components/HomeHeroScene';
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
  readonly onFriends: () => void;
  readonly onGroups: () => void;
  readonly onStats: () => void;
  readonly onAdmin: () => void;
  /** Display name of the signed-in account, if any (null = guest). */
  readonly accountName?: string | null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function linkBtn(
  onClick: () => void,
  style: CSSProperties,
  children: React.ReactNode,
): JSX.Element {
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

const LINK_BASE: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
};

// ---------------------------------------------------------------------------
// Guest landing
// ---------------------------------------------------------------------------

function GuestHome(props: HomeProps): JSX.Element {
  const { nickname, onNicknameChange, onPlaySolo, onAccount, onJoin, onAdmin } = props;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px 32px',
      }}
    >
      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: '32px',
          paddingBottom: '8px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <Logo size={88} />
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
            fontSize: '15px',
            color: 'var(--muted)',
            margin: '8px 0 0',
            maxWidth: '260px',
            lineHeight: 1.55,
          }}
        >
          Quick trivia duels with friends. Pick a name, pick a topic, go.
        </p>
      </div>

      {/* Input + actions card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-xl)',
          padding: '22px 20px 20px',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '16px',
        }}
      >
        <NicknameInput
          value={nickname}
          onChange={onNicknameChange}
          confirmation={nickname.trim() ? `Playing as ${nickname.trim()}` : undefined}
        />

        <div style={{ marginTop: '18px' }}>
          <Button variant="primary" onClick={onPlaySolo}>
            Play as guest
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '14px',
            flexWrap: 'wrap',
          }}
        >
          {linkBtn(
            onAccount,
            {
              ...LINK_BASE,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--accent-strong)',
              padding: '4px 8px',
            },
            'Sign in',
          )}
          <span style={{ color: 'var(--faint-soft)', lineHeight: '30px' }}>or</span>
          {linkBtn(
            onAccount,
            {
              ...LINK_BASE,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--accent-strong)',
              padding: '4px 8px',
            },
            'Create account',
          )}
        </div>
      </div>

      {/* Secondary links */}
      <div style={{ textAlign: 'center' }}>
        {linkBtn(
          onJoin,
          { ...LINK_BASE, fontSize: '13.5px', color: 'var(--faint)', fontWeight: 600 },
          'Have a code? Join a game',
        )}
      </div>

      {/* Admin — tiny, low-prominence */}
      <footer style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '24px' }}>
        {linkBtn(
          onAdmin,
          { ...LINK_BASE, fontSize: '12px', color: 'var(--faint-soft)', fontWeight: 500 },
          'Admin',
        )}
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Logged-in home — delegates to the premium HomeHeroScene component
// ---------------------------------------------------------------------------

function LoggedInHome(props: HomeProps): JSX.Element {
  const { accountName, onPlaySolo, onChallenge, onTogether } = props;
  return (
    <HomeHeroScene
      accountName={accountName ?? ''}
      onPlaySolo={onPlaySolo}
      onChallenge={onChallenge}
      onTogether={onTogether}
    />
  );
}

// ---------------------------------------------------------------------------
// Public export — renders the correct state
// ---------------------------------------------------------------------------

/**
 * Home screen: two distinct states depending on whether the user is signed in.
 * Guest state = branded landing with nickname input and sign-in CTA.
 * Logged-in state = game-forward hero matching the home-b.html reference design.
 */
export function Home(props: HomeProps): JSX.Element {
  if (props.accountName) {
    return <LoggedInHome {...props} />;
  }
  return <GuestHome {...props} />;
}
