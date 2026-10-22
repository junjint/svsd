import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Chip } from '@/features/draw/home/Chip';
import { feedback } from '@/services/sound';
import { ACTIVITY_MAX, BANDS, KINDS, PLACE_MAX, suggestedToday } from '@/services/suggest/pool';
import { useSidequestStore } from '@/stores/sidequestStore';
import { DashRule, PillButton, Text, TornPaper, color, fonts, receiptInk, space } from '@/theme';
import type { InterestCategory, Suggestion, SuggestionBand } from '@/types';
import { Sheet, showToast } from '@/ui';

/**
 * Leave something in your city's pool: a place, a thing to do, or both.
 * It joins the Draw for everyone here with the same odds as anything else.
 * One a day; once today's is in, the sheet shows it back as a slip.
 */
export function SuggestSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const city = useSidequestStore((s) => s.location.cityLabel);
  const suggestions = useSidequestStore((s) => s.suggestions);
  const addSuggestion = useSidequestStore((s) => s.addSuggestion);

  const [place, setPlace] = useState('');
  const [band, setBand] = useState<SuggestionBand>('walk');
  const [kind, setKind] = useState<InterestCategory>('unexpected');
  const [activity, setActivity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // decided when the sheet opens, so it doesn't flip to the slip while closing
  const [today, setToday] = useState<Suggestion | undefined>();

  useEffect(() => {
    if (!visible) return;
    setPlace('');
    setBand('walk');
    setKind('unexpected');
    setActivity('');
    setError(null);
    setToday(suggestedToday(suggestions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fail = (msg: string) => {
    setError(msg);
    feedback('formError');
  };

  const submit = async () => {
    const p = place.trim();
    const a = activity.trim();
    if (!p && !a) return fail('Give us a place, a thing to do, or both');
    if (p && p.length < 2) return fail('That place name is a bit short');
    if (a.length > ACTIVITY_MAX) return fail(`Keep it under ${ACTIVITY_MAX} characters`);
    setBusy(true);
    const res = await addSuggestion({ placeName: p || undefined, category: kind, band, activityText: a || undefined });
    setBusy(false);
    if (!res.ok) {
      if (res.reason === 'limit') setToday(suggestedToday(useSidequestStore.getState().suggestions));
      else fail('Give us a place, a thing to do, or both');
      return;
    }
    feedback('suggestionSent');
    showToast('In the pool. Someone might draw it today', { tone: 'success' });
    onClose();
  };

  if (today) {
    return (
      <Sheet visible={visible} onClose={onClose} title="Suggest a sidequest" subtitle="One a day. Yours for today is in.">
        <TornPaper seed={today.id} contentStyle={styles.slip}>
          <Text style={[receiptInk, styles.stamp]}>IN THE POOL · {today.cityLabel.toUpperCase()}</Text>
          <DashRule />
          {today.placeName ? <Text style={styles.slipPlace}>{today.placeName}</Text> : null}
          {today.activityText ? <Text style={styles.slipActivity}>{today.activityText}</Text> : null}
        </TornPaper>
        <Text variant="caption" style={styles.center}>
          Come back tomorrow for another
        </Text>
        <PillButton label="Done" tone="ink" sound={null} onPress={onClose} />
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Suggest a sidequest" subtitle={`Goes into the pool for ${city}. Someone's next draw might land on it.`}>
      <View style={styles.field}>
        <Text variant="label">A PLACE</Text>
        <TextInput
          value={place}
          onChangeText={(t) => {
            setPlace(t);
            setError(null);
          }}
          placeholder="Somewhere worth a detour"
          placeholderTextColor={color.ink3}
          maxLength={PLACE_MAX}
          returnKeyType="next"
          accessibilityLabel="A place"
          style={styles.input}
        />
      </View>

      {place.trim() ? (
        <>
          <View style={styles.field}>
            <Text variant="label">HOW FAR FROM YOU</Text>
            <View style={styles.chips}>
              {BANDS.map((b) => (
                <Chip key={b.id} size="sm" role="radio" label={b.label} selected={band === b.id} onPress={() => setBand(b.id)} />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text variant="label">WHAT KIND OF PLACE</Text>
            <View style={styles.chips}>
              {KINDS.map((k) => (
                <Chip key={k.id} size="sm" role="radio" label={k.label} selected={kind === k.id} onPress={() => setKind(k.id)} />
              ))}
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.field}>
        <Text variant="label">SOMETHING TO DO THERE</Text>
        <TextInput
          value={activity}
          onChangeText={(t) => {
            setActivity(t);
            setError(null);
          }}
          placeholder="One small thing"
          placeholderTextColor={color.ink3}
          maxLength={ACTIVITY_MAX + 10}
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="Something to do there"
          style={styles.input}
        />
      </View>

      <Text variant="caption" style={[styles.helper, error && styles.error]} accessibilityLiveRegion="polite">
        {error ?? 'A place, a thing to do, or both.'}
      </Text>

      <PillButton label="Add it to the pool" tone="ink" sound={null} disabled={busy} onPress={submit} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm, marginBottom: space.md },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    paddingHorizontal: space.lg,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: color.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  helper: { marginBottom: space.lg },
  error: { color: color.signal },
  slip: { paddingHorizontal: space.xl, paddingVertical: space.xl, gap: space.sm, alignItems: 'center' },
  stamp: { fontSize: 11, letterSpacing: 1.2 },
  slipPlace: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 30, color: color.ink, textAlign: 'center' },
  slipActivity: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24, color: color.ink2, textAlign: 'center' },
  center: { textAlign: 'center', marginVertical: space.md },
});
