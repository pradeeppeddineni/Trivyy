import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';
import { openapiDocument } from '../src/openapi';

describe('OpenAPI document (API-1)', () => {
  it('serves the spec at GET /api/openapi.json', async () => {
    const res = await request(makeApp()).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('Trivyy API');
  });

  it('documents a representative endpoint from every router', () => {
    const paths = Object.keys(openapiDocument.paths);
    for (const p of [
      '/api/health',
      '/api/session',
      '/api/me/stats',
      '/api/auth/login',
      '/api/friends/leaderboard',
      '/api/groups/{id}/standings',
      '/api/games',
      '/api/admin/questions',
    ]) {
      expect(paths).toContain(p);
    }
  });

  it('every documented path has at least one HTTP method', () => {
    const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
    for (const [path, item] of Object.entries(openapiDocument.paths)) {
      const ops = Object.keys(item).filter((k) => methods.has(k));
      expect(ops.length, `${path} has no method`).toBeGreaterThan(0);
    }
  });
});
