import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CountPill, GlassIconButton, Logo, Text } from '@/theme';
import { SuggestGlyph } from '@/features/suggest/SuggestGlyph';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PressScale } from '../PressScale';

const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);

/**
 * Header: suggest and walking demo · wordmark · count of active quests.
 * `minimal` drops both sides, leaving room for the receipt's close button.
 */
export function Header({ minimal = false, onSuggest }: { minimal?: boolean; onSuggest?: () => void }) {
  const active = useSidequestStore((s) => s.quests.filter((q) => ACTIVE.has(q.status)).length);

  return (
    <View style={styles.row}>
      {/* same width as the right side, so the logo stays centred */}
      <View style={[styles.side, styles.lead]}>
        {!minimal && onSuggest ? (
          <GlassIconButton label="Suggest a sidequest" size={40} onPress={onSuggest}>
            <SuggestGlyph />
          </GlassIconButton>
        ) : null}
        {!minimal && <GlassIconButton label="Try iOS walking demo" onPress={() => router.push('/walk')} size={40}><Text style={{ fontSize: 20 }}>↗</Text></GlassIconButton>}
      </View>

      <Logo />

      {minimal ? (
        <View style={styles.side} />
      ) : (
        <PressScale
          onPress={() => router.navigate('/folders')}
          accessibilityLabel={active ? `${active} active ${active === 1 ? 'quest' : 'quests'}` : 'Your folders'}
          disabled={!active}
          hitSlop={8}
          style={[styles.side, { alignItems: 'flex-end' }]}
        >
          <CountPill count={active} />
        </PressScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
  },
  // room for two 40 buttons and their gap
  side: { width: 88, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  lead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
