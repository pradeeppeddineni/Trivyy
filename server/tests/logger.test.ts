import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../src/lib/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  it('writes a single structured JSON line with the message and level', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    logger.info('game_started', { gameId: 'abc-123' });

    expect(spy).toHaveBeenCalledTimes(1);
    const written = spy.mock.calls[0][0] as string;
    expect(written.endsWith('\n')).toBe(true);

    const parsed = JSON.parse(written);
    expect(parsed).toMatchObject({ level: 'info', message: 'game_started', gameId: 'abc-123' });
    expect(typeof parsed.time).toBe('string');
  });

  it('supports warn and error levels', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    logger.warn('slow_query');
    logger.error('boom');

    const levels = spy.mock.calls.map((call) => JSON.parse(call[0] as string).level);
    expect(levels).toEqual(['warn', 'error']);
  });
});
