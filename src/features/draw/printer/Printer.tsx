import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * A thermal receipt printer seen from above: a soft white squircle body,
 * a recessed tray, and a dark slot with its rollers. It never moves; the
 * paper does. Drawn with plain Views so it scales to any width.
 */

export function printerGeometry(width: number) {
  const height = Math.round(width * 0.86);
  const panel = { left: width * 0.12, top: height * 0.1, width: width * 0.76, height: height * 0.6 };
  const slot = { left: panel.left + panel.width * 0.06, top: panel.top + height * 0.08, width: panel.width * 0.88, height: height * 0.085 };
  // the paper is a touch narrower than the slot and leaves from its lower lip
  const paperWidth = Math.round(slot.width * 0.95);
  const paperTop = Math.round(slot.top + slot.height * 0.62);
  return { width, height, panel, slot, paperWidth, paperTop };
}

export function Printer({ width }: { width: number }) {
  const g = printerGeometry(width);
  const r = width * 0.14;
  const seam = g.height * 0.72;

  return (
    <View style={{ width, height: g.height }} accessible={false}>
      {/* contact shadow under the body */}
      <View style={[styles.shadow, { left: width * 0.06, right: width * 0.06, top: g.height * 0.2, bottom: -g.height * 0.04, borderRadius: r }]} />

      {/* the underside, peeking out below the body */}
      <View style={[styles.base, { left: width * 0.03, right: width * 0.03, top: g.height * 0.3, bottom: -g.height * 0.035, borderRadius: r }]} />

      {/* body */}
      <View style={[styles.body, { borderRadius: r }]}>
        <LinearGradient colors={['#FFFFFF', '#F4F3F1', '#E9E8E5']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        {/* the front face, below the seam, a step darker */}
        <LinearGradient colors={['#F0EFEC', '#E2E0DC']} style={[styles.front, { top: seam }]} />
        <View style={[styles.seam, { top: seam }]} />
        <View style={[styles.seamLight, { top: seam + 1 }]} />
        {/* vent slit along the bottom edge */}
        <View style={[styles.vent, { top: g.height * 0.9, left: width * 0.2, right: width * 0.2 }]} />
        {/* rim highlight */}
        <View style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: r }]} />
      </View>

      {/* recessed tray */}
      <View style={[styles.panel, { left: g.panel.left, top: g.panel.top, width: g.panel.width, height: g.panel.height, borderRadius: width * 0.07 }]}>
        <LinearGradient colors={['#E6E5E2', '#F2F1EF', '#F6F5F3']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        {/* paper guides: two ramps either side of the tray */}
        <LinearGradient
          colors={['#FBFBFA', '#E4E2DE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.guide, { left: g.panel.width * 0.04, top: g.slot.top - g.panel.top + g.slot.height, width: g.panel.width * 0.07 }]}
        />
        <LinearGradient
          colors={['#E4E2DE', '#FBFBFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.guide, { right: g.panel.width * 0.04, top: g.slot.top - g.panel.top + g.slot.height, width: g.panel.width * 0.07 }]}
        />
        {/* the shadow the slot casts down the tray */}
        <LinearGradient
          colors={['rgba(21,16,14,0.16)', 'rgba(21,16,14,0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: g.slot.top - g.panel.top + g.slot.height, height: g.height * 0.12 }}
        />
      </View>

      {/* the slot and its rollers */}
      <View style={[styles.slot, { left: g.slot.left, top: g.slot.top, width: g.slot.width, height: g.slot.height }]}>
        <LinearGradient colors={['#050505', '#1D1D1F', '#2E2E31']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.rollers}>
          {Array.from({ length: 9 }, (_, i) => (
            <View key={i} style={[styles.roller, i === 4 && styles.rollerMid]} />
          ))}
        </View>
        <View style={styles.slotLip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(21,16,14,0.05)',
    shadowColor: '#15100E',
    shadowOpacity: 0.22,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 22 },
  },
  body: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#E3E1DD' },
  front: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  seam: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#D3D0CB' },
  seamLight: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.9)' },
  vent: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#CBC8C3' },
  rim: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  // a recess: the top wall falls in shadow, the bottom wall catches light
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 3,
    borderTopColor: '#CFCBC5',
    borderLeftColor: '#DAD6D0',
    borderRightColor: '#DAD6D0',
    borderBottomColor: '#F8F7F5',
  },
  base: { position: 'absolute', backgroundColor: '#D6D3CE' },
  guide: { position: 'absolute', bottom: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  slot: { position: 'absolute', overflow: 'hidden', borderRadius: 5 },
  rollers: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 10 },
  roller: { width: 7, height: '46%', borderRadius: 1.5, backgroundColor: '#3D3D41' },
  rollerMid: { width: 16, backgroundColor: '#5A5A5F' },
  slotLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
});
