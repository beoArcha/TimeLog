export function parseRateToCents(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length > 2) return null;

  const wholeStr = parts[0];
  if (!/^\d+$/.test(wholeStr)) return null;
  const whole = Number(wholeStr);
  if (!Number.isSafeInteger(whole)) return null;

  if (parts.length === 2) {
    const fracStr = parts[1];
    if (!/^\d*$/.test(fracStr) || fracStr.length > 2) return null;
    let frac = 0;
    if (fracStr.length === 1) {
      frac = Number(fracStr) * 10;
    } else if (fracStr.length === 2) {
      frac = Number(fracStr);
    }
    const total = whole * 100 + frac;
    return Number.isSafeInteger(total) ? total : null;
  }

  const total = whole * 100;
  return Number.isSafeInteger(total) ? total : null;
}

export function parseRateOrCents(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('c') || trimmed.endsWith('¢')) {
    const centsStr = trimmed.slice(0, -1).trim();
    if (!/^\d+$/.test(centsStr)) return null;
    const cents = Number(centsStr);
    return Number.isSafeInteger(cents) ? cents : null;
  }
  if (trimmed.includes('.')) {
    return parseRateToCents(trimmed);
  }
  if (!/^\d+$/.test(trimmed)) return null;
  const whole = Number(trimmed);
  const total = whole * 100;
  return Number.isSafeInteger(total) ? total : null;
}

export function formatCents(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}

export function calculateBankersAmount(durationSeconds: number, rateCents: number): number {
  const product = BigInt(durationSeconds) * BigInt(rateCents);
  const divisor = 3600n;
  const q = product / divisor;
  const r = product % divisor;
  const doubleR = r * 2n;
  if (doubleR > divisor) {
    return Number(q + 1n);
  }
  if (doubleR < divisor) {
    return Number(q);
  }
  if (q % 2n !== 0n) {
    return Number(q + 1n);
  }
  return Number(q);
}
