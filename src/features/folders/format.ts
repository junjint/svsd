import type { QuestFolder } from '@/types';

const DAY = 24 * 3600 * 1000;

/** Pool's tile count: "12", or "+3 New" for photos added in the last day */
export function folderCount(f: QuestFolder, now = Date.now()): { text: string; isNew: boolean } {
  const fresh = f.photos.filter((p) => now - new Date(p.addedAt).getTime() < DAY).length;
  if (fresh > 0) return { text: `+${fresh} New`, isNew: true };
  return { text: String(f.photos.length), isNew: false };
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function partyLabel(n: number): string {
  return n <= 1 ? 'Solo' : `Party of ${n}`;
}
