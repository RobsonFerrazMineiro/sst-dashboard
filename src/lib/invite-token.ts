/**
 * Helper de tokens de convite.
 *
 * Segurança:
 * - Token gerado com crypto.randomBytes(32) → 64 chars hex → 256 bits de entropia
 * - Apenas o SHA-256 do token é salvo no banco (hash unidirecional)
 * - O token puro trafega apenas na URL do convite e nunca é persistido
 */

import crypto from "crypto";

/** TTL do convite: 48 horas */
const INVITE_TTL_HOURS = 48;

export interface GeneratedToken {
  /** Token puro — vai na URL do convite. NUNCA salvar no banco. */
  token: string;
  /** SHA-256 do token — salvo no banco. */
  hash: string;
  /** Data de expiração. */
  expiresAt: Date;
}

/** Gera um novo token seguro e seu hash SHA-256. */
export function generateInviteToken(): GeneratedToken {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

/** Converte um token recebido na URL para seu hash SHA-256. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Retorna true se o convite está expirado. */
export function isInviteExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
