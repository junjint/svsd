import { Asset } from "expo-asset";
import { placePhotoRef, type ConceptPhotoKey } from "./conceptPhoto";

/* the bundled images, re-encoded to webp so the first open isn't waiting on a 3 MB png */
const photos: Record<ConceptPhotoKey, string> = {
  fountain: Asset.fromModule(require("../../../assets/prototype/fountain-courtyard.webp")).uri,
  passage: Asset.fromModule(require("../../../assets/prototype/art-passage.webp")).uri,
  garden: Asset.fromModule(require("../../../assets/prototype/pocket-garden.webp")).uri,
  coffee: Asset.fromModule(require("../../../assets/prototype/window-seat.webp")).uri,
};

/** A sidequest's cover until it has photos of its own: varied by kind of place */
export function conceptPhoto(quest: Parameters<typeof placePhotoRef>[0]) {
  const ref = placePhotoRef(quest);
  return "local" in ref ? photos[ref.local] : ref.remote;
}
