import { Grid, Plus } from '@/features/folders/icons';
import { View } from 'react-native';

/* Tab glyphs drawn from plain views (no icon font in the bundle).
   20pt box, 1.8pt strokes, ink by default. */

const S = 20;
const W = 1.8;

type IconProps = { tint: string };

/** a folder with its tab: the Library */
export function FoldersIcon({ tint }: IconProps) {
  return (
    <View style={{ width: S, height: S }}>
      <View style={{ position: 'absolute', left: 1.5, top: 3, width: 8, height: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderWidth: W, borderBottomWidth: 0, borderColor: tint }} />
      <View style={{ position: 'absolute', left: 1.5, top: 5.6, width: 17, height: 11.5, borderRadius: 3.5, borderWidth: W, borderColor: tint }} />
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
  folders: FoldersIcon,
  draw: ({ tint }) => <Plus tint={tint} size={20} />,
  gallery: ({ tint }) => <Grid tint={tint} size={20} />,
  profile: ProfileIcon,
};
