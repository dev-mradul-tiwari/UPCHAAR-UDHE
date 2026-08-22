import { randomInt } from "node:crypto";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Temporary password handed to a hospital when it provisions a doctor.
 * Shown once; the doctor must change it on first login.
 */
export function generateTempPassword(length = 12): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET.charAt(randomInt(0, ALPHABET.length));
  }
  return out;
}
