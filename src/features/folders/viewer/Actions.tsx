import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassIconButton, Text, color, space } from '@/theme';
import { Dots, Pencil, Plus } from '../icons';

/** Three round glass buttons under the title: add, note, more */
export function Actions({ busy, onAdd, onEdit, onMore, hideAdd }: { busy?: boolean; onAdd: () => void; onEdit: () => void; onMore: () => void; hideAdd?: boolean }) {
  return (
    <View style={styles.actions}>
      {!hideAdd && (
        <Labeled label={busy ? 'Adding…' : 'Add'}>
          <GlassIconButton label="Add photos" onPress={onAdd} size={48}>
            <Plus size={16} tint={color.cobalt} />
          </GlassIconButton>
        </Labeled>
      )}
      <Labeled label="Note">
        <GlassIconButton label="Edit title, note, mood and rating" onPress={onEdit} size={48}>
          <Pencil />
        </GlassIconButton>
      </Labeled>
      <Labeled label="More">
        <GlassIconButton label="More options" onPress={onMore} size={48}>
          <Dots />
        </GlassIconButton>
      </Labeled>
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 4, width: 64 }}>
      {children}
      <Text variant="caption" importantForAccessibility="no">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
});
