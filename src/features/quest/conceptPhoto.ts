/** Generated mood imagery, never documentary place photos or user memories. */
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
