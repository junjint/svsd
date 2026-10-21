import { Pressable, StyleSheet, View } from 'react-native';
import { feedback } from '@/services/sound';
import { Glass, Text as RNText, color, fonts, space } from '@/theme';
import { QUEST_TYPE_LABELS, type QuestType } from '@/types';

const ORDER: QuestType[] = ['meal', 'snack', 'nature', 'focus', 'random'];

/* Garamond italic index numbers, "01/" style, instead of icons */
const GLYPH: Record<QuestType, string> = {
  meal: '01',
  snack: '02',
  nature: '03',
  focus: '04',
  random: '✦',
};

/** Pick one quest type (SPEC §3.1); ✦ Random is the default */
export function QuestTypeChips({ value, onChange, size = 'md' }: { value: QuestType; onChange: (t: QuestType) => void; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Quest type">
      {ORDER.map((t) => {
        const on = t === value;
        return (
          <Pressable
            key={t}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={QUEST_TYPE_LABELS[t]}
            onPress={() => {
              if (on) return;
              feedback('chipSelect');
              onChange(t);
            }}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
          >
            <Glass tone={on ? 'ink' : 'clear'} interactive style={[styles.chip, lg && styles.lg]}>
            <RNText style={[styles.glyph, lg && { fontSize: 18 }, on && { color: color.white }]}>{GLYPH[t]}</RNText>
            <RNText style={[styles.label, lg && { fontSize: 17 }, on && { color: color.white }]}>{QUEST_TYPE_LABELS[t]}</RNText>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: space.lg },
  lg: { height: 52, paddingHorizontal: space.xl, gap: space.sm },
  glyph: { fontFamily: fonts.serifItalic, fontSize: 17, color: color.ink2 },
  label: { fontSize: 15, fontWeight: '600', color: color.ink },
});
