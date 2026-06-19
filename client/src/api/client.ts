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
