import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ConfirmSheet } from '@/features/folders/ConfirmSheet';
import { forgetPhoto } from '@/features/folders/pickPhotos';
import { RadiusPicker } from '@/features/location';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Logo, Paper, Text, TornPaper, color, radius as R, space } from '@/theme';
import { LiquidToggle, showToast } from '@/ui';

export default function SettingsScreen() {
  const prefs = useSidequestStore((s) => s.prefs);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const clearAll = useSidequestStore((s) => s.clearAll);
  const [confirmClear, setConfirmClear] = useState(false);
  const [radius, setRadius] = useState(prefs.radiusMiles);
  useEffect(() => setRadius(prefs.radiusMiles), [prefs.radiusMiles]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <Paper edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <View style={{ width: 64 }} />
        <Text variant="headline" accessibilityRole="header">Settings</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={close} hitSlop={10} style={styles.done}>
          <Text variant="headline" style={{ color: color.cobalt }}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: space.xxxl }}>
        <Group title="Feel">
          <ToggleRow label="Sounds" hint="Little clicks and chimes. Follows your mute switch" value={prefs.soundsEnabled} onChange={(v) => void updatePrefs({ soundsEnabled: v })} />
          <Hair />
          <ToggleRow label="Haptics" hint="Taps you can feel" value={prefs.hapticsEnabled} onChange={(v) => void updatePrefs({ hapticsEnabled: v })} />
          <Hair />
          <ToggleRow
            label="Always skip reveals"
            hint="Go straight to the result, no scratching"
            value={prefs.alwaysSkipReveals}
            onChange={(v) => void updatePrefs({ alwaysSkipReveals: v })}
          />
        </Group>

        <Group title="Default radius">
          <View style={{ padding: space.lg, gap: space.md }}>
            <Text variant="callout">How far the Draw looks for places</Text>
            <RadiusPicker value={radius} onChange={setRadius} onCommit={(mi) => void updatePrefs({ radiusMiles: mi })} />
          </View>
        </Group>

        <Group title="Your data">
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all data" onPress={() => setConfirmClear(true)} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="headline" style={{ color: color.signal }}>Clear all data</Text>
              <Text variant="caption" style={{ color: color.ink2 }}>Quests, folders, badges and settings on this phone</Text>
            </View>
          </Pressable>
        </Group>

        <Group title="About">
          <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: space.xs, paddingVertical: space.lg }]}>
            <Logo width={96} />
            <Text variant="callout">Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
            <Text variant="callout">Draw a place, draw a thing to do there, go. Made in Ann Arbor.</Text>
            <Text variant="caption">Motion and sounds from Bencho.</Text>
          </View>
        </Group>
      </ScrollView>

      <ConfirmSheet
        visible={confirmClear}
        title="Clear everything?"
        body="Every quest, folder, badge and setting on this phone goes. This can't be undone."
        confirmLabel="Clear all data"
        cancelLabel="Never mind"
        onConfirm={async () => {
          useSidequestStore.getState().folders.forEach((f) => f.photos.forEach((ph) => forgetPhoto(ph.uri)));
          await clearAll();
          showToast('All cleared');
          if (router.canDismiss()) router.dismissAll();
          router.replace('/');
        }}
        onClose={() => setConfirmClear(false)}
      />
    </Paper>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" style={{ color: color.ink2, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: space.xs }}>
        {title.toUpperCase()}
      </Text>
      <TornPaper seed={`settings-${title}`}>{children}</TornPaper>
    </View>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="headline">{label}</Text>
        <Text variant="caption" style={{ color: color.ink2 }}>{hint}</Text>
      </View>
      <LiquidToggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

const Hair = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginLeft: space.lg }} />;

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 52 },
  done: { width: 64, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md },
});
