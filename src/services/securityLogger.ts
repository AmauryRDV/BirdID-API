export type SecurityEventType = 'auth.login_failed' | 'auth.rate_limited';

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length <= 2 ? '*'.repeat(local.length) : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

export function logSecurityEvent(type: SecurityEventType, details: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({
    tag: 'SECURITY',
    type,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}
