import { View } from 'react-native';
import { PillButton, Text, color, space } from '@/theme';
import { Sheet } from '@/ui';

/* A two-button confirm on our own Sheet (Alert.alert has no buttons on web). */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  cancelLabel = 'Keep it',
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {body ? <Text variant="body" style={{ color: color.ink2 }}>{body}</Text> : null}
      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <PillButton
          label={confirmLabel}
          tone="ink"
          sound={null}
          onPress={() => {
            onClose();
            onConfirm();
          }}
        />
        <PillButton label={cancelLabel} tone="frost" sound={null} onPress={onClose} />
      </View>
    </Sheet>
  );
}
