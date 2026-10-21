import { Pressable, StyleSheet, View } from 'react-native';
import { feedback } from '@/services/sound';
import { Text, color, fonts, space } from '@/theme';
import type { QuestType } from '@/types';
import { QuestTypeChips } from './QuestTypeChips';

/** 3 · Favourite quest type, and the 13+ confirmation */
export function StepVibe({
  type,
  onType,
  ageOk,
  onAge,
}: {
  type: QuestType;
  onType: (t: QuestType) => void;
  ageOk: boolean;
  onAge: (v: boolean) => void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.copy}>
        <Text variant="display" style={styles.headline}>
          What's your{' '}
          <Text variant="display" style={{ color: color.cobalt, fontFamily: fonts.serifItalic }}>
            vibe?
          </Text>
        </Text>
        <Text variant="body" style={styles.body}>
          Pick the kind of quest you'd draw first. You can switch any time on the Draw screen.
        </Text>
      </View>

      <QuestTypeChips value={type} onChange={onType} size="lg" />

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ageOk }}
        accessibilityLabel="I'm 13 or older"
        onPress={() => {
          feedback('toggle');
          onAge(!ageOk);
        }}
        style={styles.age}
      >
        <View style={[styles.box, ageOk && styles.boxOn]}>{ageOk && <Text style={styles.tick}>✓</Text>}</View>
        <Text variant="callout" style={{ color: ageOk ? color.ink : color.ink2 }}>
          I'm 13 or older
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.xl },
  copy: { gap: space.md },
  headline: { fontSize: 46, lineHeight: 48 },
  body: { color: color.ink2, fontSize: 17, lineHeight: 24, maxWidth: 330 },
  age: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44, alignSelf: 'center' },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: color.ink3, alignItems: 'center', justifyContent: 'center', backgroundColor: color.white },
  boxOn: { backgroundColor: color.cobalt, borderColor: color.cobalt },
  tick: { color: color.white, fontSize: 14, fontWeight: '700', lineHeight: 16 },
});
