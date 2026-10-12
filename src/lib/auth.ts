import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "teleblast_super_secret_jwt_key_2026";
export const TOKEN_COOKIE_NAME = "teleblast_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Genera un token JWT para la sesión
 */
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Valida un token JWT
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Obtiene y valida la sesión actual desde las cookies HttpOnly (Server-side)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Validación estricta Zero Trust: Requiere sesión activa
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Validación estricta Zero Trust: Requiere rol SUPERADMIN
 */
export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "SUPERADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
