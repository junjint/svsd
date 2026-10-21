import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Decor, PillButton, Text, TornPaper, color, space } from '@/theme';
import { PressScale } from '../PressScale';
import { RADIUS_PRESETS, formatRadius } from '@/features/location';

/** phase 'empty': nothing fits — offer the next radius up, or a looser type */
export function EmptyState({ onRetry }: { onRetry: () => void }) {
  const prefs = useSidequestStore((s) => s.prefs);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const discardDraw = useSidequestStore((s) => s.discardDraw);
  const wider = RADIUS_PRESETS.find((r) => r > prefs.radiusMiles);
  const canLoosen = prefs.questType !== 'random';

  const retry = async (patch: Parameters<typeof updatePrefs>[0]) => {
    await updatePrefs(patch);
    discardDraw();
    onRetry();
  };

  return (
    <Animated.View entering={ZoomIn.springify().damping(16)} exiting={FadeOut.duration(150)} style={styles.wrap} accessibilityLiveRegion="polite">
      <TornPaper seed="draw-empty" contentStyle={styles.card}>
      <Decor name="lion" width={58} style={{ marginBottom: space.xs }} />
      <Text variant="title" style={styles.center}>
        Nothing nearby fits that one
      </Text>
      <Text variant="callout" style={styles.center}>
        Try a bigger radius or a different vibe
      </Text>
      <View style={{ gap: space.sm, alignSelf: 'stretch', marginTop: space.sm }}>
        {wider && <PillButton label={`Widen to ${formatRadius(wider)}`} onPress={() => void retry({ radiusMiles: wider })} />}
        {canLoosen && (
          <PillButton label="Try Random" tone={wider ? 'frost' : 'cobalt'} onPress={() => void retry({ questType: 'random' })} />
        )}
        <PressScale onPress={discardDraw} accessibilityLabel="Not now" style={styles.notNow}>
          <Text style={styles.notNowText}>Not now</Text>
        </PressScale>
      </View>
      </TornPaper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 300, alignSelf: 'center' },
  card: { alignItems: 'center', gap: space.sm, padding: space.xl },
  center: { textAlign: 'center' },
  notNow: { height: 44, alignItems: 'center', justifyContent: 'center' },
  notNowText: { fontSize: 15, fontWeight: '600', color: color.ink2 },
});
