import type { Sidequest, SidequestStatus } from '@/types';

const TRANSITIONS: Record<SidequestStatus, SidequestStatus[]> = {
  discovered: ['suggested', 'dismissed', 'saved', 'expired'],
  suggested: ['accepted', 'dismissed', 'saved', 'expired'],
  accepted: ['en_route', 'abandoned', 'dismissed'],
  en_route: ['arrived', 'abandoned', 'completed'],
  arrived: ['completed', 'abandoned'],
  completed: [],
  dismissed: [],
  saved: ['suggested', 'accepted', 'dismissed', 'expired'],
  expired: [],
  abandoned: [],
};

export function canTransition(
  from: SidequestStatus,
  to: SidequestStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionSidequest(
  quest: Sidequest,
  to: SidequestStatus,
  extras: Partial<Sidequest> = {}
): Sidequest {
  if (!canTransition(quest.status, to)) {
    throw new Error(`Invalid sidequest transition: ${quest.status} → ${to}`);
  }

  const now = new Date().toISOString();
  const next: Sidequest = {
    ...quest,
    ...extras,
    status: to,
    updatedAt: now,
  };

  switch (to) {
    case 'suggested':
      next.suggestedAt = now;
      break;
    case 'accepted':
      next.acceptedAt = now;
      break;
    case 'arrived':
      next.arrivedAt = now;
      break;
    case 'completed':
      next.completedAt = now;
      break;
    case 'dismissed':
      next.dismissedAt = now;
      break;
    default:
      break;
  }

  return next;
}

/** Force a status for demo/manual completion without throwing */
export function forceStatus(
  quest: Sidequest,
  to: SidequestStatus,
  extras: Partial<Sidequest> = {}
): Sidequest {
  try {
    return transitionSidequest(quest, to, extras);
  } catch {
    const now = new Date().toISOString();
    return {
      ...quest,
      ...extras,
      status: to,
      updatedAt: now,
      ...(to === 'completed' ? { completedAt: now } : {}),
      ...(to === 'arrived' ? { arrivedAt: now } : {}),
      ...(to === 'accepted' ? { acceptedAt: now } : {}),
    };
  }
}

export function isActiveStatus(status: SidequestStatus): boolean {
  return status === 'accepted' || status === 'en_route' || status === 'arrived';
}

export const ARRIVAL_THRESHOLD_METERS = 60;
