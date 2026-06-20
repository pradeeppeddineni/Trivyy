import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { categoryIdForSlug } from './questionService';
import { GameError } from './gameService';

/**
 * Admin curation of the question bank + categories (spec §5.5). Soft-delete only
 * (status flag) so game-history references are never broken (DB-6). No Express
 * types here (ARC-2).
 */

export interface AdminQuestion {
  readonly id: string;
  readonly text: string;
  readonly correctAnswer: string;
  readonly incorrectAnswers: ReadonlyArray<string>;
  readonly categorySlug: string | null;
  readonly categoryLabel: string | null;
  readonly difficulty: string;
  readonly status: string;
  readonly source: string;
  readonly updatedAt: string;
}

interface QuestionDbRow {
  id: string;
  text: string;
  correct_answer: string;
  incorrect_answers: string[];
  category_slug: string | null;
  category_label: string | null;
  difficulty: string;
  status: string;
  source: string;
  updated_at: Date | string;
}

function toAdminQuestion(row: QuestionDbRow): AdminQuestion {
  return {
    id: row.id,
    text: row.text,
    correctAnswer: row.correct_answer,
    incorrectAnswers: row.incorrect_answers,
    categorySlug: row.category_slug,
    categoryLabel: row.category_label,
    difficulty: row.difficulty,
    status: row.status,
    source: row.source,
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export interface ListQuestionsOptions {
  readonly search?: string;
  readonly categorySlug?: string;
  readonly difficulty?: string;
  /** 'active' | 'hidden' | 'all' (default 'all'). */
  readonly status?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListQuestionsResult {
  readonly items: ReadonlyArray<AdminQuestion>;
  readonly total: number;
}

const SELECT_COLS = `q.id, q.text, q.correct_answer, q.incorrect_answers, q.difficulty,
       q.status, q.source, q.updated_at,
       c.slug AS category_slug, c.label AS category_label`;

/** Search/filter the bank for the admin questions screen. */
export async function listQuestions(options: ListQuestionsOptions): Promise<ListQuestionsResult> {
  const { search, categorySlug, difficulty, status = 'all', limit = 25, offset = 0 } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status === 'active' || status === 'hidden') {
    params.push(status);
    conditions.push(`q.status = $${params.length}`);
  }
  if (difficulty && difficulty !== 'any') {
    params.push(difficulty);
    conditions.push(`q.difficulty = $${params.length}`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`q.text ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query<{ n: string }>(
    `SELECT count(*) AS n FROM questions q LEFT JOIN categories c ON c.id = q.category_id ${where}`,
    params,
  );

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const rows = await pool.query<QuestionDbRow>(
    `SELECT ${SELECT_COLS}
       FROM questions q LEFT JOIN categories c ON c.id = q.category_id
       ${where}
      ORDER BY q.updated_at DESC, q.id
      LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params,
  );

  return { items: rows.rows.map(toAdminQuestion), total: Number(totalResult.rows[0].n) };
}

export interface QuestionInput {
  readonly text: string;
  readonly correctAnswer: string;
  readonly incorrectAnswers: ReadonlyArray<string>;
  readonly categorySlug?: string | null;
  readonly difficulty: string;
}

async function resolveCategory(slug: string | null | undefined): Promise<string | null> {
  if (!slug) {
    return null;
  }
  const id = await categoryIdForSlug(slug);
  if (!id) {
    throw new GameError('unknown_category', 400);
  }
  return id;
}

/** Add an admin-authored question (source='admin', active). */
export async function createQuestion(input: QuestionInput): Promise<AdminQuestion> {
  const categoryId = await resolveCategory(input.categorySlug);
  const result = await pool.query<QuestionDbRow>(
    `WITH inserted AS (
       INSERT INTO questions (text, correct_answer, incorrect_answers, category, category_id, difficulty, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'active')
       RETURNING *
     )
     SELECT ${SELECT_COLS}
       FROM inserted q LEFT JOIN categories c ON c.id = q.category_id`,
    [
      input.text,
      input.correctAnswer,
      input.incorrectAnswers,
      input.categorySlug ?? null,
      categoryId,
      input.difficulty,
    ],
  );
  logger.info('admin_question_created', { questionId: result.rows[0].id });
  return toAdminQuestion(result.rows[0]);
}

/** Edit any question (text/answers/category/difficulty); stamps updated_at. */
export async function updateQuestion(id: string, input: QuestionInput): Promise<AdminQuestion> {
  const categoryId = await resolveCategory(input.categorySlug);
  const result = await pool.query<QuestionDbRow>(
    `WITH updated AS (
       UPDATE questions
          SET text = $2, correct_answer = $3, incorrect_answers = $4,
              category = $5, category_id = $6, difficulty = $7, updated_at = now()
        WHERE id = $1
        RETURNING *
     )
     SELECT ${SELECT_COLS}
       FROM updated q LEFT JOIN categories c ON c.id = q.category_id`,
    [
      id,
      input.text,
      input.correctAnswer,
      input.incorrectAnswers,
      input.categorySlug ?? null,
      categoryId,
      input.difficulty,
    ],
  );
  if (result.rows.length === 0) {
    throw new GameError('question_not_found', 404);
  }
  logger.info('admin_question_updated', { questionId: id });
  return toAdminQuestion(result.rows[0]);
}

/** Hide/unhide a question (soft delete via status, DB-6). */
export async function setQuestionStatus(id: string, status: 'active' | 'hidden'): Promise<void> {
  const result = await pool.query(
    `UPDATE questions SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
  if (result.rowCount === 0) {
    throw new GameError('question_not_found', 404);
  }
  logger.info('admin_question_status', { questionId: id, status });
}

export interface AdminCategory {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
  readonly status: string;
  readonly questionCount: number;
}

/** Categories with their active-question counts for the admin screen. */
export async function listAdminCategories(): Promise<ReadonlyArray<AdminCategory>> {
  const rows = await pool.query<{
    slug: string;
    label: string;
    icon: string;
    status: string;
    n: string;
  }>(
    `SELECT c.slug, c.label, c.icon, c.status,
            count(q.id) FILTER (WHERE q.status = 'active') AS n
       FROM categories c
       LEFT JOIN questions q ON q.category_id = c.id
      GROUP BY c.id, c.slug, c.label, c.icon, c.status
      ORDER BY c.label`,
  );
  return rows.rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    status: row.status,
    questionCount: Number(row.n),
  }));
}

export interface CategoryInput {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
}

/** Add a curated category. Slug is unique; a duplicate is a 409. */
export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  try {
    await pool.query(`INSERT INTO categories (slug, label, icon) VALUES ($1, $2, $3)`, [
      input.slug,
      input.label,
      input.icon,
    ]);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
      throw new GameError('category_exists', 409);
    }
    throw err;
  }
  logger.info('admin_category_created', { slug: input.slug });
  return {
    slug: input.slug,
    label: input.label,
    icon: input.icon,
    status: 'active',
    questionCount: 0,
  };
}
