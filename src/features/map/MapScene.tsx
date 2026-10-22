import { IsoScene } from './IsoScene';
import type { MapSceneProps } from './scene';

/** Native: the SVG paper model. The web build swaps in three.js (MapScene.web.tsx) */
export function MapScene(props: MapSceneProps) {
  return <IsoScene {...props} />;
}
