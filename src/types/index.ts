/** Core domain types for Sidequest */

export type InterestCategory =
  | 'coffee'
  | 'nature'
  | 'bookstores'
  | 'live_music'
  | 'art'
  | 'thrifting'
  | 'local_food'
  | 'architecture'
  | 'community_events'
  | 'study_spots'
  | 'cultural'
  | 'unexpected';

export type BudgetPreference = 'free' | 'under_10' | 'under_25' | 'any';
export type SpontaneityLevel = 'comfortable' | 'adventurous' | 'surprise_me';
export type NotificationFrequency = 'low' | 'medium' | 'high';
export type DetourMinutes = 5 | 10 | 15 | 20;
export type TravelMode = 'walking' | 'unknown' | 'driving';

export type SidequestStatus =
  | 'discovered'
  | 'suggested'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'dismissed'
  | 'saved'
  | 'expired'
  | 'abandoned';

export type PlaceSource = 'mock' | 'google' | 'curated' | 'user';

export type Mood =
  | 'curious'
  | 'calm'
  | 'energized'
  | 'inspired'
  | 'surprised'
  | 'reflective';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  /** Day-indexed strings, e.g. "Monday: 9:00 AM – 5:00 PM" */
  weekdayText?: string[];
  /** Simplified open-now when available */
  openNow?: boolean;
  /** ISO periods when available from providers */
  periods?: Array<{
    openDay: number;
    openTime: string;
    closeDay?: number;
    closeTime?: string;
  }>;
}

export interface Place {
  id: string;
  providerPlaceId?: string;
  name: string;
  category: InterestCategory;
  description: string;
  coordinates: Coordinates;
  address: string;
  openingHours?: OpeningHours;
  /** Approximate cost tier: 0 free, 1 cheap, 2 moderate, 3 any */
  priceLevel?: 0 | 1 | 2 | 3;
  source: PlaceSource;
  /** Distinctive traits used for story hooks — must be verified or clearly editorial */
  storyHooks?: string[];
  suggestedActivity?: string;
  tags?: string[];
  /** Curated / event fields */
  eventStart?: string;
  eventEnd?: string;
  verificationStatus?: 'verified' | 'unverified' | 'editorial';
  attribution?: string;
  accessibilityNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  interests: InterestCategory[];
  avoidedCategories: InterestCategory[];
  detourMinutes: DetourMinutes;
  budget: BudgetPreference;
  spontaneity: SpontaneityLevel;
  notificationFrequency: NotificationFrequency;
  accessibilityNotes?: string;
  explorationEnabled: boolean;
  backgroundLocationEnabled: boolean;
  quietHoursStart: number; // hour 0-23
  quietHoursEnd: number;
  maxNotificationsPerDay: number;
  cooldownMinutes: number;
  duplicateSuppressionDays: number;
  walkingRadiusMinMeters: number;
  walkingRadiusMaxMeters: number;
  preferWalkingOnly: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  frequency: NotificationFrequency;
  quietHoursStart: number;
  quietHoursEnd: number;
  maxPerDay: number;
  cooldownMinutes: number;
}

export interface Sidequest {
  id: string;
  placeId: string;
  placeName: string;
  category: InterestCategory;
  description: string;
  coordinates: Coordinates;
  address: string;
  distanceMeters: number;
  estimatedWalkingMinutes?: number;
  openingHours?: OpeningHours;
  costInfo?: string;
  personalizationScore: number;
  scoreBreakdown?: RecommendationScoreBreakdown;
  storyHook: string;
  suggestedActivity: string;
  status: SidequestStatus;
  whyRecommended: string;
  isSimulated?: boolean;
  createdAt: string;
  suggestedAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
  updatedAt: string;
}

export interface RecommendationScoreBreakdown {
  interest: number;
  proximity: number;
  novelty: number;
  context: number;
  surprise: number;
  story: number;
  total: number;
}

export interface StoryChapter {
  id: string;
  sidequestId: string;
  placeId: string;
  placeName: string;
  category: InterestCategory;
  reflection: string;
  photoUri?: string;
  rating?: number;
  mood?: Mood;
  originalPrompt: string;
  chapterNumber: number;
  visitedAt: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
}

export interface RecommendationFeedback {
  id: string;
  sidequestId: string;
  placeId: string;
  category: InterestCategory;
  action: 'accept' | 'dismiss' | 'save' | 'complete' | 'abandon' | 'rate';
  rating?: number;
  createdAt: string;
}

export interface NotificationLogEntry {
  id: string;
  sidequestId: string;
  sentAt: string;
  title: string;
  body: string;
  wasSimulated?: boolean;
}

export interface JournalStats {
  sidequestsCompleted: number;
  placesDiscovered: number;
  chaptersCollected: number;
  categoriesExplored: InterestCategory[];
}

export interface AppUser {
  id: string;
  displayName?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface DiscoveryState {
  status: 'exploring' | 'paused';
  lastDiscoveryAt?: string;
  lastNotificationAt?: string;
  notificationsSentToday: number;
  notificationsDayKey: string;
  currentAreaLabel?: string;
  travelMode: TravelMode;
  estimatedSpeedMps?: number;
}

export interface DemoState {
  enabled: boolean;
  simulatedLocation: Coordinates;
  locationLabel: string;
  lastSimulationNote?: string;
}

export interface CachedPlaces {
  places: Place[];
  fetchedAt: string;
  center: Coordinates;
  radiusMeters: number;
}

export const INTEREST_LABELS: Record<InterestCategory, string> = {
  coffee: 'Coffee and cafés',
  nature: 'Nature and hiking',
  bookstores: 'Independent bookstores',
  live_music: 'Live music and concerts',
  art: 'Art and galleries',
  thrifting: 'Thrifting and vintage stores',
  local_food: 'Local food',
  architecture: 'Architecture and hidden landmarks',
  community_events: 'Community events and pop-ups',
  study_spots: 'Quiet study spots',
  cultural: 'Cultural experiences',
  unexpected: 'Unexpected or miscellaneous discoveries',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  interests: [],
  avoidedCategories: [],
  detourMinutes: 10,
  budget: 'any',
  spontaneity: 'adventurous',
  notificationFrequency: 'medium',
  explorationEnabled: false,
  backgroundLocationEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  maxNotificationsPerDay: 2,
  cooldownMinutes: 180,
  duplicateSuppressionDays: 7,
  walkingRadiusMinMeters: 200,
  walkingRadiusMaxMeters: 1200,
  preferWalkingOnly: true,
};

/** Downtown Ann Arbor — hackathon demo center */
export const ANN_ARBOR_CENTER: Coordinates = {
  latitude: 42.2808,
  longitude: -83.743,
};
