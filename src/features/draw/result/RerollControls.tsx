import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { feedback } from '@/services/sound';
import { REROLLS_PER_STAGE } from '@/services/draw/rules';
import { Glass, Text, color } from '@/theme';
import { SNAP } from '../motion';
import { PressScale } from '../PressScale';

type Stage = 'place' | 'activity';

/** A little nudge when there's nothing left to give */
function useShake() {
  const dx = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const shake = () => {
    dx.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 70 }),
      withTiming(-3, { duration: 60 }),
      withSpring(0, SNAP)
    );
  };
  return { style, shake };
}

/** A circular arrow: one open loop with its head at the top right */
function RefreshIcon({ size = 16, tint = color.ink }: { size?: number; tint?: string }) {
  // the View keeps the icon stacked above Glass's blur layers on web (a bare svg paints beneath them)
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <Path d="M20 4v4.5h-4.5" />
      </Svg>
    </View>
  );
}

function RerollButton({
  stage,
  used,
  locked,
  onReroll,
}: {
  stage: Stage;
  used: number;
  locked?: boolean;
  onReroll: () => void;
}) {
  const left = Math.max(0, REROLLS_PER_STAGE - used);
  const available = left > 0 && !locked;
  const { style, shake } = useShake();
  // the visible name sits under a "Reroll" label; VoiceOver hears the whole phrase
  const name = stage === 'place' ? 'Place' : 'Activity';
  // with 2 per stage: "2 left" → "Last one" → none
  const sub = locked ? 'Place locked' : left > 1 ? `${left} left` : left === 1 ? 'Last one' : 'None left';

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <PressScale
        onPress={() => {
          if (!available) {
            feedback('outOfRerolls');
            shake();
            return;
          }
          feedback('reroll');
          onReroll();
        }}
        accessibilityLabel={`Reroll ${name.toLowerCase()}, ${sub}`}
        accessibilityState={{ disabled: !available }}
        style={!available && styles.off}
      >
        <Glass interactive style={styles.btn}>
          <RefreshIcon tint={available ? color.ink : color.ink3} />
          <Text style={[styles.name, !available && { color: color.ink3 }]} numberOfLines={1}>
            {name}
          </Text>
        </Glass>
      </PressScale>
    </Animated.View>
  );
}

export function RerollControls({
  rerolls,
  locked,
  onReroll,
}: {
  rerolls: { place: number; activity: number };
  locked: boolean;
  onReroll: (stage: Stage) => void;
}) {
  return (
    <View style={styles.row}>
      <RerollButton stage="place" used={rerolls.place} locked={locked} onReroll={() => onReroll('place')} />
      <RerollButton stage="activity" used={rerolls.activity} onReroll={() => onReroll('activity')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    height: 52,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  off: { opacity: 0.55 },
  name: { fontSize: 14, fontWeight: '600', color: color.ink },
});
