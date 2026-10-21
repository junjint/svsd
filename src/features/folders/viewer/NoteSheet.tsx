import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { feedback } from '@/services/sound';
import { PillButton, Text, color, radius, space } from '@/theme';
import type { Mood, QuestFolder } from '@/types';
import { Sheet } from '@/ui';

const MOODS: { id: Mood; label: string; glyph: string }[] = [
  { id: 'curious', label: 'Curious', glyph: '◔' },
  { id: 'calm', label: 'Calm', glyph: '〰︎' },
  { id: 'energized', label: 'Buzzing', glyph: '⚡︎' },
  { id: 'inspired', label: 'Inspired', glyph: '✧' },
  { id: 'surprised', label: 'Surprised', glyph: '!' },
  { id: 'reflective', label: 'Reflective', glyph: '☾' },
];

export function moodLabel(m?: Mood) {
  return MOODS.find((x) => x.id === m)?.label;
}

/** Title, a note, a mood and a 1–5 rating — the StoryChapter fields */
export function NoteSheet({
  folder,
  visible,
  onClose,
  onSave,
}: {
  folder: QuestFolder;
  visible: boolean;
  onClose: () => void;
  onSave: (patch: Partial<QuestFolder>) => void;
}) {
  const [title, setTitle] = useState(folder.title);
  const [note, setNote] = useState(folder.note ?? '');
  const [mood, setMood] = useState<Mood | undefined>(folder.mood);
  const [rating, setRating] = useState<number | undefined>(folder.rating);

  useEffect(() => {
    if (!visible) return;
    setTitle(folder.title);
    setNote(folder.note ?? '');
    setMood(folder.mood);
    setRating(folder.rating);
  }, [visible, folder]);

  return (
    <Sheet visible={visible} onClose={onClose} title="About this one">
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={[styles.input, { height: 48 }]}
        maxLength={60}
        accessibilityLabel="Folder title"
        placeholder="Title"
        placeholderTextColor={color.ink3}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        style={[styles.input, { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }]}
        multiline
        maxLength={500}
        placeholder="What happened? Who was there?"
        placeholderTextColor={color.ink3}
        accessibilityLabel="Note"
      />
      <View style={{ gap: space.sm }}>
        <Text variant="callout">Mood</Text>
        <View style={styles.wrap}>
          {MOODS.map((m) => {
            const on = mood === m.id;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
                onPress={() => {
                  feedback('chipSelect');
                  setMood(on ? undefined : m.id);
                }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text variant="callout" style={{ color: on ? color.white : color.ink }}>
                  {m.glyph} {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="callout">Rating</Text>
        <View style={{ flexDirection: 'row' }} accessibilityRole="adjustable" accessibilityLabel={`Rating ${rating ?? 0} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
              onPress={() => {
                feedback('partyStep');
                setRating(rating === n ? undefined : n);
              }}
              style={styles.star}
            >
              <Text style={{ fontSize: 24, color: (rating ?? 0) >= n ? color.cobalt : color.line }}>★</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <PillButton
        label="Save"
        sound={null}
        onPress={() => {
          onSave({ title: title.trim() || folder.title, note: note.trim() || undefined, mood, rating });
          onClose();
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: color.ink,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: color.paper, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line, justifyContent: 'center' },
  chipOn: { backgroundColor: color.cobalt, borderColor: color.cobalt },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
