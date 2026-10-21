import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useNavigation } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ConfettiBurst } from '@/features/reveal';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Close } from '@/features/folders/icons';
import { GlassIconButton, Paper, PillButton, Text, space } from '@/theme';
import { showToast, useScreen, useTabBarSpace } from '@/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityLine } from './home/CityLine';
import { EmptyState } from './home/EmptyState';
import { Header } from './home/Header';
import { PartyControl } from './home/PartyControl';
import { QuestTypeChips } from './home/QuestTypeChips';
import { RadiusSheet } from './home/locationSeam';
import { PrinterStage, type PrinterStageHandle } from './printer/PrinterStage';
import { ReceiptActions } from './printer/ReceiptActions';

const PRINTED_PHASES = new Set(['shuffling', 'place', 'activity', 'result']);
/* one celebration per draw, even if a reprint lands on it again */
const celebrated = new Set<string>();

/**
 * Home = the Draw (SPEC §3.1), as a receipt printer. One CTA: Print. The
 * sidequest feeds out of the slot on a receipt; under it, reprint a line,
 * slide to go, save it, or tear it off.
 */
export function DrawScreen() {
  const draw = useSidequestStore((s) => s.draw);
  const location = useSidequestStore((s) => s.location);
  const startDraw = useSidequestStore((s) => s.startDraw);
  const setPhase = useSidequestStore((s) => s.setPhase);
  const discardDraw = useSidequestStore((s) => s.discardDraw);
  const rerollPlace = useSidequestStore((s) => s.rerollPlace);
  const rerollActivity = useSidequestStore((s) => s.rerollActivity);
  const alwaysSkip = useSidequestStore((s) => s.prefs.alwaysSkipReveals);
  const printer = useRef<PrinterStageHandle>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const busy = useRef(false);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const { width } = useScreen();
  const tabSpace = useTabBarSpace();
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const navigation = useNavigation();

  const printerW = Math.round(Math.min(width - 56, 320));
  const phase = draw?.phase;
  const onPaper = !!draw && PRINTED_PHASES.has(draw.phase);
  const empty = phase === 'empty' && !printing;

  const print = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    feedback('drawPress');
    setPrinted(false);
    setPrinting(true);
    try {
      await printer.current?.tear();
      discardDraw();
      const session = await startDraw();
      if (session.phase !== 'empty') setPhase('result');
      else setPrinting(false);
    } finally {
      busy.current = false;
    }
  }, [discardDraw, startDraw, setPhase]);

  const onPrinted = useCallback(() => {
    setPrinting(false);
    setPrinted(true);
    feedback('placeRevealed');
    const d = useSidequestStore.getState().draw;
    if (d?.rarity === 'legendary' && !celebrated.has(d.id)) {
      celebrated.add(d.id);
      feedback('legendaryRevealed');
      setConfetti(true);
    }
  }, []);

  const reprint = async (stage: 'place' | 'activity') => {
    if (busy.current) return;
    busy.current = true;
    try {
      await printer.current?.tear();
      const ok = stage === 'place' ? await rerollPlace() : rerollActivity();
      if (!ok) {
        printer.current?.restore();
        showToast(stage === 'place' ? 'No other places fit nearby' : "That's every activity for this place");
        return;
      }
      setPrinted(false);
      setPrinting(true);
      setPhase('result');
      scroll.current?.scrollTo({ y: 0, animated: true });
    } finally {
      busy.current = false;
    }
  };

  const tearOff = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await printer.current?.tear();
      discardDraw();
      setPrinted(false);
      scroll.current?.scrollTo({ y: 0, animated: true });
    } finally {
      busy.current = false;
    }
  };

  // a draw that ended elsewhere (Go, Save, reset) leaves the printer empty
  useEffect(() => {
    if (!draw) {
      setPrinted(false);
      setPrinting(false);
    }
  }, [draw]);

  // a receipt on the printer is a focused moment: no tab bar while it's out
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: onPaper ? { display: 'none' } : undefined });
  }, [navigation, onPaper]);
  useEffect(() => () => navigation.setOptions({ tabBarStyle: undefined }), [navigation]);

  return (
    <View style={styles.root}>
      <Paper>
        <ScrollView
          ref={scroll}
          scrollEnabled={onPaper && !printing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: onPaper ? bottomInset + space.xl : tabSpace }]}
        >
          <Header minimal={onPaper} />
          <CityLine onOpen={() => setRadiusOpen(true)} />

          {/* the printer sits in the same spot whether idle or printing: it never moves */}
          <View style={styles.printerArea}>
            <View style={{ opacity: empty ? 0.25 : 1 }}>
              <PrinterStage
                ref={printer}
                width={printerW}
                draw={onPaper ? draw : null}
                from={location.coords}
                cityLabel={location.cityLabel}
                instant={alwaysSkip}
                disabled={printing || onPaper || empty}
                onPress={() => void print()}
                onPrinted={onPrinted}
              />
            </View>
            {!onPaper && !empty && (
              <Animated.View entering={FadeIn} exiting={FadeOut.duration(120)}>
                <Text variant="caption" style={styles.hint}>
                  {printing ? 'Printing…' : 'Tap the printer or hit print'}
                </Text>
              </Animated.View>
            )}
            {empty && (
              <View style={styles.emptyWrap}>
                <EmptyState onRetry={() => void print()} />
              </View>
            )}
          </View>

          {onPaper && draw && printed && (
            <ReceiptActions draw={draw} width={Math.min(width - 40, 360)} onReprint={(s) => void reprint(s)} onTearOff={() => void tearOff()} />
          )}

          {!onPaper && <View style={{ flex: 1 }} />}
          {!onPaper && (
            <Animated.View entering={FadeIn} exiting={FadeOut.duration(120)} style={styles.controls}>
              <QuestTypeChips />
              <PartyControl />
              <PillButton label={printing ? 'Printing…' : 'Print a sidequest'} disabled={printing || empty} onPress={() => void print()} style={styles.cta} sound={null} />
            </Animated.View>
          )}
        </ScrollView>
      </Paper>

      {/* while a receipt is out, a way back that doesn't depend on scrolling */}
      {onPaper && (
        <Animated.View entering={FadeIn.delay(200)} exiting={FadeOut.duration(120)} style={[styles.close, { top: topInset + space.sm }]}>
          <GlassIconButton label="Close receipt" onPress={() => void tearOff()} size={44}>
            <Close size={14} />
          </GlassIconButton>
        </Animated.View>
      )}
      <ConfettiBurst fire={confetti} onDone={() => setConfetti(false)} />
      <RadiusSheet visible={radiusOpen} onClose={() => setRadiusOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: 'absolute', right: space.lg, zIndex: 10 },
  content: { flexGrow: 1 },
  printerArea: { alignItems: 'center', paddingTop: space.xxl },
  hint: { textAlign: 'center', marginTop: space.md },
  emptyWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  controls: { gap: space.md, paddingBottom: space.lg },
  cta: { marginHorizontal: space.xl },
});
