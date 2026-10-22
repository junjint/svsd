import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PURPOSE } from '@/features/onboarding/purposeCopy';
import { Decor, Logo, Paper, Text, color, fonts, space } from '@/theme';

/** Why Sidequest: the purpose, kept reachable from Settings */
export default function AboutScreen() {
  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  return (
    <Paper edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <View style={{ width: 64 }} />
        <Text variant="headline" accessibilityRole="header">Why Sidequest</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={close} hitSlop={10} style={styles.done}>
          <Text variant="headline" style={{ color: color.cobalt }}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="display" style={styles.headline}>
          {PURPOSE.headline[0]}{'\n'}
          <Text variant="display" style={{ color: color.cobalt, fontFamily: fonts.serifItalic }}>
            {PURPOSE.headline[1]}
          </Text>
        </Text>

        <View style={{ gap: space.md }}>
          {PURPOSE.about.map((p) => (
            <Text key={p} variant="body" style={styles.body}>{p}</Text>
          ))}
        </View>

        <View style={styles.sign}>
          <Decor name="archOrnate" width={260} />
          <Text style={styles.accent}>{PURPOSE.accent}</Text>
          <View style={{ alignItems: 'center', gap: space.xs, marginTop: space.lg }}>
            <Logo width={96} />
            <Text variant="caption">{PURPOSE.madeIn}</Text>
          </View>
        </View>
      </ScrollView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 52 },
  done: { width: 64, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxxl, gap: space.xl },
  headline: { fontSize: 46, lineHeight: 48 },
  body: { color: color.ink2, fontSize: 17, lineHeight: 24, maxWidth: 360 },
  sign: { alignItems: 'center', gap: space.sm, marginTop: space.lg },
  accent: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 22, color: color.ink2, textAlign: 'center' },
});
