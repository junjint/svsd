import { StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const BRUSHED = require('../../../../assets/printer/brushed.webp');

/**
 * A thermal receipt printer seen from above, in brushed aluminium: a
 * squircle body with a chrome rim and four screws, a recessed tray, and a
 * dark slot with its rollers. It never moves; the paper does. Drawn with
 * plain Views (plus one grain texture) so it scales to any width.
 */

/** The brushed grain, laid over a gradient so the metal keeps its light */
function Grain({ opacity = 0.6, style }: { opacity?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={BRUSHED}
      contentFit="cover"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { mixBlendMode: 'overlay', opacity } as ImageStyle, style]}
    />
  );
}

/** A countersunk screw head: a little dome with a slot cut across it */
function Screw({ x, y, size, angle }: { x: number; y: number; size: number; angle: number }) {
  return (
    <View style={[styles.screw, { left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={['#FFFFFF', '#B4B8BD', '#7F8388']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.screwSlot, { transform: [{ rotate: `${angle}deg` }] }]} />
    </View>
  );
}

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

      {/* body: satin aluminium, light falling from the top left */}
      <View style={[styles.body, { borderRadius: r }]}>
        <LinearGradient
          colors={['#F4F5F6', '#D3D6D9', '#EEEFF0', '#BEC2C6', '#DCDEE1']}
          locations={[0, 0.3, 0.52, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Grain opacity={0.7} />
        {/* a soft streak of reflected light across the lid */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
          locations={[0.28, 0.42, 0.58]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
        {/* the front face, below the seam, turned away from the light */}
        <View style={[styles.front, { top: seam }]}>
          <LinearGradient colors={['#C9CCD0', '#A4A8AD']} style={StyleSheet.absoluteFill} />
          <Grain opacity={0.55} />
        </View>
        <View style={[styles.seam, { top: seam }]} />
        <View style={[styles.seamLight, { top: seam + 1 }]} />
        {/* vent slit along the bottom edge */}
        <View style={[styles.vent, { top: g.height * 0.9, left: width * 0.2, right: width * 0.2 }]} />
        <View style={[styles.ventLight, { top: g.height * 0.9 + 3, left: width * 0.2, right: width * 0.2 }]} />
        {/* chrome rim: bright where it faces up, dark where it turns under */}
        <View style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: r }]} />
      </View>

      {/* four screws hold the lid down */}
      {[
        [0.065, 0.075, 20],
        [0.935, 0.075, -35],
        [0.065, 0.64, 65],
        [0.935, 0.64, 10],
      ].map(([fx, fy, a]) => (
        <Screw key={`${fx}${fy}`} x={width * fx!} y={g.height * fy!} size={Math.max(7, width * 0.03)} angle={a!} />
      ))}

      {/* recessed tray */}
      <View style={[styles.panel, { left: g.panel.left, top: g.panel.top, width: g.panel.width, height: g.panel.height, borderRadius: width * 0.07 }]}>
        <LinearGradient colors={['#9DA1A6', '#C3C6CA', '#D6D8DB']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        <Grain opacity={0.6} />
        {/* paper guides: two ramps either side of the tray */}
        <LinearGradient
          colors={['#F7F8F9', '#A9ADB2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.guide, { left: g.panel.width * 0.04, top: g.slot.top - g.panel.top + g.slot.height, width: g.panel.width * 0.07 }]}
        />
        <LinearGradient
          colors={['#A9ADB2', '#F7F8F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.guide, { right: g.panel.width * 0.04, top: g.slot.top - g.panel.top + g.slot.height, width: g.panel.width * 0.07 }]}
        />
        {/* the shadow the slot casts down the tray */}
        <LinearGradient
          colors={['rgba(21,16,14,0.28)', 'rgba(21,16,14,0)']}
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
  body: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#9A9EA3' },
  front: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  seam: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#7C8085' },
  seamLight: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.75)' },
  vent: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#6E7277' },
  ventLight: { position: 'absolute', height: 1, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.55)' },
  rim: {
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.8)',
    borderRightColor: 'rgba(110,114,119,0.55)',
    borderBottomColor: 'rgba(90,94,99,0.7)',
  },
  screw: { position: 'absolute', overflow: 'hidden', borderWidth: 0.5, borderColor: '#6E7277', alignItems: 'center', justifyContent: 'center' },
  screwSlot: { width: '70%', height: 1.2, borderRadius: 1, backgroundColor: '#5B5F64' },
  // a recess: the top wall falls in shadow, the bottom wall catches light
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 3,
    borderTopColor: '#7F8388',
    borderLeftColor: '#91959A',
    borderRightColor: '#91959A',
    borderBottomColor: '#F1F2F3',
  },
  base: { position: 'absolute', backgroundColor: '#7D8186' },
  guide: { position: 'absolute', bottom: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  slot: { position: 'absolute', overflow: 'hidden', borderRadius: 5 },
  rollers: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 10 },
  roller: { width: 7, height: '46%', borderRadius: 1.5, backgroundColor: '#3D3D41' },
  rollerMid: { width: 16, backgroundColor: '#5A5A5F' },
  slotLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
});
