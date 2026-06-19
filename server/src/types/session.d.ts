import 'express-session';

declare module 'express-session' {
  interface SessionData {
    /** Player nickname for the current browser session (SEC-3). */
    nickname?: string;
    /** True once the single admin has authenticated (SEC-2). */
    isAdmin?: boolean;
  }
}
