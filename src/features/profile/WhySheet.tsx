import { ScrollView, StyleSheet, View } from 'react-native';
import { PURPOSE } from '@/features/onboarding/purposeCopy';
import { Decor, DashRule, PillButton, Text, color, fonts, space } from '@/theme';
import { Sheet, useScreen } from '@/ui';

const { story } = PURPOSE;

/** Why we made Sidequest: the reasoning behind it, from the Profile card */
export function WhySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { height } = useScreen();
  return (
    <Sheet visible={visible} onClose={onClose} title={story.title} subtitle={story.subtitle}>
      <ScrollView style={{ maxHeight: height * 0.56 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {story.sections.map((s, i) => (
          <View key={s.kicker} style={styles.section}>
            {i > 0 && <DashRule />}
            <Text variant="label" style={styles.kicker}>
              {s.kicker}
            </Text>
            <Text style={styles.prose}>{s.body}</Text>
          </View>
        ))}
        <View style={styles.close}>
          <Decor name="swallow" width={72} />
          <Text style={styles.accent}>{PURPOSE.accent}</Text>
        </View>
      </ScrollView>
      <PillButton label="Back to my sidequests" tone="ink" sound={null} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingBottom: space.lg },
  section: { gap: space.sm },
  kicker: { color: color.ink2, marginTop: space.xs },
  prose: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 25, color: color.ink },
  close: { alignItems: 'center', gap: space.sm, paddingTop: space.sm },
  accent: { fontFamily: fonts.serifItalic, fontSize: 18, color: color.ink2, textAlign: 'center' },
});
