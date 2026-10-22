import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PillButton } from '@/theme';
import { Sheet } from '@/ui';
import { RadiusPicker } from './RadiusPicker';

export interface RadiusSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** "How far will you go?" — scrub the ticks; the radius saves as you let go */
export function RadiusSheet({ visible, onClose }: RadiusSheetProps) {
  const saved = useSidequestStore((s) => s.prefs.radiusMiles);
  const city = useSidequestStore((s) => s.location.cityLabel);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const [draft, setDraft] = useState(saved);

  useEffect(() => {
    if (visible) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const commit = (mi: number) => {
    if (mi !== saved) void updatePrefs({ radiusMiles: mi });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="How far will you go?" subtitle={`Places within this distance of you in ${city}.`}>
      <RadiusPicker value={draft} onChange={setDraft} onCommit={commit} />
      <PillButton label="Done" sound={null} onPress={onClose} />
      <PillButton
        label="Look around"
        tone="frost"
        sound={null}
        onPress={() => {
          onClose();
          // let the sheet finish leaving before the map comes in
          setTimeout(() => router.push('/map'), 260);
        }}
      />
    </Sheet>
  );
}
