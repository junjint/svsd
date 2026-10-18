import { createId } from '@/utils/id';
import type {
  InterestCategory,
  JournalStats,
  Mood,
  Sidequest,
  StoryChapter,
} from '@/types';

export interface CreateChapterInput {
  sidequest: Sidequest;
  reflection: string;
  photoUri?: string;
  rating?: number;
  mood?: Mood;
  existingChapters: StoryChapter[];
}

export function createChapter(input: CreateChapterInput): StoryChapter {
  const now = new Date().toISOString();
  const chapterNumber = input.existingChapters.length + 1;
  return {
    id: createId('chapter'),
    sidequestId: input.sidequest.id,
    placeId: input.sidequest.placeId,
    placeName: input.sidequest.placeName,
    category: input.sidequest.category,
    reflection: input.reflection.trim(),
    photoUri: input.photoUri,
    rating: input.rating,
    mood: input.mood,
    originalPrompt: input.sidequest.storyHook,
    chapterNumber,
    visitedAt: input.sidequest.arrivedAt ?? input.sidequest.completedAt ?? now,
    createdAt: now,
    updatedAt: now,
    isPrivate: true,
  };
}

export function computeJournalStats(
  chapters: StoryChapter[],
  completedSidequests: Sidequest[]
): JournalStats {
  const categories = new Set<InterestCategory>();
  chapters.forEach((c) => categories.add(c.category));
  completedSidequests.forEach((q) => categories.add(q.category));

  const placeIds = new Set([
    ...chapters.map((c) => c.placeId),
    ...completedSidequests.map((q) => q.placeId),
  ]);

  return {
    sidequestsCompleted: completedSidequests.length,
    placesDiscovered: placeIds.size,
    chaptersCollected: chapters.length,
    categoriesExplored: [...categories],
  };
}

export function chapterTitle(chapter: StoryChapter): string {
  const num = String(chapter.chapterNumber).padStart(3, '0');
  const shortName = chapter.placeName.replace(/^\[(DEMO|CURATED DEMO)\]\s*/i, '');
  return `Chapter ${num} — ${shortName}`;
}
