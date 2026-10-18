import type { DiscoveryState, NotificationPreferences, UserPreferences } from '@/types';

export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isQuietHours(
  prefs: Pick<UserPreferences, 'quietHoursStart' | 'quietHoursEnd'>,
  date = new Date()
): boolean {
  const hour = date.getHours();
  const { quietHoursStart: start, quietHoursEnd: end } = prefs;
  if (start === end) return false;
  if (start > end) {
    // e.g. 22 → 8
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}

export function isCooldownActive(
  lastNotificationAt: string | undefined,
  cooldownMinutes: number,
  date = new Date()
): boolean {
  if (!lastNotificationAt) return false;
  const elapsed = date.getTime() - new Date(lastNotificationAt).getTime();
  return elapsed < cooldownMinutes * 60 * 1000;
}

export function canSendUnsolicitedNotification(
  discovery: DiscoveryState,
  prefs: UserPreferences,
  date = new Date()
): { ok: boolean; reason?: string } {
  if (!prefs.explorationEnabled) {
    return { ok: false, reason: 'Exploration is paused' };
  }
  if (discovery.status !== 'exploring') {
    return { ok: false, reason: 'Discovery status is paused' };
  }
  if (isQuietHours(prefs, date)) {
    return { ok: false, reason: 'Quiet hours' };
  }

  const key = dayKey(date);
  const sentToday =
    discovery.notificationsDayKey === key ? discovery.notificationsSentToday : 0;

  const maxPerDay = resolveMaxPerDay(prefs);
  if (sentToday >= maxPerDay) {
    return { ok: false, reason: 'Daily notification limit reached' };
  }

  const cooldown = resolveCooldownMinutes(prefs);
  if (isCooldownActive(discovery.lastNotificationAt, cooldown, date)) {
    return { ok: false, reason: 'Cooldown active' };
  }

  if (discovery.travelMode === 'driving' && prefs.preferWalkingOnly) {
    return { ok: false, reason: 'User appears to be driving' };
  }

  // Highway-ish speed (~15 m/s ≈ 33 mph)
  if ((discovery.estimatedSpeedMps ?? 0) > 15) {
    return { ok: false, reason: 'Travel speed too high for walking detours' };
  }

  return { ok: true };
}

export function resolveMaxPerDay(prefs: UserPreferences): number {
  if (prefs.notificationFrequency === 'low') return Math.min(1, prefs.maxNotificationsPerDay);
  if (prefs.notificationFrequency === 'high') return Math.max(prefs.maxNotificationsPerDay, 4);
  return prefs.maxNotificationsPerDay;
}

export function resolveCooldownMinutes(prefs: UserPreferences): number {
  if (prefs.notificationFrequency === 'low') return Math.max(prefs.cooldownMinutes, 240);
  if (prefs.notificationFrequency === 'high') return Math.min(prefs.cooldownMinutes, 90);
  return prefs.cooldownMinutes;
}

export function wasRecentlySuggested(
  placeId: string,
  history: Array<{ placeId: string; at: string }>,
  suppressionDays: number,
  date = new Date()
): boolean {
  const cutoff = date.getTime() - suppressionDays * 24 * 60 * 60 * 1000;
  return history.some(
    (h) => h.placeId === placeId && new Date(h.at).getTime() >= cutoff
  );
}

export function toNotificationPreferences(
  prefs: UserPreferences
): NotificationPreferences {
  return {
    enabled: prefs.explorationEnabled,
    frequency: prefs.notificationFrequency,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
    maxPerDay: resolveMaxPerDay(prefs),
    cooldownMinutes: resolveCooldownMinutes(prefs),
  };
}
