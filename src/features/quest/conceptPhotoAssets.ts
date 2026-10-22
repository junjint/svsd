import { Asset } from "expo-asset";
import { conceptPhotoKey } from "./conceptPhoto";

const photos = {
  fountain: Asset.fromModule(
    require("../../../assets/prototype/fountain-courtyard.png"),
  ).uri,
  passage: Asset.fromModule(
    require("../../../assets/prototype/art-passage.png"),
  ).uri,
  garden: Asset.fromModule(
    require("../../../assets/prototype/pocket-garden.png"),
  ).uri,
  coffee: Asset.fromModule(require("../../../assets/prototype/window-seat.png"))
    .uri,
};
export function conceptPhoto(quest: Parameters<typeof conceptPhotoKey>[0]) {
  return photos[conceptPhotoKey(quest)];
}
