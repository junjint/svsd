import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PressScale } from '@/features/draw/PressScale';
import { feedback } from '@/services/sound';
import { Glass, Text, color, fonts } from '@/theme';
import { startNavigation, type NavigationTarget } from './startNavigation';

/** Navigation arrow (lucide `navigation-2`) */
function NavArrow({ tint }: { tint: string }) {
  return (
    <View style={{ width: 18, height: 18 }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill={tint} stroke={tint} strokeWidth={2} strokeLinejoin="round">
        <Path d="m12 2 7 19-7-4-7 4 7-19Z" />
      </Svg>
    </View>
  );
}

/**
 * "Get directions": the way into in-app navigation to the sidequest's
 * place. The flow itself plugs in at startNavigation.
 */
export function DirectionsButton({ target, detail }: { target: NavigationTarget; detail?: string }) {
  return (
    <PressScale
      accessibilityLabel={`Get directions to ${target.placeName}`}
      onPress={() => {
        feedback('chipSelect');
        startNavigation(target);
      }}
    >
      <Glass tone="ink" interactive style={styles.btn}>
        <View style={styles.icon}>
          <NavArrow tint={color.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Get directions</Text>
          <Text style={styles.detail} numberOfLines={1}>
            {detail ? `${target.placeName} · ${detail}` : target.placeName}
          </Text>
        </View>
      </Glass>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingLeft: 10, paddingRight: 20, borderRadius: 30 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemi, fontSize: 16, color: color.white, letterSpacing: -0.2 },
  detail: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.66)', marginTop: 1 },
});
