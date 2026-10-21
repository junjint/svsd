import { Pressable, StyleSheet, View } from 'react-native';
import { Text, color, radius, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { LiquidToggle, Sheet } from '@/ui';
import { Chevron } from '../icons';

/** The ⋯ sheet: Gallery, the linked quest, and the two deletes */
export function OptionsSheet({
  folder,
  visible,
  hasPhoto,
  onClose,
  onGallery,
  onOpenQuest,
  onDeletePhoto,
  onDeleteFolder,
}: {
  folder: QuestFolder;
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onGallery: (v: boolean) => void;
  onOpenQuest?: () => void;
  onDeletePhoto: () => void;
  onDeleteFolder: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={folder.title}>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="headline">Save to Gallery</Text>
            <Text variant="caption" style={{ color: color.ink2 }}>Shows on your profile</Text>
          </View>
          <LiquidToggle value={folder.savedToGallery} onChange={onGallery} label="Save to Gallery" />
        </View>
        {onOpenQuest && (
          <>
            <View style={styles.hair} />
            <Row label="Open the quest" onPress={onOpenQuest} chevron />
          </>
        )}
      </View>
      <View style={styles.group}>
        {hasPhoto && (
          <>
            <Row label="Delete this photo" tone="signal" onPress={onDeletePhoto} />
            <View style={styles.hair} />
          </>
        )}
        <Row label="Delete folder" tone="signal" onPress={onDeleteFolder} />
      </View>
    </Sheet>
  );
}

function Row({ label, onPress, tone, chevron }: { label: string; onPress: () => void; tone?: 'signal'; chevron?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Text variant="headline" style={{ flex: 1, color: tone === 'signal' ? color.signal : color.ink }}>
        {label}
      </Text>
      {chevron && <Chevron dir="right" size={12} tint={color.ink3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radius.card - 6, backgroundColor: color.paper, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line, overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginLeft: space.lg },
});
