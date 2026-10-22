import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { QUEST_TYPE_LABELS, type FocusSetting, type QuestType } from '@/types';
import { space } from '@/theme';
import { SPRING } from '../motion';
import { Chip } from './Chip';

const TYPES: Exclude<QuestType, 'random'>[] = ['meal', 'snack', 'nature', 'focus'];
const FOCUS: { id: FocusSetting; label: string }[] = [
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'any', label: 'Any' },
];

export function QuestTypeChips() {
  const [randomSelected, setRandomSelected] = useState(false);
  const questType = useSidequestStore((s) => s.prefs.questType);
  const focus = useSidequestStore((s) => s.prefs.focus);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);

  const pick = (patch: { questType?: QuestType; focus?: FocusSetting }) => {
    if (patch.questType) setRandomSelected(false);
    feedback('chipSelect');
    void updatePrefs(patch);
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)} style={{ gap: space.md }}>
      {/* Choose a category, or leave the adventure to chance. */}
      <View style={styles.grid} accessibilityLabel="Quest type, optional">
        <View style={styles.row}>
          {TYPES.map((t) => (
            <Chip
              key={t}
              grow
              label={QUEST_TYPE_LABELS[t]}
              selected={questType === t}
              onPress={() => pick({ questType: questType === t ? 'random' : t })}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Chip grow label={QUEST_TYPE_LABELS.random} selected={questType === 'random' && randomSelected} onPress={() => { pick({ questType: 'random' }); setRandomSelected(true); }} />
        </View>
      </View>

      {questType === 'focus' && (
        <Animated.View entering={FadeInDown.springify().damping(SPRING.damping)} exiting={FadeOutUp.duration(160)}>
          <View style={styles.subRow} accessibilityRole="radiogroup" accessibilityLabel="Focus setting">
            {FOCUS.map((f) => (
              <Chip key={f.id} role="radio" size="sm" label={f.label} selected={focus === f.id} onPress={() => focus !== f.id && pick({ focus: f.id })} />
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: 20, gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  subRow: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
});
