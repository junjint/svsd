import { View } from 'react-native';
import { Paper, Text, color, space } from '@/theme';

/* The Wall needs accounts + a backend (SPEC §4.5, phase P5). Until then: an honest empty state. */
export default function Wall() {
  return (
    <Paper>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md }}>
        <Text variant="display" style={{ textAlign: 'center' }}>Sidequesters</Text>
        <Text variant="callout" style={{ textAlign: 'center', color: color.ink2 }}>
          The wall of sidequests from around the world opens once accounts are live.
        </Text>
      </View>
    </Paper>
  );
}
