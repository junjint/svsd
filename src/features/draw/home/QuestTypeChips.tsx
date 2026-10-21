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
  const questType = useSidequestStore((s) => s.prefs.questType);
  const focus = useSidequestStore((s) => s.prefs.focus);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);

  const pick = (patch: { questType?: QuestType; focus?: FocusSetting }) => {
    feedback('chipSelect');
    void updatePrefs(patch);
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)} style={{ gap: space.md }}>
      {/* two deliberate rows: the four types share one, Random gets its own wide chip */}
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Quest type">
        <View style={styles.row}>
          {TYPES.map((t) => (
            <Chip key={t} grow label={QUEST_TYPE_LABELS[t]} selected={questType === t} onPress={() => questType !== t && pick({ questType: t })} />
          ))}
        </View>
        <View style={styles.randomRow}>
          <View style={styles.random}>
            <Chip
              label={`✦ ${QUEST_TYPE_LABELS.random}`}
              a11yLabel={QUEST_TYPE_LABELS.random}
              selected={questType === 'random'}
              onPress={() => questType !== 'random' && pick({ questType: 'random' })}
            />
          </View>
        </View>
      </View>

      {questType === 'focus' && (
        <Animated.View entering={FadeInDown.springify().damping(SPRING.damping)} exiting={FadeOutUp.duration(160)}>
          <View style={styles.subRow} accessibilityRole="radiogroup" accessibilityLabel="Focus setting">
            {FOCUS.map((f) => (
              <Chip key={f.id} size="sm" label={f.label} selected={focus === f.id} onPress={() => focus !== f.id && pick({ focus: f.id })} />
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
  randomRow: { alignItems: 'center' },
  random: { minWidth: 168 },
  subRow: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
});
