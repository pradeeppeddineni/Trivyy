/**
 * Structured JSON logging (OBS-1). `console.log` is banned in committed backend
 * code; everything goes through this logger so log lines are machine-parseable.
 * Pass `gameId` in fields so a single game can be traced end to end (OBS-2).
 */
type Level = 'info' | 'warn' | 'error';

export interface LogFields {
  gameId?: string;
  [key: string]: unknown;
}

export function log(level: Level, message: string, fields: LogFields = {}): void {
  const entry = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  });
  process.stdout.write(`${entry}\n`);
}

export const logger = {
  info: (message: string, fields?: LogFields) => log('info', message, fields),
  warn: (message: string, fields?: LogFields) => log('warn', message, fields),
  error: (message: string, fields?: LogFields) => log('error', message, fields),
};
