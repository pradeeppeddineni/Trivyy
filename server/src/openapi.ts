/**
 * OpenAPI 3.0 description of the Trivyy REST API (API-1). Checked into the repo
 * as the contract for every endpoint; served as JSON at GET /api/openapi.json
 * and browsable via Swagger UI at /api/docs in development (see app.ts).
 *
 * Kept as a typed object (no YAML parser needed). Summaries + auth + the primary
 * responses are documented per endpoint; request/response bodies are described
 * at a useful level rather than exhaustively typed.
 */

const json = (description: string) => ({
  description,
  content: { 'application/json': { schema: { type: 'object' } } },
});

const ERR = { $ref: '#/components/responses/Error' };

/** Cookie-session security scheme; routes that need it set `security`. */
const SESSION = [{ cookieAuth: [] as string[] }];

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Trivyy API',
    version: '3.0.0',
    description:
      'Turn-based trivia: solo, async duel, group play-together; optional accounts, friends, persistent groups, regional questions, and a single-admin curation/analytics surface. Auth is a signed session cookie (`connect.sid`).',
  },
  servers: [{ url: '/', description: 'Same-origin (SPA + API behind one host)' }],
  tags: [
    { name: 'session' },
    { name: 'accounts' },
    { name: 'friends' },
    { name: 'groups' },
    { name: 'games' },
    { name: 'admin' },
    { name: 'meta' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'connect.sid' },
    },
    responses: {
      Error: {
        description: 'Error — a JSON object with a machine-readable `error` string (API-3).',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { error: { type: 'string' } },
              required: ['error'],
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: { tags: ['meta'], summary: 'Liveness check', responses: { '200': json('ok') } },
    },

    // --- Session + profile ---
    '/api/session': {
      post: {
        tags: ['session'],
        summary: 'Set/update the guest nickname and issue a session',
        responses: { '200': json('Session set'), '400': ERR },
      },
    },
    '/api/me': {
      get: {
        tags: ['session'],
        summary: 'Current player nickname',
        security: SESSION,
        responses: { '200': json('Nickname'), '401': ERR },
      },
    },
    '/api/me/stats': {
      get: {
        tags: ['session'],
        summary: "The current player's own stats (games, points, accuracy, recent)",
        security: SESSION,
        responses: { '200': json('Profile stats'), '401': ERR },
      },
    },

    // --- Accounts ---
    '/api/auth/register': {
      post: {
        tags: ['accounts'],
        summary:
          'Register an account (upgrades the guest in place); returns a one-time recovery code',
        responses: { '201': json('Account + recoveryCode'), '400': ERR, '409': ERR, '429': ERR },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['accounts'],
        summary: 'Log in with username + password',
        responses: { '200': json('Account'), '400': ERR, '401': ERR, '429': ERR },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['accounts'],
        summary: 'Log out (destroys the session)',
        responses: { '200': json('ok') },
      },
    },
    '/api/auth/reset': {
      post: {
        tags: ['accounts'],
        summary: 'Reset the password with the recovery code; returns a rotated code',
        responses: { '200': json('ok + new recoveryCode'), '400': ERR, '401': ERR, '429': ERR },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['accounts'],
        summary: 'The signed-in account (401 for a guest)',
        security: SESSION,
        responses: { '200': json('Account'), '401': ERR },
      },
    },

    // --- Friends (account required) ---
    '/api/friends': {
      get: {
        tags: ['friends'],
        summary: 'My accepted friends',
        security: SESSION,
        responses: { '200': json('Friends'), '401': ERR },
      },
    },
    '/api/friends/requests': {
      get: {
        tags: ['friends'],
        summary: 'My incoming friend requests',
        security: SESSION,
        responses: { '200': json('Requests'), '401': ERR },
      },
      post: {
        tags: ['friends'],
        summary: 'Send a friend request by username (mutual requests auto-accept)',
        security: SESSION,
        responses: { '200': json('status'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/friends/requests/{id}/accept': {
      post: {
        tags: ['friends'],
        summary: 'Accept an incoming request',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('ok'), '401': ERR, '404': ERR },
      },
    },
    '/api/friends/requests/{id}/decline': {
      post: {
        tags: ['friends'],
        summary: 'Decline an incoming request',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('ok'), '401': ERR, '404': ERR },
      },
    },
    '/api/friends/search': {
      get: {
        tags: ['friends'],
        summary: 'Search players by username',
        security: SESSION,
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': json('Players'), '401': ERR },
      },
    },
    '/api/friends/invite/{code}': {
      post: {
        tags: ['friends'],
        summary: 'Accept a friend invite link (instant friendship)',
        security: SESSION,
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': json('ok'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/friends/leaderboard': {
      get: {
        tags: ['friends'],
        summary: 'Cumulative-points leaderboard over me + friends',
        security: SESSION,
        responses: { '200': json('Entries'), '401': ERR },
      },
    },

    // --- Persistent groups (account required) ---
    '/api/groups': {
      get: {
        tags: ['groups'],
        summary: 'My groups',
        security: SESSION,
        responses: { '200': json('Groups'), '401': ERR },
      },
      post: {
        tags: ['groups'],
        summary: 'Create a group (creator becomes owner)',
        security: SESSION,
        responses: { '201': json('Group'), '400': ERR, '401': ERR },
      },
    },
    '/api/groups/join': {
      post: {
        tags: ['groups'],
        summary: 'Join a group by code',
        security: SESSION,
        responses: { '200': json('groupId'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/groups/{id}': {
      get: {
        tags: ['groups'],
        summary: 'Group detail + members (members only)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('GroupDetail'), '401': ERR, '403': ERR, '404': ERR },
      },
    },
    '/api/groups/{id}/standings': {
      get: {
        tags: ['groups'],
        summary: "Cumulative standings across the group's games",
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Entries'), '401': ERR, '403': ERR },
      },
    },

    // --- Games (solo / duel / together) ---
    '/api/games': {
      post: {
        tags: ['games'],
        summary:
          'Create a game (mode solo/duel/together; optional category, difficulty, region, count, maxPlayers, groupId)',
        security: SESSION,
        responses: {
          '201': json('Game (questions for solo/duel; code for duel/together)'),
          '400': ERR,
          '401': ERR,
          '422': ERR,
        },
      },
    },
    '/api/games/join': {
      post: {
        tags: ['games'],
        summary: 'Join a duel or group game by code',
        security: SESSION,
        responses: {
          '200': json('gameId/mode/role (+questions for duel)'),
          '400': ERR,
          '401': ERR,
          '404': ERR,
          '409': ERR,
        },
      },
    },
    '/api/games/{id}/questions': {
      get: {
        tags: ['games'],
        summary: 'The locked question set (no correct-answer leak)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Questions'), '401': ERR, '404': ERR },
      },
    },
    '/api/games/{id}/answers': {
      post: {
        tags: ['games'],
        summary: 'Submit one answer (graded server-side, idempotent per question)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('correct + correctAnswer'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/games/{id}/complete': {
      post: {
        tags: ['games'],
        summary: "Finalize the player's round",
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('score + total'), '401': ERR, '404': ERR },
      },
    },
    '/api/games/{id}/result': {
      get: {
        tags: ['games'],
        summary: 'Solo review or duel head-to-head (polled; gated until both finish)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Result'), '401': ERR, '404': ERR },
      },
    },
    '/api/games/{id}/lobby': {
      get: {
        tags: ['games'],
        summary: 'Group lobby roster + status (polled)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Lobby'), '401': ERR, '403': ERR, '404': ERR },
      },
    },
    '/api/games/{id}/start': {
      post: {
        tags: ['games'],
        summary: 'Host starts the group round',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('status'), '401': ERR, '403': ERR, '404': ERR, '409': ERR },
      },
    },
    '/api/games/{id}/leaderboard': {
      get: {
        tags: ['games'],
        summary: 'Group game leaderboard (derived)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Leaderboard'), '401': ERR, '403': ERR },
      },
    },

    // --- Admin (single admin) ---
    '/api/admin/login': {
      post: {
        tags: ['admin'],
        summary: 'Admin login (username + password, rate-limited)',
        responses: { '200': json('ok'), '400': ERR, '401': ERR, '429': ERR },
      },
    },
    '/api/admin/logout': {
      post: { tags: ['admin'], summary: 'Admin logout', responses: { '200': json('ok') } },
    },
    '/api/admin/whoami': {
      get: {
        tags: ['admin'],
        summary: 'Admin session probe',
        security: SESSION,
        responses: { '200': json('role'), '401': ERR },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['admin'],
        summary: 'Analytics dashboard data (games, players, accuracy, locations, …)',
        security: SESSION,
        responses: { '200': json('AdminStats'), '401': ERR },
      },
    },
    '/api/admin/questions': {
      get: {
        tags: ['admin'],
        summary: 'List/filter questions (search, category, difficulty, status, page)',
        security: SESSION,
        responses: { '200': json('QuestionsPage'), '400': ERR, '401': ERR },
      },
      post: {
        tags: ['admin'],
        summary: 'Add a question',
        security: SESSION,
        responses: { '201': json('Question'), '400': ERR, '401': ERR },
      },
    },
    '/api/admin/questions/{id}': {
      put: {
        tags: ['admin'],
        summary: 'Edit a question',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('Question'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/admin/questions/{id}/status': {
      patch: {
        tags: ['admin'],
        summary: 'Hide/unhide a question (soft delete)',
        security: SESSION,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': json('ok'), '400': ERR, '401': ERR, '404': ERR },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['admin'],
        summary: 'List categories with counts',
        security: SESSION,
        responses: { '200': json('Categories'), '401': ERR },
      },
      post: {
        tags: ['admin'],
        summary: 'Add a category',
        security: SESSION,
        responses: { '201': json('Category'), '400': ERR, '401': ERR, '409': ERR },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openapiDocument;
