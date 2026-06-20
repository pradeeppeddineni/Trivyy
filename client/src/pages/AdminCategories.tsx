import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { StatusScreen } from '../components/StatusScreen';
import { adminListCategories, adminCreateCategory, type AdminCategory } from '../api/client';

export interface AdminCategoriesProps {
  readonly onBack: () => void;
}

const INPUT: CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--ink)',
  background: 'var(--card)',
};

const backLink: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: '14px',
  color: 'var(--accent-strong)',
  cursor: 'pointer',
  fontWeight: 700,
};

/** Admin category management: list with counts + add a new one (spec §5.5). */
export function AdminCategories(props: AdminCategoriesProps): JSX.Element {
  const [categories, setCategories] = useState<ReadonlyArray<AdminCategory> | null>(null);
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setCategories(await adminListCategories());
    } catch {
      setMessage('Could not load categories.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async (): Promise<void> => {
    if (!slug.trim() || !label.trim() || !icon.trim()) {
      setMessage('Slug, label, and an icon are all required.');
      return;
    }
    setSaving(true);
    setMessage(undefined);
    try {
      await adminCreateCategory({ slug: slug.trim(), label: label.trim(), icon: icon.trim() });
      setSlug('');
      setLabel('');
      setIcon('');
      await load();
    } catch {
      setMessage('Could not add the category (the slug may already exist).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 20px 28px',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '24px',
            margin: '8px 0',
            color: 'var(--ink)',
          }}
        >
          Categories
        </h1>
        <button type="button" onClick={props.onBack} style={backLink}>
          ← Back
        </button>
      </div>

      {categories === null ? (
        <StatusScreen title="Loading…" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map((c) => (
            <div
              key={c.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                padding: '12px 13px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                {c.icon} {c.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>
                {c.questionCount} active
              </span>
            </div>
          ))}
        </div>
      )}

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '18px',
          margin: '22px 0 4px',
          color: 'var(--ink)',
        }}
      >
        Add a category
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Icon (emoji), e.g. ⚽"
          style={INPUT}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label, e.g. Sports"
          style={INPUT}
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="Slug, e.g. sports (lowercase, hyphens)"
          style={INPUT}
        />
      </div>

      {message ? (
        <p
          role="alert"
          style={{
            color: 'var(--danger)',
            fontSize: '13.5px',
            margin: '12px 0 0',
            fontWeight: 600,
          }}
        >
          {message}
        </p>
      ) : null}

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={() => void onAdd()} disabled={saving}>
          {saving ? 'Adding…' : 'Add category'}
        </Button>
      </div>
    </main>
  );
}
