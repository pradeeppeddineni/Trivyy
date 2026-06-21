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

// --- Optional accounts (spec v3 §13.1, /api/auth/*) -------------------------

export interface Account {
  readonly id: string;
  readonly nickname: string;
  readonly username: string;
  readonly inviteCode: string;
}

/** Outcome of a credential submit — 'invalid' = bad creds, 'rate_limited' = 429. */
export type AuthResult = 'ok' | 'invalid' | 'rate_limited';

async function authPost(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error — please try again.');
  }
}

export interface RegisterResult {
  readonly account: Account;
  readonly recoveryCode: string;
}

/** Register an account; returns the account + one-time recovery code. */
export async function registerAccount(
  username: string,
  password: string,
  nickname?: string,
): Promise<RegisterResult> {
  const res = await authPost('/api/auth/register', { username, password, nickname });
  if (res.ok) {
    return (await res.json()) as RegisterResult;
  }
  if (res.status === 409) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      body.error === 'already_registered'
        ? "You're already signed in to an account."
        : 'That username is taken.',
    );
  }
  if (res.status === 429) {
    throw new Error('Too many attempts. Please wait a few minutes.');
  }
  if (res.status === 400) {
    throw new Error('Check your username (3+ chars) and password (8+ chars).');
  }
  throw new Error(`Request failed (${res.status})`);
}

export async function loginAccount(username: string, password: string): Promise<AuthResult> {
  const res = await authPost('/api/auth/login', { username, password });
  if (res.ok) return 'ok';
  if (res.status === 401) return 'invalid';
  if (res.status === 429) return 'rate_limited';
  throw new Error(`Request failed (${res.status})`);
}

/** Reset succeeds with a freshly rotated recovery code, or fails with a reason. */
export type ResetResult = { readonly recoveryCode: string } | 'invalid' | 'rate_limited';

export async function resetAccount(
  username: string,
  recoveryCode: string,
  newPassword: string,
): Promise<ResetResult> {
  const res = await authPost('/api/auth/reset', { username, recoveryCode, newPassword });
  if (res.ok) {
    const data = (await res.json()) as { recoveryCode: string };
    return { recoveryCode: data.recoveryCode };
  }
  if (res.status === 401) return 'invalid';
  if (res.status === 429) return 'rate_limited';
  throw new Error(`Request failed (${res.status})`);
}

export async function logoutAccount(): Promise<void> {
  await authPost('/api/auth/logout', {});
}

// --- Friends (spec v3 §13.2, /api/friends/*) -------------------------------

export interface PlayerSummary {
  readonly id: string;
  readonly username: string;
  readonly nickname: string;
}

export interface FriendRequest {
  readonly id: string;
  readonly from: PlayerSummary;
}

export interface FriendLeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly username: string;
  readonly points: number;
  readonly games: number;
  readonly isMe: boolean;
}

export async function listFriends(): Promise<ReadonlyArray<PlayerSummary>> {
  const d = await request<{ friends: ReadonlyArray<PlayerSummary> }>('/api/friends');
  return d.friends;
}

export async function listFriendRequests(): Promise<ReadonlyArray<FriendRequest>> {
  const d = await request<{ requests: ReadonlyArray<FriendRequest> }>('/api/friends/requests');
  return d.requests;
}

export async function searchPlayers(q: string): Promise<ReadonlyArray<PlayerSummary>> {
  const d = await request<{ players: ReadonlyArray<PlayerSummary> }>(
    `/api/friends/search?q=${encodeURIComponent(q)}`,
  );
  return d.players;
}

export async function sendFriendRequest(username: string): Promise<{ status: string }> {
  return request<{ status: string }>('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function respondFriendRequest(id: string, accept: boolean): Promise<void> {
  await request<{ ok: true }>(`/api/friends/requests/${id}/${accept ? 'accept' : 'decline'}`, {
    method: 'POST',
  });
}

export async function acceptFriendInvite(code: string): Promise<void> {
  await request<{ ok: true }>(`/api/friends/invite/${encodeURIComponent(code)}`, {
    method: 'POST',
  });
}

export async function getFriendsLeaderboard(): Promise<ReadonlyArray<FriendLeaderboardEntry>> {
  const d = await request<{ entries: ReadonlyArray<FriendLeaderboardEntry> }>(
    '/api/friends/leaderboard',
  );
  return d.entries;
}

/** The signed-in account, or null if the visitor is a guest. */
export async function authMe(): Promise<Account | null> {
  let res: Response;
  try {
    res = await fetch('/api/auth/me', { credentials: 'include' });
  } catch {
    throw new Error('Network error — please try again.');
  }
  if (!res.ok) return null;
  const data = (await res.json()) as { account: Account };
  return data.account;
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
  readonly score: number;
}

export interface LobbyResponse {
  readonly code: string;
  readonly status: string;
  readonly maxPlayers: number | null;
  readonly players: ReadonlyArray<LobbyPlayer>;
}

export interface CreateGroupOptions extends SoloGameOptions {
  readonly maxPlayers?: number;
  /** Persistent group this round belongs to (standings). */
  readonly groupId?: string;
}

// --- Persistent groups (spec v3 §13.3, /api/groups/*) -----------------------

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly memberCount: number;
  readonly isOwner: boolean;
}

export interface GroupMember {
  readonly nickname: string;
  readonly username: string | null;
  readonly isOwner: boolean;
}

export interface GroupDetail extends Group {
  readonly members: ReadonlyArray<GroupMember>;
}

export interface GroupStanding {
  readonly rank: number;
  readonly nickname: string;
  readonly points: number;
  readonly games: number;
}

export async function createGroupClub(
  name: string,
): Promise<{ id: string; name: string; code: string }> {
  return request('/api/groups', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function joinGroupClub(code: string): Promise<{ groupId: string }> {
  return request('/api/groups/join', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function listGroups(): Promise<ReadonlyArray<Group>> {
  const d = await request<{ groups: ReadonlyArray<Group> }>('/api/groups');
  return d.groups;
}

export async function getGroupDetail(id: string): Promise<GroupDetail> {
  return request<GroupDetail>(`/api/groups/${id}`);
}

export async function getGroupStandings(id: string): Promise<ReadonlyArray<GroupStanding>> {
  const d = await request<{ entries: ReadonlyArray<GroupStanding> }>(`/api/groups/${id}/standings`);
  return d.entries;
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

export async function createGroupGame(options: CreateGroupOptions): Promise<CreateGroupResponse> {
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

/** Outcome of an admin login attempt — `invalid` is bad credentials (401). */
export type AdminLoginResult = 'ok' | 'invalid';

/**
 * POST /api/admin/login (username + password). Returns 'ok' on success,
 * 'invalid' on bad credentials (401, so the UI can show a precise message), and
 * throws for anything unexpected (network, 429, 500) for a generic fallback.
 */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResult> {
  let res: Response;
  try {
    res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
  if (res.status === 429) {
    throw new Error('Too many attempts. Please wait a few minutes.');
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
  readonly locations: ReadonlyArray<{
    readonly country: string | null;
    readonly players: number;
  }>;
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

// --- Admin curation (spec §5.5, /api/admin/questions + /categories) ---------

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

export interface AdminQuestionInput {
  readonly text: string;
  readonly correctAnswer: string;
  readonly incorrectAnswers: ReadonlyArray<string>;
  readonly categorySlug?: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionsPage {
  readonly items: ReadonlyArray<AdminQuestion>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface QuestionFilters {
  readonly search?: string;
  readonly category?: string;
  readonly difficulty?: string;
  readonly status?: 'active' | 'hidden' | 'all';
  readonly page?: number;
}

export async function adminListQuestions(filters: QuestionFilters = {}): Promise<QuestionsPage> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.difficulty && filters.difficulty !== 'any')
    params.set('difficulty', filters.difficulty);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return request<QuestionsPage>(`/api/admin/questions${qs ? `?${qs}` : ''}`);
}

export async function adminCreateQuestion(input: AdminQuestionInput): Promise<AdminQuestion> {
  return request<AdminQuestion>('/api/admin/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function adminUpdateQuestion(
  id: string,
  input: AdminQuestionInput,
): Promise<AdminQuestion> {
  return request<AdminQuestion>(`/api/admin/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function adminSetQuestionStatus(
  id: string,
  status: 'active' | 'hidden',
): Promise<void> {
  await request<{ ok: true }>(`/api/admin/questions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface AdminCategory {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
  readonly status: string;
  readonly questionCount: number;
}

export async function adminListCategories(): Promise<ReadonlyArray<AdminCategory>> {
  const data = await request<{ categories: ReadonlyArray<AdminCategory> }>('/api/admin/categories');
  return data.categories;
}

export async function adminCreateCategory(input: {
  slug: string;
  label: string;
  icon: string;
}): Promise<AdminCategory> {
  return request<AdminCategory>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
