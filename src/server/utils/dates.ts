export function diffHours(a: string | Date, b: string | Date = new Date()) {
  const left = a instanceof Date ? a.getTime() : new Date(a).getTime();
  const right = b instanceof Date ? b.getTime() : new Date(b).getTime();
  return Math.abs(right - left) / (1000 * 60 * 60);
}

export function isWithinDays(a: string | Date, b: string | Date, maxDays: number) {
  return diffHours(a, b) <= maxDays * 24;
}
