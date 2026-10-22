import type { Point } from "./data";

// Deliberately abstract city blocks: no tiles, business labels or building footprints.
const latitudes = [
  42.2749, 42.2759, 42.2774, 42.2791, 42.2802, 42.2815, 42.2836,
];
const longitudes = [
  -83.7492, -83.7482, -83.7455, -83.7438, -83.7424, -83.7409, -83.7385,
];
export const mapBlocks = latitudes.slice(1).flatMap((north, row) =>
  longitudes.slice(1).map((east, column) => ({
    bounds: [
      [latitudes[row] + 0.00003, longitudes[column] + 0.00004],
      [north - 0.00003, east - 0.00004],
    ] as [Point, Point],
    green: column === 5 || (row === 5 && column === 1),
  })),
);
export const mapRoadLabels: {
  name: string;
  point: Point;
  vertical?: boolean;
}[] = [
  { name: "E Liberty St", point: [42.2791, -83.7446] },
  { name: "E William St", point: [42.2774, -83.7429] },
  { name: "S State St", point: [42.2772, -83.7409], vertical: true },
  { name: "Thompson St", point: [42.2799, -83.7438], vertical: true },
];
