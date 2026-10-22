import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { GlassIconButton, Logo, color } from '@/theme';
import { DEMO_AVATAR } from '@/features/profile/avatar';
import { SuggestGlyph } from '@/features/suggest/SuggestGlyph';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PressScale } from '../PressScale';

const AVATAR = 40;

/**
 * Header: suggest · wordmark · your profile (the only way to it: Profile has no tab).
 * `minimal` drops both sides, leaving room for the receipt's close button.
 */
export function Header({ minimal = false, onSuggest }: { minimal?: boolean; onSuggest?: () => void }) {
  const avatar = useSidequestStore((s) => s.prefs.avatarUri) ?? DEMO_AVATAR;

  return (
    <View style={styles.row}>
      {/* same width as the right side, so the logo stays centred */}
      <View style={[styles.side, styles.lead]}>
        {!minimal && onSuggest ? (
          <GlassIconButton label="Suggest a sidequest" size={40} onPress={onSuggest}>
            <SuggestGlyph />
          </GlassIconButton>
        ) : null}
      </View>

      <Logo />

      {minimal ? (
        <View style={styles.side} />
      ) : (
        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          <PressScale onPress={() => router.navigate('/profile')} accessibilityLabel="Profile" accessibilityRole="button" hitSlop={8}>
            <View style={styles.avatar}>
              <Image source={{ uri: avatar }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
            </View>
          </PressScale>
        </View>
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
  side: { width: 56, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  lead: { flexDirection: 'row', alignItems: 'center' },
  // a paper ring and a hairline, like the avatar on the Profile banner
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: color.paper,
    backgroundColor: color.mist,
    boxShadow: '0 0 0 1px rgba(21,16,14,0.12), 0 2px 8px rgba(21,16,14,0.10)',
  },
});
