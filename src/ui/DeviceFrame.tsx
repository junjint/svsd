import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View, useWindowDimensions, type ModalProps } from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text, color } from '@/theme';

/** iPhone 16 Pro screen in points, as in the Forum prototype */
export const DEVICE = { width: 393, height: 852, statusBar: 54, homeIndicator: 34 } as const;
const BEZEL = 10;
/** Below this window width the web build runs full screen, like a phone */
const FRAME_MIN_WIDTH = 520;

const ScreenContext = createContext<{ width: number; height: number } | null>(null);

/**
 * The size of the phone screen: the real window on a phone, the simulated
 * iPhone inside the desktop web frame. Use instead of useWindowDimensions.
 */
export function useScreen(): { width: number; height: number } {
  const framed = useContext(ScreenContext);
  const win = useWindowDimensions();
  return framed ?? { width: Math.min(win.width, 430), height: win.height };
}

/* ── portal: modals render inside the phone, not over the whole browser ── */

type PortalApi = { set: (id: string, node: ReactNode | null) => void };
const PortalContext = createContext<PortalApi | null>(null);

function PortalHost({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, ReactNode>>({});
  const set = useCallback((id: string, node: ReactNode | null) => {
    setNodes((n) => {
      if (node === null) {
        if (!(id in n)) return n;
        const { [id]: _gone, ...rest } = n;
        return rest;
      }
      return { ...n, [id]: node };
    });
  }, []);
  const api = useMemo(() => ({ set }), [set]);
  return (
    <PortalContext.Provider value={api}>
      {children}
      {Object.entries(nodes).map(([id, node]) => (
        <View key={id} style={styles.layer}>
          {node}
        </View>
      ))}
    </PortalContext.Provider>
  );
}

/** A drop-in for React Native's Modal that stays inside the phone frame on desktop web */
export function FrameModal({ visible = true, children, ...rest }: ModalProps & { children?: ReactNode }) {
  const portal = useContext(PortalContext);
  const id = useId();
  useEffect(() => {
    if (!portal) return;
    portal.set(id, visible ? children : null);
  });
  useEffect(() => () => portal?.set(id, null), [portal, id]);
  if (portal) return null;
  return (
    <Modal visible={visible} {...rest}>
      {children}
    </Modal>
  );
}

/* ── the frame ─────────────────────────────────────────────────────── */

/**
 * On a desktop browser, shows the app inside an iPhone so the web build reads
 * as the iOS app: status bar, home indicator and the phone's safe areas. On a
 * phone, native or mobile web, the app runs full screen.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const win = useWindowDimensions();
  // `?frame=off` shows the bare app on desktop too (handy for testing gestures)
  const off = Platform.OS === 'web' && typeof location !== 'undefined' && /[?&]frame=off\b/.test(location.search);
  const framed = Platform.OS === 'web' && win.width >= FRAME_MIN_WIDTH && !off;
  if (!framed) return <View style={styles.bare}>{children}</View>;

  // shrink to fit short windows; CSS zoom keeps pointer maths right for the scratch cards
  const zoom = Math.min(1, (win.height - 32) / (DEVICE.height + BEZEL * 2));
  return (
    <View style={styles.page}>
      <View style={[styles.device, { zoom } as object]}>
        <ScreenContext.Provider value={{ width: DEVICE.width, height: DEVICE.height }}>
          <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width: DEVICE.width, height: DEVICE.height }}>
            <SafeAreaInsetsContext.Provider value={{ top: DEVICE.statusBar, bottom: DEVICE.homeIndicator, left: 0, right: 0 }}>
              <PortalHost>
                <View style={styles.screen}>{children}</View>
              </PortalHost>
              <StatusBarMock />
              <View pointerEvents="none" style={styles.homeIndicator}>
                <View style={styles.homeBar} />
              </View>
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </ScreenContext.Provider>
      </View>
    </View>
  );
}

function StatusBarMock() {
  const ink = color.ink;
  return (
    <View pointerEvents="none" style={styles.statusBar}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.island} />
      <Svg width={78} height={13} viewBox="0 0 78 13">
        <Rect x={0} y={8} width={3} height={4} rx={1} fill={ink} />
        <Rect x={5} y={6} width={3} height={6} rx={1} fill={ink} />
        <Rect x={10} y={3.5} width={3} height={8.5} rx={1} fill={ink} />
        <Rect x={15} y={1} width={3} height={11} rx={1} fill={ink} />
        <Path d="M30.6 5.1a9 9 0 0 1 12.8 0" stroke={ink} strokeWidth={1.9} strokeLinecap="round" fill="none" />
        <Path d="M32.9 7.5a5.8 5.8 0 0 1 8.2 0" stroke={ink} strokeWidth={1.9} strokeLinecap="round" fill="none" />
        <Path d="M35.3 9.9a2.4 2.4 0 0 1 3.4 0L37 11.6z" fill={ink} stroke={ink} strokeWidth={0.8} strokeLinejoin="round" />
        <Rect x={51.5} y={0.5} width={23} height={12} rx={3.5} stroke={ink} strokeOpacity={0.4} fill="none" />
        <Rect x={53} y={2} width={20} height={9} rx={2} fill={ink} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bare: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: color.paper, overflow: 'hidden' },
  page: { flex: 1, backgroundColor: '#E8E6E2', alignItems: 'center', justifyContent: 'center' },
  device: {
    width: DEVICE.width,
    height: DEVICE.height,
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: color.paper,
    borderWidth: BEZEL,
    borderColor: '#111',
    boxSizing: 'content-box',
    boxShadow: '0 30px 80px rgba(21,16,14,0.25)',
  } as object,
  screen: { flex: 1 },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: DEVICE.statusBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 48,
    paddingRight: 26,
    paddingTop: 6,
    zIndex: 2000,
  },
  time: { fontSize: 17, fontWeight: '600', color: color.ink, letterSpacing: -0.2 },
  island: { position: 'absolute', left: (DEVICE.width - 124) / 2, top: 11, width: 124, height: 36, borderRadius: 18, backgroundColor: '#000' },
  homeIndicator: { position: 'absolute', left: 0, right: 0, bottom: 0, height: DEVICE.homeIndicator, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, zIndex: 2000 },
  homeBar: { width: 134, height: 5, borderRadius: 100, backgroundColor: color.ink },
});
