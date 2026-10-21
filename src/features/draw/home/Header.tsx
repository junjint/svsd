import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CountPill, Logo, Text, color, shadow } from '@/theme';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PressScale } from '../PressScale';

const AVATAR = 40;
const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);

/**
 * Pool header: glowing avatar · wordmark · count of active quests.
 * `minimal` drops the avatar and count, leaving room for the receipt's close button.
 */
export function Header({ minimal = false }: { minimal?: boolean }) {
  const name = useSidequestStore((s) => s.prefs.displayName);
  const active = useSidequestStore((s) => s.quests.filter((q) => ACTIVE.has(q.status)).length);
  const initial = name?.trim()[0]?.toUpperCase();

  return (
    <View style={styles.row}>
      {minimal ? (
        <View style={styles.side} />
      ) : (
        <PressScale onPress={() => router.navigate('/profile')} accessibilityLabel="Your profile" hitSlop={6} style={styles.side}>
          <View style={styles.haloWide} />
          <View style={styles.halo} />
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initial ?? '☺'}</Text>
          </View>
        </PressScale>
      )}

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
  // a soft grey halo centred on the avatar (Pool): a blurred disc hidden
  // behind the white circle, plus a faint wider wash
  halo: {
    position: 'absolute',
    left: 2,
    top: 4,
    width: AVATAR - 4,
    height: AVATAR - 4,
    borderRadius: AVATAR / 2,
    backgroundColor: color.ink3,
    shadowColor: color.ink2,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
  },
  haloWide: {
    position: 'absolute',
    left: -8,
    top: -6,
    width: AVATAR + 16,
    height: AVATAR + 16,
    borderRadius: (AVATAR + 16) / 2,
    backgroundColor: color.cobalt,
    opacity: 0.07,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: color.white,
    borderWidth: 2,
    borderColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lift,
  },
  initial: { fontSize: 17, fontWeight: '600', color: color.cobalt },
});
