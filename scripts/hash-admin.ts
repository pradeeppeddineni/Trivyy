import argon2 from 'argon2';

/**
 * Generate an argon2 hash for the admin password. The plaintext is never stored
 * (SEC-1); put the printed hash in ADMIN_PASSWORD_HASH.
 *
 * Usage: npm run hash-admin -- 'your-admin-password'
 */
const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-admin -- 'your-admin-password'");
  process.exit(1);
}

const hash = await argon2.hash(password);
console.log(hash);
