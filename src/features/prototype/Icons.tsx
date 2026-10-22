import type { CSSProperties } from "react";
export type IconName =
  | "arrow"
  | "back"
  | "replay"
  | "pin"
  | "walk"
  | "spark"
  | "check"
  | "close"
  | "settings"
  | "chevron"
  | "compass"
  | "sound"
  | "search"
  | "map"
  | "book"
  | "leaf"
  | "art"
  | "coffee"
  | "bag"
  | "bookmark"
  | "pause"
  | "play"
  | "photo"
  | "plus"
  | "profile"
  | "minus"
  | "location"
  | "bell";
const paths: Record<IconName, string> = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  back: "M20 12H5m6-6-6 6 6 6",
  replay: "M4 9a8 8 0 1 1 0 7M4 4v5h5",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 8v4m-2-2h4",
  walk: "M13 5h.01M11 9l3 1 2 4h3M7 14l3-5-1 7-3 5m4-5 4 2 1 3",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  settings: "M5 7h14M5 17h14M9 4v6m6 4v6",
  chevron: "m6 9 6 6 6-6",
  compass: "m16 8-3 5-5 3 3-5 5-3ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  sound: "M4 10h4l5-5v14l-5-5H4v-4Zm12-2c3 2 3 6 0 8m3-11c5 4 5 10 0 14",
  search: "M17 17l4 4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
  book: "M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
  leaf: "M5 19C-1 6 12 3 21 3c0 9-3 22-16 16Zm0 0L16 8",
  art: "M12 3a9 9 0 1 0 0 18h2c2 0 3-2 1-4-1-1 0-3 2-3h1c5 0 4-11-6-11ZM7 9h.01M12 6h.01M17 9h.01M6 14h.01",
  coffee: "M4 8h13v8c0 6-13 6-13 0V8Zm13 1h2c5 0 5 7-2 7M7 3v2m5-2v2",
  bag: "M4 7h16l1 14H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 13 8-13 8V4Z",
  photo: "M3 7h4l2-3h6l2 3h4v14H3V7Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  plus: "M5 12h14M12 5v14",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  minus: "M5 12h14",
  location: "m3 10 18-7-7 18-3-8-8-3Z",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
