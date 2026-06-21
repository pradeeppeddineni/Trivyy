import { useCallback, useEffect, useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { StatusScreen } from '../components/StatusScreen';
import {
  adminListQuestions,
  adminListCategories,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminSetQuestionStatus,
  type AdminQuestion,
  type AdminCategory,
  type QuestionFilters,
} from '../api/client';

export interface AdminQuestionsProps {
  readonly onBack: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface Draft {
  readonly id: string | null;
  text: string;
  correctAnswer: string;
  incorrect: string[];
  categorySlug: string;
  difficulty: Difficulty;
  region: string;
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

const LABEL: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.4px',
  display: 'block',
  margin: '12px 0 6px',
};

const STATUS_FILTERS: ReadonlyArray<{ id: 'all' | 'active' | 'hidden'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'hidden', label: 'Hidden' },
];

function emptyDraft(): Draft {
  return {
    id: null,
    text: '',
    correctAnswer: '',
    incorrect: ['', '', ''],
    categorySlug: '',
    difficulty: 'easy',
    region: '',
  };
}

/** Admin question manager: search/filter, add/edit, hide/unhide (spec §5.5). */
export function AdminQuestions(props: AdminQuestionsProps): JSX.Element {
  const [filters, setFilters] = useState<QuestionFilters>({ status: 'all', page: 1 });
  const [data, setData] = useState<{ items: AdminQuestion[]; total: number } | null>(null);
  const [categories, setCategories] = useState<ReadonlyArray<AdminCategory>>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const load = useCallback(async (f: QuestionFilters) => {
    setLoading(true);
    try {
      const page = await adminListQuestions(f);
      setData({ items: [...page.items], total: page.total });
    } catch {
      setMessage('Could not load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  useEffect(() => {
    adminListCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const update = (patch: Partial<QuestionFilters>): void =>
    setFilters((prev) => ({ ...prev, page: 1, ...patch }));

  const onToggleStatus = async (q: AdminQuestion): Promise<void> => {
    const next = q.status === 'active' ? 'hidden' : 'active';
    try {
      await adminSetQuestionStatus(q.id, next);
      await load(filters);
    } catch {
      setMessage(`Could not ${next === 'hidden' ? 'hide' : 'unhide'} the question.`);
    }
  };

  const onSave = async (): Promise<void> => {
    if (!draft) return;
    const incorrect = draft.incorrect.map((s) => s.trim()).filter(Boolean);
    if (!draft.text.trim() || !draft.correctAnswer.trim() || incorrect.length === 0) {
      setMessage('Question, the correct answer, and at least one wrong answer are required.');
      return;
    }
    setSaving(true);
    setMessage(undefined);
    try {
      const input = {
        text: draft.text.trim(),
        correctAnswer: draft.correctAnswer.trim(),
        incorrectAnswers: incorrect,
        categorySlug: draft.categorySlug || undefined,
        difficulty: draft.difficulty,
        region: draft.region.trim() || undefined,
      };
      if (draft.id) {
        await adminUpdateQuestion(draft.id, input);
      } else {
        await adminCreateQuestion(input);
      }
      setDraft(null);
      await load(filters);
    } catch {
      setMessage('Could not save the question.');
    } finally {
      setSaving(false);
    }
  };

  if (draft) {
    return (
      <QuestionEditor
        draft={draft}
        categories={categories}
        saving={saving}
        message={message}
        onChange={setDraft}
        onSave={() => void onSave()}
        onCancel={() => {
          setDraft(null);
          setMessage(undefined);
        }}
      />
    );
  }

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
          Questions
        </h1>
        <button type="button" onClick={props.onBack} style={backLink}>
          ← Back
        </button>
      </div>

      <input
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value })}
        placeholder="Search question text…"
        style={INPUT}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            selected={(filters.status ?? 'all') === s.id}
            onClick={() => update({ status: s.id })}
            flex={false}
          />
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" onClick={() => setDraft(emptyDraft())}>
          + Add question
        </Button>
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

      <p style={{ fontSize: '12px', color: 'var(--faint)', margin: '16px 0 8px', fontWeight: 700 }}>
        {data ? `${data.total} QUESTION${data.total === 1 ? '' : 'S'}` : 'LOADING…'}
      </p>

      {loading && !data ? (
        <StatusScreen title="Loading…" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {data?.items.map((q) => (
            <div
              key={q.id}
              style={{
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                padding: '12px 13px',
                opacity: q.status === 'hidden' ? 0.6 : 1,
              }}
            >
              <p
                style={{
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 6px',
                }}
              >
                {q.text}
              </p>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '0 0 9px' }}>
                {q.categoryLabel ?? 'Surprise me'} · {q.difficulty}
                {q.region ? ` · ${q.region}` : ''}
                {q.status === 'hidden' ? ' · hidden' : ''} · ✓ {q.correctAnswer}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onClick={() =>
                    setDraft({
                      id: q.id,
                      text: q.text,
                      correctAnswer: q.correctAnswer,
                      incorrect: [...q.incorrectAnswers, '', '', ''].slice(0, 3),
                      categorySlug: q.categorySlug ?? '',
                      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty)
                        ? q.difficulty
                        : 'easy') as Difficulty,
                      region: q.region ?? '',
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onClick={() => void onToggleStatus(q)}
                >
                  {q.status === 'active' ? 'Hide' : 'Unhide'}
                </Button>
              </div>
            </div>
          ))}
          {data && data.items.length === 0 ? (
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No questions match.</span>
          ) : null}
        </div>
      )}

      {data && data.total > 25 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '14px',
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            fullWidth={false}
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
          >
            ← Prev
          </Button>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>
            Page {filters.page ?? 1} of {Math.max(1, Math.ceil(data.total / 25))}
          </span>
          <Button
            variant="ghost"
            size="sm"
            fullWidth={false}
            disabled={(filters.page ?? 1) >= Math.ceil(data.total / 25)}
            onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            Next →
          </Button>
        </div>
      ) : null}
    </main>
  );
}

const backLink: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: '14px',
  color: 'var(--accent-strong)',
  cursor: 'pointer',
  fontWeight: 700,
};

function QuestionEditor(props: {
  draft: Draft;
  categories: ReadonlyArray<AdminCategory>;
  saving: boolean;
  message?: string;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}): JSX.Element {
  const { draft, categories, saving, message, onChange, onSave, onCancel } = props;
  const set = (patch: Partial<Draft>): void => onChange({ ...draft, ...patch });
  const qId = useId();
  const aId = useId();
  const cId = useId();
  const rId = useId();

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
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '24px',
          margin: '8px 0',
          color: 'var(--ink)',
        }}
      >
        {draft.id ? 'Edit question' : 'Add question'}
      </h1>

      <label htmlFor={qId} style={LABEL}>
        QUESTION
      </label>
      <textarea
        id={qId}
        value={draft.text}
        onChange={(e) => set({ text: e.target.value })}
        rows={3}
        placeholder="The question"
        style={{ ...INPUT, resize: 'vertical' }}
      />

      <label htmlFor={aId} style={LABEL}>
        CORRECT ANSWER
      </label>
      <input
        id={aId}
        value={draft.correctAnswer}
        onChange={(e) => set({ correctAnswer: e.target.value })}
        placeholder="The correct answer"
        style={INPUT}
      />

      <label style={LABEL}>WRONG ANSWERS</label>
      {draft.incorrect.map((val, i) => (
        <input
          key={i}
          value={val}
          onChange={(e) => {
            const next = [...draft.incorrect];
            next[i] = e.target.value;
            set({ incorrect: next });
          }}
          placeholder={`Wrong answer ${i + 1}`}
          style={{ ...INPUT, marginBottom: '8px' }}
        />
      ))}

      <label htmlFor={cId} style={LABEL}>
        CATEGORY
      </label>
      <select
        id={cId}
        value={draft.categorySlug}
        onChange={(e) => set({ categorySlug: e.target.value })}
        style={INPUT}
      >
        <option value="">Surprise me (no category)</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>

      <label htmlFor={rId} style={LABEL}>
        REGION (optional, ISO code e.g. IN)
      </label>
      <input
        id={rId}
        value={draft.region}
        onChange={(e) => set({ region: e.target.value.toUpperCase().slice(0, 2) })}
        placeholder="Blank = global"
        style={INPUT}
      />

      <label style={LABEL}>DIFFICULTY</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <Chip
            key={d}
            label={d}
            selected={draft.difficulty === d}
            onClick={() => set({ difficulty: d })}
          />
        ))}
      </div>

      {message ? (
        <p
          role="alert"
          style={{
            color: 'var(--danger)',
            fontSize: '13.5px',
            margin: '14px 0 0',
            fontWeight: 600,
          }}
        >
          {message}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </main>
  );
}
