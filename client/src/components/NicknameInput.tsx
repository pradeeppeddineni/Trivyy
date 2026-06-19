import { useId } from 'react';
import type { CSSProperties } from 'react';

export interface NicknameInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly confirmation?: string;
}

const FIELD: CSSProperties = {
  flex: 1,
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

/** Length-limited nickname field (SEC-5) with an optional confirmation line. */
export function NicknameInput(props: NicknameInputProps): JSX.Element {
  const {
    value,
    onChange,
    label = 'YOUR NICKNAME',
    placeholder = 'e.g. QuizWhiz',
    maxLength = 16,
    confirmation,
  } = props;
  const fieldId = useId();

  return (
    <div>
      <label
        htmlFor={fieldId}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--faint)',
          marginLeft: '4px',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <input
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={FIELD}
        />
      </div>
      {confirmation ? (
        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--accent-strong)',
            margin: '9px 0 0 4px',
            fontWeight: 600,
          }}
        >
          {confirmation}
        </p>
      ) : null}
    </div>
  );
}
