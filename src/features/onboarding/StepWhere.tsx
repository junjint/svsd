import { Platform, StyleSheet, View } from 'react-native';
import { RadiusPicker } from '@/features/location';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Decor, Text, TornPaper, color, fonts, space } from '@/theme';

/** 2 · Location (when in use only) and how far you'll go */
export function StepWhere({ miles, onMiles, asked }: { miles: number; onMiles: (m: number) => void; asked: boolean }) {
  const location = useSidequestStore((s) => s.location);
  const web = Platform.OS === 'web';
  const note = web
    ? 'The web preview has no GPS, so you start in a demo city.'
    : location.isDemo && asked
      ? `No location? No problem. We'll start you in ${location.cityLabel}.`
      : 'Only while the app is open. Never in the background.';

  return (
    <View style={styles.page}>
      <View style={styles.copy}>
        <Text variant="display" style={styles.headline}>
          Start{' '}
          <Text variant="display" style={{ color: color.cobalt, fontFamily: fonts.serifItalic }}>
            near you.
          </Text>
        </Text>
        <Text variant="body" style={styles.body}>
          Sidequest uses your location to find places within reach.
        </Text>
      </View>

      <TornPaper seed="onboarding-city" contentStyle={styles.city}>
        <Decor name="swallow" width={44} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">{location.cityLabel}</Text>
          <Text variant="caption">{note}</Text>
        </View>
      </TornPaper>

      <View style={{ gap: space.sm }}>
        <Text variant="callout">How far will you go?</Text>
        <RadiusPicker value={miles} onChange={onMiles} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.xl },
  copy: { gap: space.md },
  headline: { fontSize: 46, lineHeight: 48 },
  body: { color: color.ink2, fontSize: 17, lineHeight: 24, maxWidth: 330 },
  city: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
});
