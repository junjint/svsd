/** Seeded concept data, not verified businesses, ratings, hours, or route estimates. */
export type Point = readonly [number, number];
export const START: Point = [42.2791, -83.7409];
export const categories = [
  { id: "hidden", label: "Hidden places", icon: "spark" },
  { id: "art", label: "Art & architecture", icon: "art" },
  { id: "nature", label: "A little nature", icon: "leaf" },
  { id: "coffee", label: "Food & coffee", icon: "coffee" },
  { id: "shops", label: "Small shops", icon: "bag" },
  { id: "stories", label: "Local stories", icon: "book" },
] as const;
export type Category = (typeof categories)[number]["id"];
export interface Quest {
  id: string;
  name: string;
  subtitle: string;
  descriptor: string;
  story: string;
  challenge: string;
  position: Point;
  detourMinutes: number;
  categories: Category[];
  image: "fountain" | "passage" | "garden" | "coffee";
  source: "seeded-demo";
}
export const quests: Quest[] = [
  {
    id: "fountain",
    name: "The Fountain Steps",
    subtitle: "A pocket of stillness",
    descriptor: "Quiet water, just off your usual way.",
    story:
      "In our imagined courtyard, someone leaves a handwritten poem on the steps every Thursday. Today’s is about taking the long way home.",
    challenge: "Sit for a moment. What can you hear when you stop moving?",
    position: [42.27835, -83.7424],
    detourMinutes: 4,
    categories: ["hidden", "stories"],
    image: "fountain",
    source: "seeded-demo",
  },
  {
    id: "passage",
    name: "The Color Passage",
    subtitle: "Look a little closer",
    descriptor: "An ordinary alley. An ever-changing canvas.",
    story:
      "In this imagined passage off Liberty, a patch of blue gets painted over every week. Look closely: the old colors never quite disappear.",
    challenge: "Find a tiny detail you would have walked past.",
    position: [42.2791, -83.74275],
    detourMinutes: 3,
    categories: ["art", "stories"],
    image: "passage",
    source: "seeded-demo",
  },
  {
    id: "garden",
    name: "The Quiet Bench",
    subtitle: "A breath between places",
    descriptor: "One maple tree. A little room to breathe.",
    story:
      "This fictional garden keeps one bench facing away from the path. It’s a small invitation to watch the leaves instead of the people passing.",
    challenge: "Look up. Notice three different shades of green.",
    position: [42.2775, -83.7385],
    detourMinutes: 5,
    categories: ["nature", "hidden"],
    image: "garden",
    source: "seeded-demo",
  },
  {
    id: "coffee",
    name: "The Window Seat",
    subtitle: "A very small ritual",
    descriptor: "A warm cup, a good window, nowhere to rush.",
    story:
      "At our imagined neighborhood café, the window table comes with a book of notes left by strangers. Add one small good thing about today.",
    challenge: "Write one sentence you’d like a stranger to find.",
    position: [42.2791, -83.7441],
    detourMinutes: 4,
    categories: ["coffee", "shops", "stories"],
    image: "coffee",
    source: "seeded-demo",
  },
];
export const destinations = [
  {
    id: "union",
    name: "Michigan Union",
    detail: "South State Street",
    position: [42.2751, -83.7415] as Point,
  },
  {
    id: "library",
    name: "Downtown Library",
    detail: "South Fifth Avenue",
    position: [42.2777, -83.7451] as Point,
  },
  {
    id: "kerrytown",
    name: "Kerrytown",
    detail: "A walk north of downtown",
    position: [42.2836, -83.7477] as Point,
  },
];
export const questById = (id: string | null) => quests.find((q) => q.id === id);
export const destinationById = (id: string) =>
  destinations.find((d) => d.id === id) ?? destinations[0];

// A small, geographically anchored street graph. It remains usable without network tiles.
export const streets = [
  {
    name: "S Main St",
    points: [
      [42.2749, -83.7482],
      [42.2836, -83.7482],
    ] as Point[],
  },
  {
    name: "S Division St",
    points: [
      [42.2749, -83.7455],
      [42.2836, -83.7455],
    ] as Point[],
  },
  {
    name: "Thompson St",
    points: [
      [42.2749, -83.7438],
      [42.2815, -83.7438],
    ] as Point[],
  },
  {
    name: "Maynard St",
    points: [
      [42.2759, -83.7424],
      [42.2802, -83.7424],
    ] as Point[],
  },
  {
    name: "S State St",
    points: [
      [42.2749, -83.7409],
      [42.2836, -83.7409],
    ] as Point[],
  },
  {
    name: "E Catherine St",
    points: [
      [42.2836, -83.7492],
      [42.2836, -83.7398],
    ] as Point[],
  },
  {
    name: "E Huron St",
    points: [
      [42.2815, -83.7492],
      [42.2815, -83.7398],
    ] as Point[],
  },
  {
    name: "E Washington St",
    points: [
      [42.2802, -83.7492],
      [42.2802, -83.7398],
    ] as Point[],
  },
  {
    name: "E Liberty St",
    points: [
      [42.2791, -83.7492],
      [42.2791, -83.7385],
    ] as Point[],
  },
  {
    name: "E William St",
    points: [
      [42.2774, -83.7492],
      [42.2774, -83.7409],
    ] as Point[],
  },
  {
    name: "E Jefferson St",
    points: [
      [42.2759, -83.7492],
      [42.2759, -83.7409],
    ] as Point[],
  },
  {
    name: "E Madison St",
    points: [
      [42.2749, -83.7492],
      [42.2749, -83.7409],
    ] as Point[],
  },
  {
    name: "Campus walk",
    points: [
      [42.2791, -83.7409],
      [42.2775, -83.7385],
      [42.2759, -83.7409],
    ] as Point[],
  },
];
