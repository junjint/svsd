import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { FrameModal, useScreen } from './DeviceFrame';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { feedback, type FeedbackEvent } from '@/services/sound';
import { Frost, Text, color, radius, shadow, space } from '@/theme';
import { FADE, SPRING } from './motion';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** small grey line under the title */
  subtitle?: string;
  /** false → no drag-to-dismiss and no backdrop tap (default true) */
  dismissible?: boolean;
  /** sound+haptic on open; default 'sheetOpen', null for silence */
  openFeedback?: FeedbackEvent | null;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
/* the sheet runs this far past the bottom edge, so a spring overshoot
   or an upward tug never shows a gap beneath it */
const SKIRT = 60;

/** Frosted bottom sheet: springs up, drag the sheet down to dismiss */
export function Sheet({ visible, onClose, children, title, subtitle, dismissible = true, openFeedback = 'sheetOpen' }: SheetProps) {
  const still = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useScreen();
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(screenH);
  const fade = useSharedValue(0);
  const h = useRef(screenH * 0.6);
  const wasVisible = useRef(false);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const requestClose = () => closeRef.current();

  /* open / close follow `visible`; the Modal stays mounted until the
     sheet has finished leaving */
  useEffect(() => {
    if (visible) {
      if (!wasVisible.current) y.value = still ? 0 : screenH;
      setMounted(true);
      if (!wasVisible.current && openFeedback) feedback(openFeedback);
    } else if (wasVisible.current) {
      feedback('sheetClose');
      const done = () => setMounted(false);
      fade.value = withTiming(0, { duration: 220 });
      if (still) {
        y.value = 0;
        fade.value = withTiming(0, FADE, (ok) => ok && scheduleOnRN(done));
      } else {
        y.value = withTiming(h.current, { duration: 240 }, (ok) => ok && scheduleOnRN(done));
      }
    }
    wasVisible.current = visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || !mounted) return;
    if (still) {
      y.value = 0;
      fade.value = withTiming(1, FADE);
    } else {
      y.value = withSpring(0, SPRING);
      fade.value = withTiming(1, { duration: 260 });
    }
  }, [visible, mounted, still, y, fade]);

  const pan = usePanGesture({
    enabled: dismissible,
    activeOffsetY: [-10, 10],
    failOffsetX: [-14, 14],
    onUpdate: (e) => {
      'worklet';
      /* down follows the finger; up resists like a rubber band */
      y.value = e.translationY > 0 ? e.translationY : -Math.sqrt(-e.translationY) * 3;
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(requestClose);
      } else {
        y.value = withSpring(0, SPRING);
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: still ? fade.value : 1,
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;

  return (
    <FrameModal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => { if (dismissible) requestClose(); }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }, scrimStyle]}>
          <Pressable
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
            disabled={!dismissible}
            onPress={requestClose}
          />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none" style={styles.dock}>
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            onLayout={(e) => (h.current = e.nativeEvent.layout.height)}
            style={[styles.sheet, sheetStyle]}
          >
            <Frost intensity={60} style={[styles.frost, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm + SKIRT }]}>
              <View style={styles.handle} />
              {(title || subtitle) && (
                <View style={styles.head}>
                  {title && (
                    <Text variant="title" accessibilityRole="header">
                      {title}
                    </Text>
                  )}
                  {subtitle && <Text variant="callout">{subtitle}</Text>}
                </View>
              )}
              <View style={styles.body}>{children}</View>
            </Frost>
          </Animated.View>
        </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </FrameModal>
  );
}

const styles = StyleSheet.create({
  dock: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  sheet: { marginBottom: -SKIRT, maxWidth: 430, alignSelf: 'center', width: '100%', ...shadow.float },
  frost: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    backgroundColor: 'rgba(250,250,247,0.6)',
  },
  handle: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(17,17,20,0.14)', marginBottom: space.lg },
  head: { gap: space.xs, marginBottom: space.lg },
  body: { gap: space.lg },
});
