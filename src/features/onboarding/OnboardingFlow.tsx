import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Logo, Paper, PillButton, Text, color, space } from '@/theme';
import type { QuestType } from '@/types';
import { SPRING } from '@/ui/motion';
import { PageDots } from './PageDots';
import { StepVibe } from './StepVibe';
import { StepWhat } from './StepWhat';
import { StepWhere } from './StepWhere';
import { StepWhy } from './StepWhy';

const STEPS = 4;

/** Four pages on one rail (SPEC §4.6): why → what → where → vibe */
export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const prefs = useSidequestStore((s) => s.prefs);
  const refreshLocation = useSidequestStore((s) => s.refreshLocation);
  const completeOnboarding = useSidequestStore((s) => s.completeOnboarding);

  const [width, setWidth] = useState(0);
  const [step, setStep] = useState(0);
  const [miles, setMiles] = useState(prefs.radiusMiles);
  const [type, setType] = useState<QuestType>(prefs.questType);
  const [ageOk, setAgeOk] = useState(false);
  const [asked, setAsked] = useState(false);
  const [busy, setBusy] = useState(false);

  /* the rail: a spring slide, or a cross-fade under Reduce Motion */
  const x = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    if (!width) return;
    if (still) {
      fade.value = 0;
      x.value = -step * width;
      fade.value = withTiming(1, { duration: 200 });
    } else {
      x.value = withSpring(-step * width, SPRING);
    }
  }, [step, width, still, x, fade]);
  const rail = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateX: x.value }] }));

  const web = Platform.OS === 'web';
  const needsAsk = step === 2 && !web && !asked;

  const next = async () => {
    if (busy) return;
    if (step < 2) return setStep(step + 1);
    if (step === 2) {
      if (needsAsk) {
        setBusy(true);
        await refreshLocation({ ask: true });
        setAsked(true);
        setBusy(false);
      } else if (web) {
        void refreshLocation();
      }
      return setStep(3);
    }
    if (!ageOk) return;
    setBusy(true);
    await completeOnboarding({ questType: type, radiusMiles: miles });
    router.replace('/draw');
  };

  const cta = step < 2 ? 'Continue' : step === 2 ? (needsAsk ? 'Allow location' : 'Continue') : 'Start drawing';

  return (
    <Paper edges={['top']}>
      <View style={styles.top}>
        {step > 0 ? (
          <GlassIconButton label="Back" onPress={() => setStep((s) => Math.max(0, s - 1))}>
            <Text style={styles.chev}>‹</Text>
          </GlassIconButton>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Logo />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.viewport} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View style={[styles.rail, { width: width * STEPS }, rail]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{ width }}
                pointerEvents={i === step ? 'auto' : 'none'}
                accessibilityElementsHidden={i !== step}
                importantForAccessibility={i === step ? 'auto' : 'no-hide-descendants'}
              >
                {i === 0 && <StepWhy width={width} />}
                {i === 1 && <StepWhat width={width} />}
                {i === 2 && <StepWhere miles={miles} onMiles={setMiles} asked={asked} />}
                {i === 3 && <StepVibe type={type} onType={setType} ageOk={ageOk} onAge={setAgeOk} />}
              </View>
            ))}
          </Animated.View>
        )}
      </View>

      <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}>
        <PageDots count={STEPS} index={step} />
        <PillButton
          label={cta}
          sound={step === 3 ? 'drawPress' : 'tabSwitch'}
          disabled={busy || (step === 3 && !ageOk)}
          onPress={() => void next()}
        />
      </View>
    </Paper>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.sm, height: 56 },
  chev: { fontSize: 26, lineHeight: 28, color: color.ink, marginTop: -2 },
  viewport: { flex: 1, overflow: 'hidden' },
  rail: { flex: 1, flexDirection: 'row' },
  foot: { paddingHorizontal: space.xl, gap: space.lg, paddingTop: space.md },
});
