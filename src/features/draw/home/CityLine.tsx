import { StyleSheet } from 'react-native';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { showToast } from '@/ui';
import { COUNTRIES, DEMO_CITIES, type CountryCode } from '@/data/demoCities';
import { Flag } from '@/features/location/Flag';
import { Text, color } from '@/theme';
import { PressScale } from '../PressScale';
import { formatRadius } from './locationSeam';

/** "New York City · 2 mi ▾" — tap for radius; long-press flips the demo city */
export function CityLine({ onOpen }: { onOpen: () => void }) {
  const location = useSidequestStore((s) => s.location);
  const radius = useSidequestStore((s) => s.prefs.radiusMiles);
  const setDemoCity = useSidequestStore((s) => s.setDemoCity);

  const country = location.country && location.country in COUNTRIES ? (location.country as CountryCode) : undefined;

  // demo stand-in for travelling: hop between the two curated cities
  const flipDemo = () => {
    if (!location.isDemo) return;
    const next = location.demoCity === 'nyc' ? 'ann_arbor' : 'nyc';
    feedback('newCity');
    void setDemoCity(next);
    showToast(`Demo city: ${DEMO_CITIES[next].label}`);
  };

  return (
    <PressScale
      onPress={onOpen}
      onLongPress={flipDemo}
      delayLongPress={450}
      hitSlop={8}
      accessibilityLabel={`${location.cityLabel}, within ${radius} miles. Change radius`}
      accessibilityHint={location.isDemo ? 'Long-press to switch the demo city' : undefined}
      style={styles.line}
    >
      {country ? <Flag code={country} width={18} /> : null}
      <Text style={styles.text}>
        {location.cityLabel}
        <Text style={styles.dot}> · </Text>
        {formatRadius(radius)}
        <Text style={styles.caret}> ▾</Text>
      </Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  line: { alignSelf: 'center', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  text: { fontSize: 15, fontWeight: '500', color: color.ink2, letterSpacing: -0.1 },
  dot: { color: color.ink3 },
  caret: { fontSize: 11, color: color.ink3 },
});
