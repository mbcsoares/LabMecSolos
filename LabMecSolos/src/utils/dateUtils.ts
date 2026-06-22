export function nowISO(): string {
  return new Date().toISOString();
}

export function expiresInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function expiresInMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function isExpired(isoDate: string): boolean {
  return new Date(isoDate).getTime() < Date.now();
}
