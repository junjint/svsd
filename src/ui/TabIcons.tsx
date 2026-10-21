import { View } from 'react-native';

/* Tab glyphs drawn from plain views (no icon font in the bundle).
   20pt box, 1.8pt strokes, ink by default. */

const S = 20;
const W = 1.8;

type IconProps = { tint: string };

/** two tilted cards: the deck */
export function DrawIcon({ tint }: IconProps) {
  return (
    <View style={{ width: S, height: S }}>
      <View style={{ position: 'absolute', left: 2, top: 3, width: 10, height: 14, borderRadius: 3, borderWidth: W, borderColor: tint, transform: [{ rotate: '-14deg' }] }} />
      <View style={{ position: 'absolute', left: 7.5, top: 2.5, width: 10, height: 14, borderRadius: 3, borderWidth: W, borderColor: tint, backgroundColor: 'transparent', transform: [{ rotate: '10deg' }] }}>
        <View style={{ position: 'absolute', left: 2.4, top: 3.6, width: 3.6, height: 3.6, borderRadius: 1, backgroundColor: tint, transform: [{ rotate: '45deg' }] }} />
      </View>
    </View>
  );
}

/** a folder with its tab */
export function FoldersIcon({ tint }: IconProps) {
  return (
    <View style={{ width: S, height: S }}>
      <View style={{ position: 'absolute', left: 1.5, top: 3, width: 8, height: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderWidth: W, borderBottomWidth: 0, borderColor: tint }} />
      <View style={{ position: 'absolute', left: 1.5, top: 5.6, width: 17, height: 11.5, borderRadius: 3.5, borderWidth: W, borderColor: tint }} />
    </View>
  );
}

/** a wall of posts: 2×2 tiles */
export function WallIcon({ tint }: IconProps) {
  const tile = (left: number, top: number, h: number) => (
    <View style={{ position: 'absolute', left, top, width: 7.4, height: h, borderRadius: 2.2, borderWidth: W, borderColor: tint }} />
  );
  return (
    <View style={{ width: S, height: S }}>
      {tile(2, 2, 9)}
      {tile(10.6, 2, 6)}
      {tile(2, 12.6, 5.4)}
      {tile(10.6, 9.6, 8.4)}
    </View>
  );
}

/** head and shoulders */
export function ProfileIcon({ tint }: IconProps) {
  return (
    <View style={{ width: S, height: S }}>
      <View style={{ position: 'absolute', left: 6.2, top: 1.8, width: 7.6, height: 7.6, borderRadius: 3.8, borderWidth: W, borderColor: tint }} />
      <View style={{ position: 'absolute', left: 3, top: 11.4, width: 14, height: 7.4, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderWidth: W, borderColor: tint }} />
    </View>
  );
}

export const TAB_ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  draw: DrawIcon,
  folders: FoldersIcon,
  wall: WallIcon,
  profile: ProfileIcon,
};
