import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { Switch } from '../components/Switch';
import { ThemeToggle } from '../components/ThemeToggle';
import { useFeedbackPrefs } from '../feedback/prefs';

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
  const [prefs, setPrefs] = useFeedbackPrefs();

  return (
    <AppFrame>
      <div style={WRAP}>
        <h1 style={H1}>Settings</h1>
        <div style={ROW}>
          <span style={LABEL}>Dark mode</span>
          <ThemeToggle />
        </div>
        <div style={ROW}>
          <span style={LABEL}>Sound</span>
          <Switch
            checked={prefs.sound}
            onChange={(on) => setPrefs({ ...prefs, sound: on })}
            label="Sound"
          />
        </div>
        <div style={ROW}>
          <span style={LABEL}>Haptics</span>
          <Switch
            checked={prefs.haptics}
            onChange={(on) => setPrefs({ ...prefs, haptics: on })}
            label="Haptics"
          />
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
