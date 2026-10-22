import { Pressable, StyleSheet, View } from 'react-native';
import { Text, color, radius, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { Sheet } from '@/ui';
import { Chevron } from '../icons';

/** The ⋯ sheet: the linked quest and the two deletes. Folders are yours alone, so there's no sharing here */
export function OptionsSheet({
  folder,
  visible,
  hasPhoto,
  onClose,
  onOpenQuest,
  onDeletePhoto,
  onDeleteFolder,
  deleteLabel = 'Delete folder',
}: {
  folder: QuestFolder;
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onOpenQuest?: () => void;
  onDeletePhoto: () => void;
  onDeleteFolder: () => void;
  deleteLabel?: string;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={folder.title}>
      {onOpenQuest && (
        <View style={styles.group}>
          <Row label="Open the quest" onPress={onOpenQuest} chevron />
        </View>
      )}
      <View style={styles.group}>
        {hasPhoto && (
          <>
            <Row label="Delete this photo" tone="signal" onPress={onDeletePhoto} />
            <View style={styles.hair} />
          </>
        )}
        <Row label={deleteLabel} tone="signal" onPress={onDeleteFolder} />
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
