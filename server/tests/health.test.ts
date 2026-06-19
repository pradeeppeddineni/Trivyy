import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
