import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PillButton, Text, color, radius, space } from '@/theme';
import type { DrawnSidequest, QuestFolder } from '@/types';
import { Sheet } from '@/ui';

const LINKABLE = new Set(['accepted', 'en_route', 'arrived', 'completed']);

/** Name a folder and optionally tie it to an active or finished quest that has no folder yet */
export function NewFolderSheet({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (f: QuestFolder) => void }) {
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const createFolder = useSidequestStore((s) => s.createFolder);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState<DrawnSidequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setLink(null);
    }
  }, [visible]);

  const taken = new Set(folders.map((f) => f.sidequestId).filter(Boolean));
  const options = quests.filter((q) => LINKABLE.has(q.status) && !taken.has(q.id)).slice(0, 12);
  const canMake = title.trim().length > 0 || !!link;

  const make = async () => {
    if (!canMake || busy) {
      feedback('formError');
      return;
    }
    setBusy(true);
    feedback('saveForLater');
    const f = await createFolder({ title, sidequestId: link?.id });
    setBusy(false);
    onCreated(f);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="New folder">
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={link ? link.activityText : 'Sunday market, Rooftop night…'}
        placeholderTextColor={color.ink3}
        style={styles.input}
        autoFocus
        maxLength={60}
        returnKeyType="done"
        onSubmitEditing={() => void make()}
        accessibilityLabel="Folder name"
      />
      {options.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Text variant="callout">Link it to a quest (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} keyboardShouldPersistTaps="handled">
            {options.map((q) => {
              const on = link?.id === q.id;
              return (
                <Pressable
                  key={q.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Link to ${q.activityText}`}
                  onPress={() => {
                    feedback('chipSelect');
                    setLink(on ? null : q);
                  }}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text variant="headline" numberOfLines={1} style={{ fontSize: 14, color: on ? color.white : color.ink, maxWidth: 200 }}>
                    {q.activityText}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={{ color: on ? 'rgba(255,255,255,0.75)' : color.ink2 }}>
                    {q.status === 'completed' ? 'Done' : 'In progress'} · {q.placeName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
      <PillButton label="Make folder" sound={null} disabled={!canMake || busy} onPress={() => void make()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: radius.thumb + 6,
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    paddingHorizontal: space.lg,
    fontSize: 17,
    color: color.ink,
  },
  chip: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 16,
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  chipOn: { backgroundColor: color.cobalt, borderColor: color.cobalt },
});
