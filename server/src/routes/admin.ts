import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import type { Env } from '../config/env';
import { requireAdmin } from '../middleware/auth';
import { getAdminStats } from '../services/statsService';
import { GameError } from '../services/gameService';
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  setQuestionStatus,
  listAdminCategories,
  createCategory,
} from '../services/questionAdminService';
import {
  adminLoginSchema,
  adminQuestionSchema,
  questionStatusSchema,
  categorySchema,
  listQuestionsQuerySchema,
} from '../schemas/admin';
import { gameIdSchema } from '../schemas/games';

const PAGE_SIZE = 25;

/** Map a GameError to its status; rethrow anything else to the error handler. */
function sendError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof GameError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

/**
 * Single-admin auth + curation (spec §8, /api/admin/*). Login is username +
 * argon2 password (SEC-1, ADR 0004); curation routes are gated by requireAdmin.
 */
export function adminRouter(env: Env): Router {
  const router = Router();

  // Throttle credential stuffing on the login route (SEC). Generous enough for
  // a single admin retyping a password.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too_many_attempts' },
  });

  router.post('/login', loginLimiter, async (req, res, next) => {
    try {
      const parsed = adminLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      const ok =
        parsed.data.username === env.ADMIN_USERNAME &&
        (await argon2.verify(env.ADMIN_PASSWORD_HASH, parsed.data.password));
      if (!ok) {
        res.status(401).json({ error: 'invalid_credentials' });
        return;
      }
      req.session.isAdmin = true;
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.json({ ok: true });
  });

  router.get('/whoami', requireAdmin, (_req, res) => {
    res.json({ role: 'admin' });
  });

  // --- Analytics (OBS-3) ---
  router.get('/stats', requireAdmin, async (_req, res, next) => {
    try {
      res.json(await getAdminStats());
    } catch (err) {
      next(err);
    }
  });

  // --- Question curation (spec §5.5) ---
  router.get('/questions', requireAdmin, async (req, res, next) => {
    try {
      const q = listQuestionsQuerySchema.safeParse(req.query);
      if (!q.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      const page = q.data.page ?? 1;
      const result = await listQuestions({
        search: q.data.search,
        categorySlug: q.data.category,
        difficulty: q.data.difficulty,
        status: q.data.status ?? 'all',
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      res.json({ ...result, page, pageSize: PAGE_SIZE });
    } catch (err) {
      sendError(res, err, next);
    }
  });

  router.post('/questions', requireAdmin, async (req, res, next) => {
    try {
      const parsed = adminQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      res.status(201).json(await createQuestion(parsed.data));
    } catch (err) {
      sendError(res, err, next);
    }
  });

  router.put('/questions/:id', requireAdmin, async (req, res, next) => {
    try {
      const id = gameIdSchema.safeParse(req.params.id);
      const parsed = adminQuestionSchema.safeParse(req.body);
      if (!id.success || !parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      res.json(await updateQuestion(id.data, parsed.data));
    } catch (err) {
      sendError(res, err, next);
    }
  });

  router.patch('/questions/:id/status', requireAdmin, async (req, res, next) => {
    try {
      const id = gameIdSchema.safeParse(req.params.id);
      const parsed = questionStatusSchema.safeParse(req.body);
      if (!id.success || !parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      await setQuestionStatus(id.data, parsed.data.status);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, next);
    }
  });

  // --- Category management (spec §5.5) ---
  router.get('/categories', requireAdmin, async (_req, res, next) => {
    try {
      res.json({ categories: await listAdminCategories() });
    } catch (err) {
      sendError(res, err, next);
    }
  });

  router.post('/categories', requireAdmin, async (req, res, next) => {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      res.status(201).json(await createCategory(parsed.data));
    } catch (err) {
      sendError(res, err, next);
    }
  });

  return router;
}
