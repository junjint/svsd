import { StyleSheet, View } from 'react-native';
import { formatMiles, travelLabel } from '@/services/draw/rules';
import { PillButton, Text, TornPaper, color, fonts, space } from '@/theme';
import { kindWord } from './kinds';
import type { MapPin } from './useMapPlaces';

/** Navigate: where you're headed, how far, and the hand-off to a real maps app */
export function TargetCard({ pin, onOpenMaps }: { pin: MapPin; onOpenMaps: () => void }) {
  return (
    <TornPaper seed={`map:${pin.id}`} contentStyle={styles.body}>
      <Text style={styles.name} numberOfLines={2}>
        {pin.name}
      </Text>
      <Text style={styles.meta}>
        {formatMiles(pin.distanceMeters)} · {travelLabel(pin.distanceMeters)}
      </Text>
      <PillButton label="Open in Maps" tone="frost" sound="chipSelect" onPress={onOpenMaps} style={{ marginTop: space.sm }} />
    </TornPaper>
  );
}

/** Browse: a pin's name, what kind of place, how far, and its one line. Nothing else */
export function PinCard({ pin }: { pin: MapPin }) {
  return (
    <TornPaper seed={`map:${pin.id}`} contentStyle={styles.body}>
      <Text style={styles.name} numberOfLines={2}>
        {pin.name}
      </Text>
      <Text style={styles.meta}>
        {kindWord(pin.category)} · {formatMiles(pin.distanceMeters)}
      </Text>
      {pin.line ? (
        <Text style={styles.line} numberOfLines={3}>
          {pin.line}
        </Text>
      ) : null}
      {pin.byUser && <Text style={styles.credit}>Left here by a sidequester</Text>}
    </TornPaper>
  );
}

/** The small frosted note when nothing is selected */
export function MapNote({ text }: { text: string }) {
  return (
    <View style={styles.note}>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl, paddingVertical: space.lg + 2, gap: 4 },
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28, letterSpacing: -0.3, color: color.ink },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 0.2, color: color.ink2 },
  line: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 22, color: color.ink, marginTop: space.sm },
  credit: { fontFamily: fonts.sans, fontSize: 12, color: color.ink2, marginTop: space.sm },
  note: {
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 999,
    backgroundColor: color.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    maxWidth: 320,
  },
  noteText: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18, color: color.ink2, textAlign: 'center' },
});
