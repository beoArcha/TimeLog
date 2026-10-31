export function parseRateToCents(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length > 2) return null;
  const whole = Number(parts[0]);
  if (isNaN(whole) || whole < 0 || !Number.isInteger(whole)) return null;
  if (parts.length === 2) {
    const fracStr = parts[1];
    if (!/^\d*$/.test(fracStr)) return null;
    let frac = 0;
    if (fracStr.length === 1) {
      frac = Number(fracStr) * 10;
    } else if (fracStr.length >= 2) {
      frac = Number(fracStr.slice(0, 2));
    }
    return whole * 100 + frac;
  }
  return whole * 100;
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
