import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { feedback } from '@/services/sound';
import { REROLLS_PER_STAGE } from '@/services/draw/rules';
import { Glass, Text, color, radius } from '@/theme';
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
          <Text style={[styles.name, !available && { color: color.ink3 }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={[styles.count, !available && styles.countOff]}>
            <Text style={styles.sub}>{sub}</Text>
          </View>
        </Glass>
      </PressScale>
    </Animated.View>
  );
}

/** A padlock drawn in two pieces so the shackle can spring open */
function Padlock({ locked }: { locked: boolean }) {
  const t = useDerivedValue(() => withSpring(locked ? 0 : 1, SNAP), [locked]);
  const shackle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * t.value }, { translateX: 3 * t.value }, { rotate: `${18 * t.value}deg` }],
  }));
  const tint = locked ? color.white : color.ink2;
  return (
    <View style={styles.lock}>
      <Animated.View style={[styles.shackle, { borderColor: tint }, shackle]} />
      <View style={[styles.body, { backgroundColor: tint }]} />
    </View>
  );
}

export function RerollControls({
  rerolls,
  locked,
  onReroll,
  onToggleLock,
}: {
  rerolls: { place: number; activity: number };
  locked: boolean;
  onReroll: (stage: Stage) => void;
  onToggleLock: () => void;
}) {
  return (
    <View style={styles.row}>
      <RerollButton stage="place" used={rerolls.place} locked={locked} onReroll={() => onReroll('place')} />
      <PressScale
        onPress={() => {
          feedback('lockPlace');
          onToggleLock();
        }}
        scaleTo={0.9}
        accessibilityRole="switch"
        accessibilityState={{ checked: locked }}
        accessibilityLabel={locked ? 'Place locked' : 'Lock place'}
        accessibilityHint="Keeps this place while you reroll the activity"
      >
        <Glass tone={locked ? 'ink' : 'clear'} interactive style={styles.lockBtn}>
          <Padlock locked={locked} />
        </Glass>
      </PressScale>
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
  count: { height: 20, paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: 'rgba(21,16,14,0.06)', justifyContent: 'center' },
  countOff: { backgroundColor: 'transparent' },
  sub: { fontSize: 11, fontWeight: '600', color: color.ink2, fontVariant: ['tabular-nums'] },
  lockBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  lock: { width: 18, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  shackle: { position: 'absolute', top: 0, width: 12, height: 13, borderWidth: 2.2, borderBottomWidth: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  body: { width: 18, height: 12, borderRadius: 3.5 },
});
