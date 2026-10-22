import Svg, { Circle, Path } from 'react-native-svg';
import { color } from '@/theme';

/* The walk's controls, drawn in the app's 1.8pt ink line instead of text glyphs */
type P = { size?: number; tint?: string };
const line = (tint: string) => ({ fill: 'none', stroke: tint, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export function ReplayIcon({ size = 18, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" {...line(tint)} />
      <Path d="M4.5 4v4h4" {...line(tint)} />
    </Svg>
  );
}

export function RecentreIcon({ size = 18, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="6" {...line(tint)} />
      <Circle cx="12" cy="12" r="1.6" fill={tint} />
      <Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" {...line(tint)} />
    </Svg>
  );
}

export function PlusIcon({ size = 16, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" {...line(tint)} />
    </Svg>
  );
}

export function MinusIcon({ size = 16, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h14" {...line(tint)} />
    </Svg>
  );
}

export function PauseIcon({ size = 14, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8.5 5v14M15.5 5v14" {...line(tint)} strokeWidth={2.4} />
    </Svg>
  );
}

export function PlayIcon({ size = 14, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5.5v13l10-6.5z" fill={tint} />
    </Svg>
  );
}

/** the turn arrow on the direction card: straight on */
export function AheadIcon({ size = 30, tint = color.ink }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20V5M6 10.5 12 4.5l6 6" {...line(tint)} strokeWidth={2.2} />
    </Svg>
  );
}
