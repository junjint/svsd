import { View } from 'react-native';
import { color } from '@/theme';

/* A speech bubble with a plus in it: "add something to the pool".
   Drawn from plain views like the tab glyphs, 20pt box, 1.8pt strokes. */
const S = 20;
const W = 1.8;

export function SuggestGlyph({ tint = color.ink }: { tint?: string }) {
  return (
    <View style={{ width: S, height: S }}>
      <View style={{ position: 'absolute', left: 1.5, top: 2, width: 17, height: 13, borderRadius: 4.5, borderWidth: W, borderColor: tint }} />
      {/* the tail: a small turned square tucked under the bubble's lower left */}
      <View style={{ position: 'absolute', left: 4.6, top: 12.2, width: 4.6, height: 4.6, borderRightWidth: W, borderBottomWidth: W, borderColor: tint, transform: [{ rotate: '45deg' }], backgroundColor: color.paper }} />
      <View style={{ position: 'absolute', left: 6.4, top: 7.6, width: 7.2, height: W, borderRadius: 1, backgroundColor: tint }} />
      <View style={{ position: 'absolute', left: 9.1, top: 4.9, width: W, height: 7.2, borderRadius: 1, backgroundColor: tint }} />
    </View>
  );
}
