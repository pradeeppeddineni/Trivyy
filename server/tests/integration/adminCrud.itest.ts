import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  setQuestionStatus,
  listAdminCategories,
  createCategory,
} from '../../src/services/questionAdminService';
import { pickQuestions } from '../../src/services/questionService';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for admin curation (spec §5.5). Endpoint auth is
 * checked at the route; the curation logic is exercised at the service layer
 * (no admin password hash needed), including the key guarantee: a hidden
 * question stops being served (DB-6 soft delete).
 */
describe('admin curation (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp(loadEnv());
  });

  beforeEach(async () => {
    await resetGameData();
    await seedQuestions();
  });

  afterAll(async () => {
    await testPool.end();
    await pool.end();
  });

  it('all admin curation routes require auth', async () => {
    expect((await request(app).get('/api/admin/questions')).status).toBe(401);
    expect((await request(app).post('/api/admin/questions').send({})).status).toBe(401);
    expect((await request(app).get('/api/admin/categories')).status).toBe(401);
  });

  it('creates, lists, edits, and searches questions', async () => {
    const created = await createQuestion({
      text: 'Q-admin: what colour is the sky on a clear day?',
      correctAnswer: 'Blue',
      incorrectAnswers: ['Green', 'Red', 'Yellow'],
      categorySlug: 'science',
      difficulty: 'easy',
    });
    expect(created.source).toBe('admin');
    expect(created.categorySlug).toBe('science');

    const found = await listQuestions({ search: 'colour is the sky', status: 'all' });
    expect(found.total).toBeGreaterThanOrEqual(1);
    expect(found.items.some((q) => q.id === created.id)).toBe(true);

    const edited = await updateQuestion(created.id, {
      text: created.text,
      correctAnswer: 'Blue',
      incorrectAnswers: ['Grey', 'Black'],
      categorySlug: 'science',
      difficulty: 'medium',
    });
    expect(edited.difficulty).toBe('medium');
    expect(edited.incorrectAnswers).toHaveLength(2);
  });

  it('creates a question with no category (Surprise me)', async () => {
    const created = await createQuestion({
      text: 'Q-admin: no-category question?',
      correctAnswer: 'Yes',
      incorrectAnswers: ['No'],
      difficulty: 'easy',
    });
    expect(created.categorySlug).toBeNull();
  });

  it('rejects an unknown category on create', async () => {
    await expect(
      createQuestion({
        text: 'Q-admin: bad category',
        correctAnswer: 'A',
        incorrectAnswers: ['B', 'C'],
        categorySlug: 'not-a-real-category',
        difficulty: 'easy',
      }),
    ).rejects.toThrow();
  });

  it('hiding a question stops it being served (soft delete)', async () => {
    // A science-only question we control.
    const q = await createQuestion({
      text: 'Q-admin: unique hideable question?',
      correctAnswer: 'Yes',
      incorrectAnswers: ['No', 'Maybe'],
      categorySlug: 'science',
      difficulty: 'easy',
    });

    // Active → it can be picked and shows in the active list.
    const activeBefore = await listQuestions({ status: 'active', search: 'unique hideable' });
    expect(activeBefore.items.some((x) => x.id === q.id)).toBe(true);

    await setQuestionStatus(q.id, 'hidden');

    // Hidden → gone from the active list, still in the full list, never served.
    const activeAfter = await listQuestions({ status: 'active', search: 'unique hideable' });
    expect(activeAfter.items.some((x) => x.id === q.id)).toBe(false);
    const allAfter = await listQuestions({ status: 'hidden', search: 'unique hideable' });
    expect(allAfter.items.some((x) => x.id === q.id)).toBe(true);

    const picked = await pickQuestions({
      playerId: '00000000-0000-0000-0000-000000000000',
      count: 50,
      categorySlug: 'science',
    });
    expect(picked.some((x) => x.id === q.id)).toBe(false);
  });

  it('lists categories with counts and adds a new one', async () => {
    const before = await listAdminCategories();
    expect(before.length).toBeGreaterThanOrEqual(6);

    const added = await createCategory({ slug: 'sports', label: 'Sports', icon: '⚽' });
    expect(added.slug).toBe('sports');

    const after = await listAdminCategories();
    expect(after.some((c) => c.slug === 'sports')).toBe(true);

    // Duplicate slug rejected.
    await expect(
      createCategory({ slug: 'sports', label: 'Sports 2', icon: '🏀' }),
    ).rejects.toThrow();
  });
});
