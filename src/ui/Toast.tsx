import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { Text as RNText } from '@/theme';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { create } from 'zustand';
import { Frost, color, radius, shadow, space } from '@/theme';
import { FADE, SETTLE } from './motion';

/* Port of Bencho `toast-stack`, hung from the top edge: the newest toast
   in front, the two before it tucked behind with a sliver of each
   peeking out below, a step smaller each. Tap the stack and it fans out
   into a list; tap again (or wait) and it gathers back up. */

export type ToastTone = 'default' | 'success' | 'error';

export interface ToastOptions {
  /** an emoji or short glyph shown before the message */
  icon?: string;
  tone?: ToastTone;
  /** ms before it leaves on its own (default 2600) */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'tone' | 'duration'>> {
  id: number;
  message: string;
  icon?: string;
  leaving: boolean;
}

const SHOWN = 3;
const H = 48;
const PEEK = 9;
const GAP = 8;

interface ToastState {
  items: ToastItem[];
  push: (message: string, opts?: ToastOptions) => void;
  leave: (id: number) => void;
  remove: (id: number) => void;
}

let nextId = 1;

const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (message, opts) => {
    const item: ToastItem = {
      id: nextId++,
      message,
      icon: opts?.icon,
      tone: opts?.tone ?? 'default',
      duration: opts?.duration ?? 2600,
      leaving: false,
    };
    /* front first; anything past the stack's depth leaves at once */
    const items = [item, ...get().items];
    set({ items: items.map((t, k) => (k >= SHOWN + 1 ? { ...t, leaving: true } : t)).slice(0, SHOWN + 2) });
  },
  leave: (id) => set({ items: get().items.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }),
  remove: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

/** Transient confirmation ("Saved", "Folder created"). Needs <ToastHost/> mounted. */
export function showToast(message: string, opts?: ToastOptions): void {
  useToasts.getState().push(message, opts);
  AccessibilityInfo.announceForAccessibility(message);
}

/** Mount once near the root of a navigator; renders above its screens */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const items = useToasts((s) => s.items);
  const [open, setOpen] = useState(false);
  const live = items.filter((t) => !t.leaving);

  useEffect(() => {
    if (!live.length) setOpen(false);
  }, [live.length]);

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.sm }]}>
      {items.map((t) => {
        const k = live.indexOf(t);
        return <ToastPill key={t.id} item={t} depth={k < 0 ? 0 : k} open={open} onPress={() => setOpen((o) => !o)} />;
      })}
    </View>
  );
}

function ToastPill({ item, depth, open, onPress }: { item: ToastItem; depth: number; open: boolean; onPress: () => void }) {
  const still = useReducedMotion();
  const leave = useToasts((s) => s.leave);
  const remove = useToasts((s) => s.remove);
  const y = useSharedValue(-24);
  const scale = useSharedValue(1);
  const alpha = useSharedValue(0);

  /* its place: how far back it is and whether the stack is open */
  useEffect(() => {
    if (item.leaving) return;
    const d = Math.min(depth, SHOWN - 1);
    const hidden = depth >= SHOWN;
    const ty = open ? depth * (H + GAP) : d * PEEK;
    const ts = open ? 1 : 1 - d * 0.05;
    const ta = hidden ? 0 : 1;
    if (still) {
      y.value = ty;
      scale.value = ts;
      alpha.value = withTiming(ta, FADE);
    } else {
      y.value = withSpring(ty, SETTLE);
      scale.value = withSpring(ts, SETTLE);
      alpha.value = withTiming(ta, { duration: 220 });
    }
  }, [depth, open, item.leaving, still, y, scale, alpha]);

  /* leaving: lift and fade, then drop out of the list */
  useEffect(() => {
    if (!item.leaving) return;
    const done = () => remove(item.id);
    alpha.value = withTiming(0, { duration: 200 }, (ok) => ok && scheduleOnRN(done));
    if (!still) y.value = withTiming(y.value - 18, { duration: 220 });
  }, [item.leaving, item.id, remove, still, alpha, y]);

  /* the front one's clock; a fanned-out stack holds still while you read */
  useEffect(() => {
    if (item.leaving || open) return;
    const t = setTimeout(() => leave(item.id), item.duration + depth * 400);
    return () => clearTimeout(t);
  }, [item.leaving, item.id, item.duration, depth, open, leave]);

  const style = useAnimatedStyle(() => ({
    opacity: alpha.value,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  const front = depth === 0;
  const dot = item.tone === 'success' ? '#1F9D55' : item.tone === 'error' ? color.signal : null;

  return (
    <Animated.View
      pointerEvents={item.leaving ? 'none' : 'auto'}
      style={[styles.slot, { zIndex: 10 - depth }, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.message}
        accessibilityHint={open ? 'Collapses the notifications' : 'Shows recent notifications'}
        onPress={onPress}
      >
        <Frost intensity={50} style={[styles.pill, shadow.float]}>
          <View style={[styles.row, { opacity: front || open ? 1 : 0 }]}>
            {item.icon ? <RNText style={styles.icon}>{item.icon}</RNText> : dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
            <RNText numberOfLines={1} style={styles.msg}>
              {item.message}
            </RNText>
          </View>
        </Frost>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  slot: { position: 'absolute', top: 0, width: 280, transformOrigin: 'top' },
  pill: { height: H, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  icon: { fontSize: 17 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  msg: { flexShrink: 1, fontSize: 15, fontWeight: '500', color: color.ink, letterSpacing: -0.1 },
});
