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
// Logged-in home (game-forward, matches home-b.html)
// ---------------------------------------------------------------------------

/** Trophy SVG — placeholder for a real illustrated mascot. */
function TrophySvg(): JSX.Element {
  return (
    <svg
      width="92"
      height="92"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a3b00"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 2.8M18 2H6v7a6 6 0 0012 0V2Z" />
    </svg>
  );
}

function ModeChip(props: {
  readonly label: string;
  readonly icon: JSX.Element;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        flex: 1,
        maxWidth: '120px',
        background: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.28)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.18)',
        }}
      >
        {props.icon}
      </span>
      {props.label}
    </button>
  );
}

function LoggedInHome(props: HomeProps): JSX.Element {
  const { accountName, onPlaySolo, onChallenge, onTogether } = props;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 16px 32px',
        color: '#fff',
      }}
    >
      {/* Greeting */}
      <p
        style={{
          fontSize: '15px',
          fontWeight: 600,
          opacity: 0.85,
          margin: '4px 0 0',
          textAlign: 'center',
        }}
      >
        Hi, {accountName}
      </p>

      {/* Hero stage */}
      <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
        {/* Glossy trophy orb */}
        <div
          style={{
            width: '190px',
            height: '190px',
            margin: '0 auto 6px',
            borderRadius: '50%',
            position: 'relative',
            background:
              'radial-gradient(circle at 35% 30%, #fff 0%, #ffc63d 30%, #ff9e2c 70%, #f06a00 100%)',
            boxShadow:
              '0 24px 50px -12px rgba(0,0,0,0.5), inset 0 -16px 30px rgba(180,90,0,0.5), inset 0 12px 24px rgba(255,255,255,0.6)',
            display: 'grid',
            placeItems: 'center',
          }}
          aria-hidden="true"
        >
          <TrophySvg />
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '30px',
            fontWeight: 900,
            letterSpacing: '-0.6px',
            margin: '8px 0 2px',
            textShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        >
          Ready to play?
        </h2>
        <p style={{ opacity: 0.85, fontSize: '13px', margin: 0 }}>Daily Challenge · 10 questions</p>
      </div>

      {/* Big PLAY button */}
      <button
        type="button"
        onClick={onPlaySolo}
        style={{
          display: 'block',
          width: '80%',
          margin: '18px auto 0',
          background: 'linear-gradient(180deg,#fff,#eef3ff)',
          color: '#1657e0',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.3px',
          boxShadow: '0 16px 30px -10px rgba(0,0,0,0.45), inset 0 -3px 0 rgba(31,107,255,0.25)',
          cursor: 'pointer',
        }}
      >
        PLAY
      </button>

      {/* Mode chips */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '16px',
        }}
      >
        <ModeChip
          label="Solo"
          onClick={onPlaySolo}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
        />
        <ModeChip
          label="Duel"
          onClick={onChallenge}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 5l6 6M5 11l6-6M13 13l6 6M19 13l-6 6" />
            </svg>
          }
        />
        <ModeChip
          label="Group"
          onClick={onTogether}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M3 19a6 6 0 0112 0" />
            </svg>
          }
        />
      </div>
    </main>
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
