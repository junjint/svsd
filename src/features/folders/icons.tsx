import { View } from 'react-native';
import { color } from '@/theme';

/* Small line icons drawn with Views — no icon font in the project. */

type P = { size?: number; tint?: string };
const W = 2;

export function Chevron({ size = 16, tint = color.ink, dir = 'left' }: P & { dir?: 'left' | 'right' | 'down' }) {
  const r = dir === 'left' ? '45deg' : dir === 'right' ? '-135deg' : '-45deg';
  return (
    <View
      style={{
        width: size * 0.55,
        height: size * 0.55,
        borderLeftWidth: W,
        borderBottomWidth: W,
        borderColor: tint,
        borderRadius: 1,
        transform: [{ translateX: dir === 'left' ? size * 0.1 : dir === 'right' ? -size * 0.1 : 0 }, { rotate: r }],
      }}
    />
  );
}

export function Plus({ size = 16, tint = color.ink }: P) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: W, borderRadius: 1, backgroundColor: tint }} />
      <View style={{ position: 'absolute', width: W, height: size, borderRadius: 1, backgroundColor: tint }} />
    </View>
  );
}

export function Close({ size = 14, tint = color.ink }: P) {
  return (
    <View style={{ transform: [{ rotate: '45deg' }] }}>
      <Plus size={size * 1.25} tint={tint} />
    </View>
  );
}

export function Grid({ size = 16, tint = color.ink }: P) {
  const c = (size - 3) / 2;
  const sq = { width: c, height: c, borderRadius: 2.5, borderWidth: 1.6, borderColor: tint };
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
      <View style={sq} />
      <View style={sq} />
      <View style={sq} />
      <View style={sq} />
    </View>
  );
}

export function Dots({ size = 18, tint = color.ink }: P) {
  const d = { width: 4, height: 4, borderRadius: 2, backgroundColor: tint };
  return (
    <View style={{ width: size, flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={d} />
      <View style={d} />
      <View style={d} />
    </View>
  );
}

/** A cog: a ring with eight teeth */
export function Gear({ size = 18, tint = color.ink }: P) {
  const tooth = { position: 'absolute' as const, width: size * 0.2, height: size, borderRadius: 1.5, backgroundColor: tint };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map((a) => (
        <View key={a} style={[tooth, { transform: [{ rotate: `${a}deg` }] }]} />
      ))}
      <View style={{ width: size * 0.74, height: size * 0.74, borderRadius: size, backgroundColor: tint }} />
      <View style={{ position: 'absolute', width: size * 0.32, height: size * 0.32, borderRadius: size, backgroundColor: color.white }} />
    </View>
  );
}

export function Pencil({ size = 14, tint = color.ink }: P) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] }}>
      <View style={{ width: W + 2, height: size, borderRadius: 1.5, backgroundColor: tint }} />
    </View>
  );
}

export function Lock({ size = 12, tint = color.ink3 }: P) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View style={{ width: size * 0.6, height: size * 0.5, borderWidth: 1.5, borderBottomWidth: 0, borderColor: tint, borderTopLeftRadius: size, borderTopRightRadius: size }} />
      <View style={{ width: size, height: size * 0.55, borderRadius: 2, backgroundColor: tint }} />
    </View>
  );
}
