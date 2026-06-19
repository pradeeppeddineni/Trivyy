/** Thin fetch wrapper for the Trivyy REST API. All calls send the session cookie. */

export interface SessionResponse {
  readonly nickname: string;
}

/** A question as served by the API: choices are shuffled and un-flagged. */
export interface ApiQuestion {
  readonly id: string;
  readonly text: string;
  readonly category: string | null;
  readonly categoryIcon: string | null;
  readonly difficulty: string;
  readonly choices: ReadonlyArray<string>;
}

export interface CreateSoloGameResponse {
  readonly gameId: string;
  readonly questions: ReadonlyArray<ApiQuestion>;
}

export interface SubmitAnswerResponse {
  readonly correct: boolean;
  readonly correctAnswer: string;
}

export interface CompleteGameResponse {
  readonly score: number;
  readonly total: number;
}

export interface ReviewRow {
  readonly question: string;
  readonly your: string | null;
  readonly correct: string;
  readonly isCorrect: boolean;
}

export interface ResultResponse {
  readonly score: number;
  readonly total: number;
  readonly review: ReadonlyArray<ReviewRow>;
}

export type Difficulty = 'any' | 'easy' | 'medium' | 'hard';

export interface SoloGameOptions {
  readonly count: number;
  readonly categorySlug?: string;
  readonly difficulty?: Difficulty;
}

/** Shared fetch helper: JSON body, credentials, and a friendly error on failure. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Network error — please try again.');
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function createSession(nickname: string): Promise<SessionResponse> {
  return request<SessionResponse>('/api/session', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export async function createSoloGame(options: SoloGameOptions): Promise<CreateSoloGameResponse> {
  return request<CreateSoloGameResponse>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ mode: 'solo', ...options }),
  });
}

export async function getQuestions(gameId: string): Promise<ReadonlyArray<ApiQuestion>> {
  const data = await request<{ questions: ReadonlyArray<ApiQuestion> }>(
    `/api/games/${gameId}/questions`,
  );
  return data.questions;
}

export async function submitAnswer(
  gameId: string,
  questionId: string,
  selectedAnswer: string,
  elapsedMs?: number,
): Promise<SubmitAnswerResponse> {
  return request<SubmitAnswerResponse>(`/api/games/${gameId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ questionId, selectedAnswer, elapsedMs }),
  });
}

export async function completeGame(gameId: string): Promise<CompleteGameResponse> {
  return request<CompleteGameResponse>(`/api/games/${gameId}/complete`, {
    method: 'POST',
  });
}

export async function getResult(gameId: string): Promise<ResultResponse> {
  return request<ResultResponse>(`/api/games/${gameId}/result`);
}

// --- Duel (async) + Group (play together) ----------------------------------

export interface CreateDuelResponse {
  readonly gameId: string;
  readonly mode: 'duel';
  readonly code: string;
  readonly questions: ReadonlyArray<ApiQuestion>;
}

export interface CreateGroupResponse {
  readonly gameId: string;
  readonly mode: 'together';
  readonly code: string;
}

/** Result of joining by code — questions are present only for a duel. */
export interface JoinResponse {
  readonly gameId: string;
  readonly mode: 'duel' | 'together';
  readonly role: string;
  readonly questions?: ReadonlyArray<ApiQuestion>;
}

export type DuelOutcome = 'win' | 'loss' | 'draw';

export interface DuelSide {
  readonly nickname: string;
  readonly score: number | null;
}

export interface DuelResultResponse {
  readonly mode: 'duel';
  readonly status: 'waiting' | 'complete';
  readonly total: number;
  readonly you: DuelSide;
  readonly opponent: DuelSide | null;
  readonly outcome: DuelOutcome | null;
  readonly review: ReadonlyArray<ReviewRow>;
}

export interface LobbyPlayer {
  readonly nickname: string;
  readonly status: string;
  readonly isHost: boolean;
}

export interface LobbyResponse {
  readonly code: string;
  readonly status: string;
  readonly players: ReadonlyArray<LobbyPlayer>;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly score: number;
  readonly total: number;
  readonly done: boolean;
}

export interface LeaderboardResponse {
  readonly status: string;
  readonly total: number;
  readonly entries: ReadonlyArray<LeaderboardEntry>;
}

export async function createDuelGame(options: SoloGameOptions): Promise<CreateDuelResponse> {
  return request<CreateDuelResponse>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ mode: 'duel', ...options }),
  });
}

export async function createGroupGame(options: SoloGameOptions): Promise<CreateGroupResponse> {
  return request<CreateGroupResponse>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ mode: 'together', ...options }),
  });
}

/**
 * Join a duel or group by code. Surfaces a precise message for the two expected
 * rejections (404 unknown code, 409 not joinable) so the UI can guide the user.
 */
export async function joinGame(code: string): Promise<JoinResponse> {
  let res: Response;
  try {
    res = await fetch('/api/games/join', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch {
    throw new Error('Network error — please try again.');
  }
  if (res.ok) {
    return (await res.json()) as JoinResponse;
  }
  if (res.status === 404) {
    throw new Error('No game found for that code.');
  }
  if (res.status === 409) {
    throw new Error('That game can no longer be joined.');
  }
  throw new Error(`Request failed (${res.status})`);
}

export async function getDuelResult(gameId: string): Promise<DuelResultResponse> {
  return request<DuelResultResponse>(`/api/games/${gameId}/result`);
}

export async function getLobby(gameId: string): Promise<LobbyResponse> {
  return request<LobbyResponse>(`/api/games/${gameId}/lobby`);
}

export async function startGroup(gameId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/api/games/${gameId}/start`, { method: 'POST' });
}

export async function getLeaderboard(gameId: string): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>(`/api/games/${gameId}/leaderboard`);
}

// --- Admin auth (spec 8, /api/admin/*) -------------------------------------
// Frontend checks are UX only; the API's requireAdmin guard is the real
// boundary (server middleware/auth.ts). These helpers just collect the password
// and reflect the session state the API reports.

/** Outcome of an admin login attempt — `invalid` is a wrong password (401). */
export type AdminLoginResult = 'ok' | 'invalid';

/**
 * POST /api/admin/login. Returns 'ok' on success, 'invalid' on a wrong password
 * (so the UI can show a precise message), and throws for anything unexpected
 * (network, 500) so callers fall back to a generic error.
 */
export async function adminLogin(password: string): Promise<AdminLoginResult> {
  let res: Response;
  try {
    res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new Error('Network error — please try again.');
  }
  if (res.ok) {
    return 'ok';
  }
  if (res.status === 401) {
    return 'invalid';
  }
  throw new Error(`Request failed (${res.status})`);
}

export async function adminLogout(): Promise<void> {
  await request<{ ok: true }>('/api/admin/logout', { method: 'POST' });
}

export interface AdminStats {
  readonly games: {
    readonly total: number;
    readonly solo: number;
    readonly duel: number;
    readonly together: number;
    readonly completed: number;
  };
  readonly players: number;
  readonly questions: number;
  readonly answers: number;
  readonly accuracyPct: number;
  readonly avgResponseMs: number | null;
  readonly mostMissed: ReadonlyArray<{
    readonly question: string;
    readonly attempts: number;
    readonly missed: number;
    readonly missRatePct: number;
  }>;
  readonly byCategory: ReadonlyArray<{
    readonly category: string;
    readonly answers: number;
    readonly accuracyPct: number;
  }>;
  readonly byDifficulty: ReadonlyArray<{
    readonly difficulty: string;
    readonly answers: number;
    readonly accuracyPct: number;
  }>;
  readonly recent: ReadonlyArray<{
    readonly type: string;
    readonly gameId: string | null;
    readonly at: string;
  }>;
  readonly users: {
    readonly unique: number;
    readonly returning: number;
    readonly newThisWeek: number;
    readonly avgGamesPerPlayer: number;
    readonly repeatRatePct: number;
    readonly top: ReadonlyArray<{
      readonly nickname: string;
      readonly games: number;
      readonly best: number;
    }>;
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/api/admin/stats');
}

/** True when a valid admin session is active (GET /api/admin/whoami → 200). */
export async function adminWhoami(): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch('/api/admin/whoami', { credentials: 'include' });
  } catch {
    throw new Error('Network error — please try again.');
  }
  return res.ok;
}
