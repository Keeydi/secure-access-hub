/**
 * Normalize Philippine mobile numbers to E.164 (+639XXXXXXXXX).
 */
export function normalizePhilippinePhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return null;

  if (s.startsWith('+63')) {
    const rest = s.slice(3);
    return rest.length === 10 && /^9\d{9}$/.test(rest) ? s : null;
  }
  if (s.startsWith('63') && /^63\d{10}$/.test(s)) {
    return `+${s}`;
  }
  if (s.startsWith('09') && s.length === 11) {
    return `+63${s.slice(1)}`;
  }
  if (s.startsWith('9') && s.length === 10) {
    return `+63${s}`;
  }
  return null;
}
