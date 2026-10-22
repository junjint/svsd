import { Asset } from "expo-asset";
export const logo = Asset.fromModule(
  require("../../../../assets/brand/side-logo.png"),
).uri;
export const grain = Asset.fromModule(
  require("../../../../assets/design/grain-light.png"),
).uri;
// Brushed-metal material from Rebecca's 8516b88 printer, reused unchanged.
export const brushedMetal = Asset.fromModule(
  require("../../../../assets/prototype/brushed-metal.webp"),
).uri;
export const photos = {
  fountain: Asset.fromModule(
    require("../../../../assets/prototype/fountain-courtyard.png"),
  ).uri,
  passage: Asset.fromModule(
    require("../../../../assets/prototype/art-passage.png"),
  ).uri,
  garden: Asset.fromModule(
    require("../../../../assets/prototype/pocket-garden.png"),
  ).uri,
  coffee: Asset.fromModule(
    require("../../../../assets/prototype/window-seat.png"),
  ).uri,
};
const fonts = {
  PlusJakartaSans_400Regular: require("@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf"),
  PlusJakartaSans_500Medium: require("@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf"),
  PlusJakartaSans_600SemiBold: require("@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf"),
  EBGaramond_400Regular: require("@expo-google-fonts/eb-garamond/400Regular/EBGaramond_400Regular.ttf"),
  EBGaramond_400Regular_Italic: require("@expo-google-fonts/eb-garamond/400Regular_Italic/EBGaramond_400Regular_Italic.ttf"),
};
export const fontCSS = Object.entries(fonts)
  .map(
    ([name, file]) =>
      `@font-face{font-family:'${name}';src:url('${Asset.fromModule(file).uri}') format('truetype');font-display:swap}`,
  )
  .join("");
