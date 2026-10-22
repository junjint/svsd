import { quests as previousPlaces } from "@/features/prototype/app/data";
import type { DrawnSidequest, QuestFolder } from "@/types";

/** Data-only bridge. The former app UI and its store are not mounted. */
export function importPreview(raw: string | null): {
  quests: DrawnSidequest[];
  folders: QuestFolder[];
} {
  const quests: DrawnSidequest[] = [],
    folders: QuestFolder[] = [];
  try {
    const data = raw ? JSON.parse(raw) : null;
    if (data?.version !== 3) return { quests, folders };
    const make = (
      placeId: string,
      id: string,
      at: string,
      completed: boolean,
    ): DrawnSidequest | null => {
      const place = previousPlaces.find((p) => p.id === placeId);
      if (!place) return null;
      return {
        id,
        placeId: `preview:${place.id}`,
        placeName: place.name,
        category: place.categories.includes("nature")
          ? "nature"
          : place.categories.includes("art")
            ? "art"
            : place.categories.includes("coffee")
              ? "coffee"
              : "unexpected",
        description: place.descriptor,
        coordinates: {
          latitude: place.position[0],
          longitude: place.position[1],
        },
        address: "Ann Arbor · imagined demo place",
        distanceMeters: 0,
        estimatedWalkingMinutes: place.detourMinutes,
        personalizationScore: 0,
        storyHook: place.story,
        suggestedActivity: place.challenge,
        activityId: `preview:${place.id}`,
        activityText: place.challenge,
        status: completed ? "completed" : "saved",
        isSimulated: true,
        whyRecommended: "Imported from your earlier local prototype",
        createdAt: at,
        updatedAt: at,
        completedAt: completed ? at : undefined,
        partySize: 1,
        questType: "random",
        rarity: "common",
        rerollsUsed: { place: 0, activity: 0 },
        revealStyle: { place: "scratch", activity: "scratch" },
        cityLabel: "Ann Arbor",
      };
    };
    for (const m of Array.isArray(data.memories) ? data.memories : []) {
      if (
        !m ||
        typeof m.id !== "string" ||
        typeof m.completedAt !== "string" ||
        !Number.isFinite(Date.parse(m.completedAt))
      )
        continue;
      const quest = make(
        m.questId,
        `preview-memory:${m.id}`,
        m.completedAt,
        true,
      );
      if (!quest || quests.some((q) => q.id === quest.id)) continue;
      quests.push(quest);
      const photo =
        typeof m.photo === "string" &&
        /^data:image\/(jpeg|png|webp);base64,/.test(m.photo)
          ? m.photo
          : null;
      folders.push({
        id: `preview-folder:${m.id}`,
        kind: "quest",
        sidequestId: quest.id,
        title: quest.activityText,
        subtitle: quest.placeName,
        note: typeof m.note === "string" ? m.note.slice(0, 180) : undefined,
        photos: photo
          ? [
              {
                id: `preview-photo:${m.id}`,
                uri: photo,
                addedAt: m.completedAt,
              },
            ]
          : [],
        savedToGallery: false,
        postedToWall: false,
        createdBy: "completion",
        createdAt: m.completedAt,
        updatedAt: m.completedAt,
      });
    }
    for (const id of Array.isArray(data.saved) ? data.saved : []) {
      const quest = make(
        id,
        `preview-saved:${id}`,
        new Date().toISOString(),
        false,
      );
      if (quest && !quests.some((q) => q.id === quest.id)) quests.push(quest);
    }
  } catch {
    /* Malformed old storage must not block Rebecca's app. */
  }
  return { quests, folders };
}
