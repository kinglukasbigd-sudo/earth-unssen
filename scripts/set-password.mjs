/**
 * Set (or reset) the studio password for the local backend from the
 * terminal — useful when the password has been forgotten.
 *
 * Usage:
 *   npm run admin:password -- "a new long password"
 *   npm run admin:password -- --reset   # forget it; use ADMIN_PASSWORD again
 *
 * The password is stored as an scrypt hash in data/auth.json (the same
 * format the studio's Account window writes) and takes precedence over
 * ADMIN_PASSWORD. Every signed-in session is signed out.
 *
 * Supabase mode doesn't use this: reset the password in the Supabase
 * dashboard under Authentication → Users.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt } from "node:crypto";

const AUTH_FILE = path.join(process.cwd(), "data", "auth.json");
const MIN_LENGTH = 10;

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

async function readAuth() {
  try {
    return JSON.parse(await fs.readFile(AUTH_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeAuth(next) {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  const tmp = `${AUTH_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), { mode: 0o600 });
  await fs.rename(tmp, AUTH_FILE);
}

async function main() {
  const arg = process.argv[2];
  const auth = await readAuth();

  if (arg === "--reset") {
    delete auth.passwordHash;
    await writeAuth(auth);
    console.log("Studio password cleared — ADMIN_PASSWORD from your environment applies again.");
    return;
  }

  if (!arg || arg.length < MIN_LENGTH) {
    console.error(
      `Usage: npm run admin:password -- "new password"  (at least ${MIN_LENGTH} characters)\n` +
        "       npm run admin:password -- --reset",
    );
    process.exit(1);
  }

  const salt = randomBytes(16);
  const key = await scryptAsync(arg, salt);
  auth.passwordHash = `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
  await writeAuth(auth);
  console.log("Studio password updated. Sign in at /admin/login with the new password.");
}

main().catch((error) => {
  console.error("Could not set the password:", error.message);
  process.exit(1);
});
