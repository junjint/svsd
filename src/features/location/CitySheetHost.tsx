import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { QuestTypeChips } from '@/features/onboarding/QuestTypeChips';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PillButton, Text, color, space } from '@/theme';
import { QUEST_TYPE_LABELS, type QuestType } from '@/types';
import { Sheet } from '@/ui';
import { RadiusPicker } from './RadiusPicker';
import { formatRadius } from './radiusScale';

/**
 * Watches store.cityPrompt (SPEC §4.1). When the app notices a new city it
 * asks you to re-confirm radius and vibe for here, prefilled with what you
 * had. "Looks good" confirms; "Change it" opens the controls inline.
 * Dismissing keeps your settings and stops asking for this city.
 */
export function CitySheetHost() {
  const cityPrompt = useSidequestStore((s) => s.cityPrompt);
  const prefs = useSidequestStore((s) => s.prefs);
  const confirmCity = useSidequestStore((s) => s.confirmCity);
  const still = useReducedMotion();
  const [city, setCity] = useState(cityPrompt ?? '');
  const [miles, setMiles] = useState(prefs.radiusMiles);
  const [vibe, setVibe] = useState<QuestType>(prefs.questType);
  const [editing, setEditing] = useState(false);

  /* refill from the current prefs each time a new city is noticed;
     keep the name while the sheet slides away */
  useEffect(() => {
    if (!cityPrompt) return;
    setCity(cityPrompt);
    setMiles(prefs.radiusMiles);
    setVibe(prefs.questType);
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityPrompt]);

  return (
    <Sheet
      visible={!!cityPrompt}
      onClose={() => void confirmCity()}
      openFeedback="newCity"
      title={`Welcome to ${city}`}
      subtitle="Set your radius and vibe for here?"
    >
      {editing ? (
        <Animated.View entering={still ? undefined : FadeIn.duration(220)} style={{ gap: space.lg }}>
          <RadiusPicker value={miles} onChange={setMiles} />
          <View style={{ gap: space.sm }}>
            <Text variant="caption">Vibe</Text>
            <QuestTypeChips value={vibe} onChange={setVibe} />
          </View>
        </Animated.View>
      ) : (
        <View style={styles.summary} accessible accessibilityLabel={`Current settings: within ${formatRadius(miles)}, ${QUEST_TYPE_LABELS[vibe]}`}>
          <Text variant="headline">Within {formatRadius(miles)}</Text>
          <View style={styles.dot} />
          <Text variant="headline">{vibe === 'random' ? '✦ Random' : QUEST_TYPE_LABELS[vibe]}</Text>
        </View>
      )}
      <View style={{ gap: space.xs }}>
        <PillButton label="Looks good" sound={null} onPress={() => void confirmCity({ radiusMiles: miles, questType: vibe })} />
        {!editing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change it"
            onPress={() => {
              feedback('chipSelect');
              setEditing(true);
            }}
            style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text variant="headline" style={{ color: color.cobalt }}>
              Change it
            </Text>
          </Pressable>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.ink3 },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
