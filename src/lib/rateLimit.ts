// Sistema Anti-Fuerza Bruta & Rate Limiting en Memoria y Neon
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos de bloqueo

/**
 * Verifica si un identificador o IP está bloqueado por demasiados intentos fallidos
 */
export function checkRateLimit(key: string): { isBlocked: boolean; remainingMinutes?: number } {
  const record = loginAttempts.get(key);
  if (!record) return { isBlocked: false };

  const now = Date.now();

  // Si está bloqueado actualmente
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / (60 * 1000));
    return { isBlocked: true, remainingMinutes };
  }

  // Si expiró la ventana de tiempo, resetear
  if (now - record.firstAttempt > WINDOW_MS && !record.lockedUntil) {
    loginAttempts.delete(key);
    return { isBlocked: false };
  }

  return { isBlocked: false };
}

/**
 * Registra un intento fallido y bloquea si excede el límite
 */
export function recordFailedAttempt(key: string): { locked: boolean; remainingAttempts: number } {
  const now = Date.now();
  let record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    loginAttempts.set(key, record);
    return { locked: true, remainingAttempts: 0 };
  }

  loginAttempts.set(key, record);
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - record.count };
}

/**
 * Limpia los intentos tras un login exitoso
 */
export function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}
