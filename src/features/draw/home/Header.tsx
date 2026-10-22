import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CountPill, Logo } from '@/theme';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PressScale } from '../PressScale';

const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);

/**
 * Header: wordmark · count of active quests.
 * `minimal` drops the count, leaving room for the receipt's close button.
 */
export function Header({ minimal = false }: { minimal?: boolean }) {
  const active = useSidequestStore((s) => s.quests.filter((q) => ACTIVE.has(q.status)).length);

  return (
    <View style={styles.row}>
      {/* Profile lives in the tab bar only; this keeps the logo centred */}
      <View style={styles.side} />

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
  side: { width: 56, height: 44, justifyContent: 'center' },
});
