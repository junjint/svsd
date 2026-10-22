import { StyleSheet, View } from 'react-native';
import { Decor, Text, color, fonts, space } from '@/theme';
import { PURPOSE } from './purposeCopy';

/** 0 · Why Sidequest exists, under the ornate arch */
export function StepWhy({ width }: { width: number }) {
  const archW = Math.min(width - space.xl * 2, 300);

  return (
    <View style={styles.page}>
      <View style={styles.copy}>
        <Text variant="display" style={styles.headline}>
          {PURPOSE.headline[0]}{'\n'}
          <Text variant="display" style={{ color: color.cobalt, fontFamily: fonts.serifItalic }}>
            {PURPOSE.headline[1]}
          </Text>
        </Text>
        {PURPOSE.why.map((p) => (
          <Text key={p} variant="body" style={styles.body}>{p}</Text>
        ))}
      </View>

      <View style={styles.foot}>
        <Decor name="archOrnate" width={archW} />
        <Text style={styles.accent}>{PURPOSE.accent}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.xxl },
  copy: { gap: space.md },
  headline: { fontSize: 46, lineHeight: 48 },
  body: { color: color.ink2, fontSize: 17, lineHeight: 24, maxWidth: 330 },
  /* pushed low so the arch frames the bottom of the page */
  foot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: space.sm, paddingBottom: space.lg },
  accent: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 22, color: color.ink2, textAlign: 'center' },
});
