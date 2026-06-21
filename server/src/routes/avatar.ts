import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { resolveCurrentPlayer } from './currentPlayer';
import { uuidSchema } from '../schemas/admin';
import {
  setUploadedAvatar,
  setPresetAvatar,
  getAvatar,
  AvatarError,
} from '../services/avatarService';

/**
 * Avatar endpoints (spec Phase 1 UI overhaul, ARC-2). All handlers stay thin:
 * validate, resolve the player, delegate to avatarService, return JSON or binary.
 * Image bytes are never logged (OBS-1).
 */
export const avatarRouter = Router();

// Memory storage — we process the buffer synchronously in the service.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB raw
});

/**
 * Wrap multer's single-file middleware so that MulterErrors (e.g. LIMIT_FILE_SIZE)
 * are converted to a 400 response instead of falling through to the 500 central
 * handler. This makes the contract explicit: multipart validation failures are
 * client errors, not server errors (API-3).
 */
function uploadSingle(field: string): RequestHandler {
  const middleware = upload.single(field);
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'invalid_upload';
        res.status(400).json({ error: message });
        return;
      }
      next(err);
    });
  };
}

// Same window/max as the auth rate-limiter — generous for a household, stops abuse.
const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

const presetSchema = z.object({
  preset: z.string().min(1),
});

/** Map AvatarError to 400; rethrow everything else to the central handler. */
function sendAvatarError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof AvatarError) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
}

/** Resolve the player or immediately send 401. Returns null on failure. */
async function requirePlayer(req: Request, res: Response): Promise<{ id: string } | null> {
  const player = await resolveCurrentPlayer(req);
  if (!player) {
    res.status(401).json({ error: 'no_session' });
    return null;
  }
  return player;
}

/**
 * POST /api/me/avatar
 * Upload a new avatar (multipart, field `image`, max 2 MB). Processes the
 * image via sharp (resize + webp conversion + metadata strip) before storing.
 */
avatarRouter.post(
  '/me/avatar',
  avatarLimiter,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const player = await requirePlayer(req, res);
      if (!player) return;

      if (!req.file) {
        res.status(400).json({ error: 'no_image_uploaded' });
        return;
      }

      await setUploadedAvatar(player.id, req.file.buffer, req.file.mimetype);
      res.json({ ok: true });
    } catch (err) {
      sendAvatarError(res, err, next);
    }
  },
);

/**
 * POST /api/me/avatar/preset
 * Set a colour-preset avatar. Body: `{ preset: string }`.
 */
avatarRouter.post(
  '/me/avatar/preset',
  avatarLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const player = await requirePlayer(req, res);
      if (!player) return;

      const parsed = presetSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      await setPresetAvatar(player.id, parsed.data.preset);
      res.json({ ok: true });
    } catch (err) {
      sendAvatarError(res, err, next);
    }
  },
);

/**
 * GET /api/players/:id/avatar
 * Serve the stored webp avatar for any player. Returns 404 when none is set.
 * Cached privately for 5 minutes (short enough to pick up fresh uploads).
 */
avatarRouter.get('/players/:id/avatar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) {
      // Treat an unparseable id the same as "no such avatar" — not a server error.
      res.status(404).json({ error: 'no_avatar' });
      return;
    }

    const avatar = await getAvatar(parsed.data);
    if (!avatar) {
      res.status(404).json({ error: 'no_avatar' });
      return;
    }
    res.set('Content-Type', avatar.mime);
    res.set('Cache-Control', 'private, max-age=300');
    res.send(avatar.image);
  } catch (err) {
    next(err);
  }
});
