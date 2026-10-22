/** Mood imagery for a sidequest before it has photos of its own. */
export type ConceptPhotoKey = "fountain" | "passage" | "garden" | "coffee";
export function conceptPhotoKey(quest: {
  placeId?: string;
  placeName?: string;
  category?: string;
}): ConceptPhotoKey {
  const name = `${quest.placeId ?? ""} ${quest.placeName ?? ""}`.toLowerCase();
  if (/fountain|courtyard/.test(name)) return "fountain";
  if (/graffiti|mural|passage|alley/.test(name) || quest.category === "art")
    return "passage";
  if (
    /coffee|cafe|café|bakery|window.seat/.test(name) ||
    ["coffee", "food"].includes(quest.category ?? "")
  )
    return "coffee";
  if (/park|garden|bench|arboretum/.test(name) || quest.category === "nature")
    return "garden";
  return "fountain";
}

/** A cover for a sidequest: one of the bundled images, or a photo from Unsplash's CDN */
export type PhotoRef = { local: ConceptPhotoKey } | { remote: string };

const U = (id: string): PhotoRef => ({
  remote: `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`,
});
const L = (key: ConceptPhotoKey): PhotoRef => ({ local: key });

/* A handful of pictures per kind of place, so two sidequests rarely share a cover.
   Unsplash photos (free licence), chosen by eye for small-city, everyday scenes. */
const POOLS: Record<string, PhotoRef[]> = {
  coffee: [L("coffee"), U("1495474472287-4d71bcdd2085"), U("1509042239860-f550ce710b93"), U("1497935586351-b67a49e012bf"), U("1544787219-7f47ccb76574")],
  bakery: [U("1509440159596-0249088772ff"), U("1544787219-7f47ccb76574"), L("coffee")],
  sweets: [U("1563805042-7684c019e1cb"), U("1509440159596-0249088772ff")],
  tea: [U("1576092768241-dec231879fc3"), U("1544787219-7f47ccb76574")],
  food: [U("1555396273-367ea4eb4db5"), U("1517248135467-4c7edcad34c4"), U("1414235077428-338989a2e8c0"), U("1525610553991-2bede1a236e2"), U("1514933651103-005eec06c04b")],
  garden: [L("garden"), U("1585320806297-9794b3e4eeae"), U("1465146344425-f00d5f5c8f07"), U("1490750967868-88aa4486c946")],
  water: [U("1439066615861-d1af74d74000"), U("1473448912268-2022ce9509d8")],
  nature: [L("garden"), U("1447752875215-b2761acb3c5d"), U("1425913397330-cf8af2ff40a1"), U("1542273917363-3b1817f69a2d"), U("1519331379826-f10be5486c6f"), U("1585320806297-9794b3e4eeae")],
  books: [U("1507842217343-583bb7270b66"), U("1481627834876-b7833e8f5570")],
  quiet: [U("1481627834876-b7833e8f5570"), U("1507842217343-583bb7270b66"), L("coffee")],
  music: [U("1501386761578-eac5c94b800a"), U("1470229722913-7c0e2dbbafd3"), U("1531058020387-3be344556be6")],
  records: [U("1483412033650-1015ddeb83d1")],
  thrift: [U("1567401893414-76b7b1e5a7a5"), U("1532453288672-3a27e9be9efd")],
  mural: [L("passage"), U("1547891654-e66ed7ebb968")],
  art: [U("1513364776144-60967b0f800f"), U("1460661419201-fd4cecdf8a8b"), U("1547891654-e66ed7ebb968"), L("passage")],
  campus: [U("1562774053-701939374585"), U("1524230572899-a752b3835840")],
  courtyard: [L("fountain"), U("1524230572899-a752b3835840")],
  street: [U("1517732306149-e8f829eb588a"), L("fountain"), U("1524230572899-a752b3835840"), U("1519331379826-f10be5486c6f")],
};

/** what kind of place this is, by name first (it's the most specific), then category */
export function photoTheme(quest: { placeId?: string; placeName?: string; category?: string; tags?: string[] }): string {
  const name = `${quest.placeId ?? ""} ${quest.placeName ?? ""} ${(quest.tags ?? []).join(" ")}`.toLowerCase();
  const rules: [RegExp, string][] = [
    [/record|vinyl|groove/, "records"],
    [/graffiti|mural|alley|passage|story wall/, "mural"],
    [/bakery|crumb|pastry|bread/, "bakery"],
    [/ice cream|scoop|dessert|gelato/, "sweets"],
    [/\btea\b|lantern/, "tea"],
    [/coffee|cafe|café|espresso|window.seat/, "coffee"],
    [/thrift|vintage|second chance/, "thrift"],
    [/book|bindery/, "books"],
    [/library|reading|study|stack|quiet/, "quiet"],
    [/garden|peony|botanical|flower/, "garden"],
    [/river|pond|lake|pier|waterfront|harbor|argo|gallup/, "water"],
    [/park|arboretum|trail|lawn|wave field|tree/, "nature"],
    [/fountain|courtyard|quad/, "courtyard"],
    [/campus|diag|university|hall|clock/, "campus"],
    [/gallery|museum|art/, "art"],
    [/music|listening|concert|jazz|open mic/, "music"],
    [/taqueria|diner|noodle|dumpling|food|restaurant|market|counter/, "food"],
  ];
  for (const [re, theme] of rules) if (re.test(name)) return theme;
  const byCategory: Record<string, string> = {
    coffee: "coffee",
    nature: "nature",
    bookstores: "books",
    live_music: "music",
    art: "art",
    thrifting: "thrift",
    local_food: "food",
    architecture: "campus",
    community_events: "street",
    study_spots: "quiet",
    cultural: "art",
    unexpected: "street",
  };
  return byCategory[quest.category ?? ""] ?? "street";
}

/** The same sidequest always gets the same picture; different ones spread across the pool */
export function placePhotoRef(quest: { placeId?: string; placeName?: string; category?: string; tags?: string[] }): PhotoRef {
  const pool = POOLS[photoTheme(quest)] ?? POOLS.street!;
  const key = quest.placeId ?? quest.placeName ?? "";
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return pool[(h >>> 0) % pool.length]!;
}
