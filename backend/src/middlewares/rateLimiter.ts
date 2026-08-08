import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { env } from "../config/env";

/**
 * Usa o ID do usuário autenticado (extraído do JWT, sem precisar validar
 * assinatura/consultar o banco) como chave de limite quando disponível.
 * Isso evita que múltiplos usuários atrás do mesmo IP (ex.: rede da empresa,
 * ou todos passando pelo proxy Nginx) compartilhem uma única cota de
 * requisições — cada usuário passa a ter seu próprio limite.
 * Requisições sem token válido caem de volta para o limite por IP.
 */
function resolveRateLimitKey(req: Request): string {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.decode(header.substring("Bearer ".length)) as { sub?: string } | null;
      if (decoded?.sub) return `user:${decoded.sub}`;
    } catch {
      // token malformado — ignora e usa o IP como chave
    }
  }
  return req.ip ?? "unknown";
}

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveRateLimitKey,
  message: { success: false, message: "Muitas requisições. Tente novamente em instantes." },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Login ainda não tem token — sempre por IP, para conter tentativas de força bruta.
  message: { success: false, message: "Muitas tentativas de login. Tente novamente em instantes." },
});

/**
 * Limita tentativas de login por conta (login/e-mail digitado), além do
 * limite por IP acima. Sem isso, um ataque de força bruta distribuído por
 * vários IPs contra uma única conta não seria contido.
 */
export const authAccountRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const login = req.body?.login;
    return typeof login === "string" && login.trim() ? login.trim().toLowerCase() : (req.ip ?? "unknown");
  },
  message: { success: false, message: "Muitas tentativas de login para este usuário. Tente novamente em instantes." },
});
