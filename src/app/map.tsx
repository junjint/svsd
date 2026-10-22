import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { Chevron } from '@/features/folders/icons';
import { formatRadius } from '@/features/location/radiusScale';
import { MapNote, PinCard, TargetCard } from '@/features/map/MapCards';
import { MapScene } from '@/features/map/MapScene';
import { buildTerrain, project, routeBetween } from '@/features/map/terrain';
import { useMapPlaces } from '@/features/map/useMapPlaces';
import { milesToMeters } from '@/services/draw/rules';
import { openWalkingDirections } from '@/services/navigation/maps';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Text, color, fonts, space, type as typeScale } from '@/theme';
import { offsetCoordinates } from '@/utils/geo';

/* Web swaps stack screens with a hard cut, so the page brings its own
   entrance: it rises and fades in. iOS keeps its native slide */
const PAGE_IN = Platform.OS === 'web' ? FadeInDown.duration(420).easing(Easing.bezier(0.22, 1, 0.36, 1)) : undefined;

/** How long the dot spends "finding you" before the route draws */
const LOCATE_MS = 2600;
const JITTER_M = 60;

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return ((h ^= h >>> 13) >>> 0) / 4294967296;
  };
}

/**
 * The city as a paper model. With a sidequest it navigates: finds you,
 * draws the walk there, and hands off to a real maps app. Without one
 * it's for looking around: a random handful of identical pins, each one
 * a line to read. No list, no search; the Draw still decides.
 */
export default function MapScreen() {
  const { sidequestId } = useLocalSearchParams<{ sidequestId?: string }>();
  const quest = useSidequestStore((s) => (sidequestId ? s.quests.find((q) => q.id === sidequestId) : undefined));
  const location = useSidequestStore((s) => s.location);
  const radiusMiles = useSidequestStore((s) => s.prefs.radiusMiles);
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const [recentreKey, setRecentreKey] = useState(0);

  const navigating = !!quest;
  const browseMeters = milesToMeters(radiusMiles);
  const { pins, loading } = useMapPlaces({ from: location.coords, radiusMeters: browseMeters, quest });

  // the board fits what's on it: the walk there, or the farthest pin in this handful
  const farthest = pins.reduce((m, p) => Math.max(m, p.distanceMeters), 0);
  const boardMeters = Math.round(quest ? Math.min(8000, Math.max(800, farthest * 2.2)) : Math.min(browseMeters, Math.max(600, farthest * 1.15)));

  const terrain = useMemo(
    () => buildTerrain(location.cityLabel, location.coords, boardMeters),
    [location.cityLabel, location.coords, boardMeters]
  );

  // the phone's fix wobbles a little, so the dot lands near the centre, not on it
  const gps = useMemo(() => {
    const r = seeded(`${location.cityLabel}:${sidequestId ?? 'look'}`);
    const a = r() * Math.PI * 2;
    const d = r() * JITTER_M;
    return project(terrain, offsetCoordinates(location.coords, Math.cos(a) * d, Math.sin(a) * d));
  }, [terrain, location.cityLabel, location.coords, sidequestId]);

  const scenePins = useMemo(() => pins.map((p) => ({ id: p.id, point: project(terrain, p.coordinates) })), [pins, terrain]);
  const target = navigating ? scenePins[0] : undefined;
  const route = useMemo(() => (target ? routeBetween(terrain, gps, target.point) : undefined), [terrain, gps, target]);
  const selected = navigating ? undefined : pins.find((p) => p.id === selectedId);

  useEffect(() => {
    const t = setTimeout(() => setLocating(false), LOCATE_MS);
    return () => clearTimeout(t);
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/draw'));
  const cardIn = still ? undefined : FadeInDown.springify().damping(18).stiffness(180);
  const cardOut = still ? undefined : FadeOut.duration(140);

  return (
    <Animated.View style={styles.page} entering={PAGE_IN}>
      <MapScene
        terrain={terrain}
        pins={scenePins}
        gps={gps}
        target={target}
        route={route}
        selectedId={navigating ? (target?.id ?? null) : selectedId}
        onSelect={(id) => !navigating && setSelectedId(id)}
        locating={locating}
        reducedMotion={still}
        recentreKey={recentreKey}
      />

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
        <GlassIconButton label="Back" onPress={back} size={44}>
          <Chevron />
        </GlassIconButton>
        <View style={styles.heading} pointerEvents="none">
          {navigating ? (
            <>
              <Text style={typeScale.label}>{location.cityLabel.toUpperCase()}</Text>
              {locating && (
                <Animated.View entering={still ? undefined : FadeIn} exiting={still ? undefined : FadeOut}>
                  <Text style={styles.sub}>Finding you</Text>
                </Animated.View>
              )}
            </>
          ) : (
            <>
              <Text style={typeScale.label}>LOOK AROUND</Text>
              <Text style={styles.city}>{location.cityLabel}</Text>
            </>
          )}
        </View>
        <GlassIconButton label="Recentre on you" onPress={() => setRecentreKey((k) => k + 1)} size={44}>
          <LocateGlyph />
        </GlassIconButton>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]} pointerEvents="box-none">
        {navigating && quest && pins[0] ? (
          <Animated.View entering={cardIn} key="target">
            <TargetCard pin={pins[0]} onOpenMaps={() => void openWalkingDirections(quest.coordinates, quest.placeName)} />
          </Animated.View>
        ) : selected ? (
          <Animated.View entering={cardIn} exiting={cardOut} key={selected.id}>
            <PinCard pin={selected} />
          </Animated.View>
        ) : !loading ? (
          <Animated.View entering={still ? undefined : FadeIn.delay(300)} exiting={cardOut} key="note">
            <MapNote text={pins.length ? 'Tap a pin' : `Nothing pinned within ${formatRadius(radiusMiles)}. Widen it from the home screen`} />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** A ring with a dot: where you are */
function LocateGlyph() {
  return (
    <View style={styles.locate}>
      <View style={styles.locateDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper, overflow: 'hidden' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: space.lg },
  heading: { flex: 1, alignItems: 'center', paddingTop: 4, gap: 2 },
  city: { fontFamily: fonts.serifItalic, fontSize: 22, lineHeight: 26, letterSpacing: -0.2, color: color.ink },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: color.ink2 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg },
  locate: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  locateDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: color.ink },
});
