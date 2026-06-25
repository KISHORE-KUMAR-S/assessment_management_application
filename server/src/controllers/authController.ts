import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";

// Credential bounds. bcrypt only hashes the first 72 bytes, so cap the password
// there to avoid silent truncation surprises. Username charset is constrained to
// reduce abuse and homograph/whitespace tricks.
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
// Dummy hash of a random value; compared against when a user is not found so login
// runs bcrypt either way (mitigates timing-based username enumeration).
const DUMMY_HASH = bcrypt.hashSync("uX$timing-equalizer-7f3a9c2e", 10);

function validateCredentials(username: unknown, password: unknown): string | null {
  // Require strings: object values like {$gt:""} would inject Mongo operators (NoSQL injection).
  if (typeof username !== "string" || typeof password !== "string") {
    return "username and password required";
  }
  if (!USERNAME_RE.test(username)) {
    return "username must be 3-32 chars: letters, numbers, dot, underscore, hyphen";
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`;
  }
  return null;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};
  const error = validateCredentials(username, password);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const exists = await User.findOne({ username });
  if (exists) {
    res.status(409).json({ error: "username taken" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  const token = signToken({ id: user.id, username: user.username });
  res.status(201).json({ token, user: { id: user.id, username: user.username } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};
  // Reject non-strings (NoSQL injection), but don't leak format rules on the login
  // path — any malformed credential just fails as "invalid credentials".
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const user = await User.findOne({ username });
  // Always run a bcrypt compare (real hash, or a dummy when the user is absent) so
  // response time doesn't reveal whether the username exists.
  const ok = user
    ? await user.comparePassword(password)
    : (await bcrypt.compare(password, DUMMY_HASH), false);
  if (!user || !ok) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const token = signToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
