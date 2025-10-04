export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0:日,1:月,...
  const diff = (day + 6) % 7; // 月曜=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export function weekIndexFrom(startedAtISO: string, today = new Date()): number {
  const start = startOfWeek(new Date(startedAtISO));
  const now = startOfWeek(today);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(diffDays / 7));
}
