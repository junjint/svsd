import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { ConfettiBurst } from '@/features/reveal';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Close } from '@/features/folders/icons';
import { Decor, GlassIconButton, Paper, PillButton, Text, space } from '@/theme';
import { Sheet, showToast, takeNewSidequest, useScreen, useTabBarSpace } from '@/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCarousel } from './home/BadgeCarousel';
import { CityLine } from './home/CityLine';
import { EmptyState } from './home/EmptyState';
import { Header } from './home/Header';
import { PartyControl } from './home/PartyControl';
import { QuestTypeChips } from './home/QuestTypeChips';
import { RadiusSheet } from './home/locationSeam';
import { PrinterStage, type PrinterStageHandle } from './printer/PrinterStage';
import { ReceiptActions } from './printer/ReceiptActions';

/** the New sidequest pill's height, so the badges stop short of it */
const CTA_H = 52;
const PRINTED_PHASES = new Set(['shuffling', 'place', 'activity', 'result']);
/* one celebration per draw, even if a reprint lands on it again */
const celebrated = new Set<string>();

/**
 * Home = the Draw (SPEC §3.1), as a receipt printer. One CTA: New sidequest,
 * which opens a sheet of settings (type, solo or with others) ending in Print.
 * The sidequest feeds out of the slot on a receipt; under it, reprint a line,
 * slide to go, save it, or tear it off.
 */
export function DrawScreen() {
  const { demoPrint } = useLocalSearchParams<{ demoPrint?: string }>();
  const handledDemo = useRef<string | undefined>(undefined);
  const draw = useSidequestStore((s) => s.draw);
  const location = useSidequestStore((s) => s.location);
  const startDraw = useSidequestStore((s) => s.startDraw);
  const setPhase = useSidequestStore((s) => s.setPhase);
  const discardDraw = useSidequestStore((s) => s.discardDraw);
  const rerollPlace = useSidequestStore((s) => s.rerollPlace);
  const rerollActivity = useSidequestStore((s) => s.rerollActivity);
  const alwaysSkip = useSidequestStore((s) => s.prefs.alwaysSkipReveals);
  const printer = useRef<PrinterStageHandle>(null);
  const busy = useRef(false);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  /* the idle note prints on arrival and tears off when a sidequest prints */
  const [idleOut, setIdleOut] = useState(true);
  const { width } = useScreen();
  const tabSpace = useTabBarSpace();
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const navigation = useNavigation();

  const printerW = Math.round(Math.min(width - 56, 320));
  // idle, the printer sits under the arch's curve, inside its legs
  const archW = width - space.md * 2;
  const archTop = Math.round(((archW * 542) / 900) * 0.42);

  const phase = draw?.phase;
  const onPaper = !!draw && PRINTED_PHASES.has(draw.phase);
  const empty = phase === 'empty' && !printing;
  // once the idle note has torn away, the arch fades and the printer rises into its place
  const still = useReducedMotion();
  const raised = useSharedValue(0);
  const up = onPaper || (printing && !idleOut);
  useEffect(() => {
    raised.value = still ? (up ? 1 : 0) : withTiming(up ? 1 : 0, { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [up, still, raised]);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -(archTop - space.sm) * raised.value }] }));
  const ctaShown = !onPaper && !printing && !setupOpen;
  const cta = useSharedValue(1);
  useEffect(() => {
    cta.value = withTiming(ctaShown ? 1 : 0, { duration: ctaShown ? 220 : 140 });
  }, [ctaShown, cta]);
  const ctaStyle = useAnimatedStyle(() => ({ opacity: cta.value }));
  const fadeWithArch = useAnimatedStyle(() => ({ opacity: 1 - raised.value }));
  const archStyle = useAnimatedStyle(() => ({ opacity: 1 - raised.value, transform: [{ translateY: -12 * raised.value }] }));

  const print = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    feedback('drawPress');
    setPrinted(false);
    setPrinting(true);
    try {
      await printer.current?.tear();
      setIdleOut(false);
      discardDraw();
      const session = await startDraw();
      if (session.phase !== 'empty') setPhase('result');
      else setPrinting(false);
    } finally {
      busy.current = false;
    }
  }, [discardDraw, startDraw, setPhase]);

  useEffect(() => {
    if (!demoPrint || handledDemo.current === demoPrint) return;
    handledDemo.current = demoPrint;
    setSetupOpen(false);
    void print();
  }, [demoPrint, print]);

  /* let the sheet finish leaving so the printer is in view when it starts */
  const printFromSheet = () => {
    setSetupOpen(false);
    setTimeout(() => void print(), 260);
  };

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
      setIdleOut(true);
    } finally {
      busy.current = false;
    }
  };

  // a draw that ended elsewhere (Go, Save, reset) leaves the idle note out again
  useEffect(() => {
    if (!draw && !busy.current) {
      setPrinted(false);
      setPrinting(false);
      setIdleOut(true);
    }
  }, [draw]);

  // a receipt on the printer is a focused moment: no tab bar while it's out
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: onPaper ? { display: 'none' } : undefined });
  }, [navigation, onPaper]);
  useEffect(() => () => navigation.setOptions({ tabBarStyle: undefined }), [navigation]);

  // every new sidequest starts with no type picked (= Random); the user narrows it if they want
  useEffect(() => {
    if (setupOpen && useSidequestStore.getState().prefs.questType !== 'random') void useSidequestStore.getState().updatePrefs({ questType: 'random' });
  }, [setupOpen]);

  // the tab bar's + means "new sidequest": it lands here with the settings sheet open
  const canStart = useRef(false);
  useEffect(() => { canStart.current = !onPaper && !printing && !empty; }, [onPaper, printing, empty]);
  useEffect(() => {
    if (takeNewSidequest() && canStart.current) setSetupOpen(true);
    const on = navigation.addListener as unknown as (e: 'tabPress', cb: () => void) => () => void;
    return on('tabPress', () => {
      if (takeNewSidequest() && canStart.current) setSetupOpen(true);
    });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <Paper>
        {/* one fixed page, never scrolled: the header and printer hold still,
            the controls live in a dock at the bottom, so nothing above the
            printer changes size when a print starts */}
        <View style={styles.page}>
          <Header minimal={onPaper} />
          <CityLine onOpen={() => setRadiusOpen(true)} />

          <View style={[styles.printerArea, { paddingTop: archTop }]}>
            {/* chrome framing: a wire arch stands over the idle printer like a doorway */}
            <Animated.View style={[styles.arch, archStyle]} pointerEvents="none">
              <Decor name="archWire" width={archW} />
            </Animated.View>
            {/* while printing, the printer glides up into the arch's place to make room for the paper */}
            <Animated.View style={[{ opacity: empty ? 0.25 : 1 }, liftStyle]}>
              <PrinterStage
                ref={printer}
                width={printerW}
                draw={onPaper ? draw : null}
                idle={idleOut && !onPaper && !empty}
                from={location.coords}
                cityLabel={location.cityLabel}
                instant={alwaysSkip}
                disabled={printing || onPaper || empty}
                onPress={() => setSetupOpen(true)}
                onPrinted={onPrinted}
              />
            </Animated.View>
            {empty && (
              <View style={styles.emptyWrap}>
                <EmptyState onRetry={() => void print()} />
              </View>
            )}
          </View>

          {/* earned badges drift past in the room above the button; they fade with the arch */}
          <Animated.View style={[styles.badges, { marginBottom: tabSpace + space.lg + CTA_H }, fadeWithArch]} pointerEvents="none">
            {!empty && <BadgeCarousel />}
          </Animated.View>
        </View>

        <View style={[styles.dock, { bottom: onPaper ? bottomInset + space.lg : tabSpace + space.lg }]} pointerEvents="box-none">
          {printing && !onPaper && (
            <Animated.View entering={FadeIn} exiting={FadeOut.duration(120)} style={styles.hintWrap} pointerEvents="none">
              <Text variant="caption" style={styles.hint}>
                Printing…
              </Text>
            </Animated.View>
          )}
          {onPaper && draw && printed && (
            <ReceiptActions draw={draw} width={Math.min(width - 40, 360)} onReprint={(s) => void reprint(s)} />
          )}
          {/* stays mounted and in place: it only fades (an exit animation lifted it out of
              the row, so it shrank to the left as it went). Hidden under the sheet, or it
              ghosts through the sheet's glass */}
          {!onPaper && (
            <Animated.View style={[styles.ctaWrap, ctaStyle]} pointerEvents={ctaShown ? 'auto' : 'none'}>
              <PillButton label="New sidequest" disabled={empty} onPress={() => setSetupOpen(true)} style={styles.cta} sound={null} />
            </Animated.View>
          )}
        </View>
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
      <Sheet visible={setupOpen} onClose={() => setSetupOpen(false)} title="New sidequest">
        {/* the chips carry their own gutter for the home screen; the sheet already has one */}
        <View style={styles.sheetChips}>
          {setupOpen && <QuestTypeChips />}
        </View>
        <PartyControl />
        <PillButton label="Print a sidequest" onPress={printFromSheet} sound={null} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: 'absolute', right: space.lg, zIndex: 10 },
  page: { flex: 1, overflow: 'hidden' },
  badges: { flex: 1, justifyContent: 'center' },
  dock: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: space.md },
  hintWrap: { position: 'absolute', bottom: '100%', left: 0, right: 0 },
  printerArea: { alignItems: 'center' },
  arch: { position: 'absolute', top: space.xs, alignSelf: 'center' },
  hint: { textAlign: 'center', marginBottom: space.md },
  emptyWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ctaWrap: { alignSelf: 'stretch' },
  cta: { marginHorizontal: space.xl },
  sheetChips: { marginHorizontal: -20 },
});
