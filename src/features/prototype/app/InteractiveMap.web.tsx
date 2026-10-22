import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { START, quests, streets, destinationById, type Point } from "./data";
import { currentPath, type AppState } from "./model";
import { walkingRoute } from "./geo";
import { mapBlocks, mapRoadLabels } from "./mapScene";

/** Renderer boundary: swap this component for MapKit JS without changing journey state. */
export interface MapHandle {
  recenter: () => void;
  overview: () => void;
  zoomBy: (amount: number) => void;
}
const coords = (p: Point): Leaflet.LatLngTuple => [p[0], p[1]];
const animateCamera = () =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const InteractiveMap = forwardRef<
  MapHandle,
  { state: AppState; onQuest: (id: string) => void }
>(function InteractiveMap({ state, onQuest }, ref) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    api = useRef<typeof Leaflet | null>(null);
  const layers = useRef<Leaflet.LayerGroup | null>(null),
    user = useRef<Leaflet.Marker | null>(null),
    position = useRef(state.position),
    path = useRef<Point[]>([]);
  const [ready, setReady] = useState(0);
  const j = state.journey;
  const route = currentPath(state);
  useEffect(() => {
    position.current = state.position;
    path.current = route;
  }, [state.position, route]);
  useImperativeHandle(
    ref,
    () => ({
      recenter: () =>
        map.current?.flyTo(coords(position.current), 17, {
          duration: 0.65,
          animate: animateCamera(),
        }),
      overview: () => {
        if (path.current.length)
          map.current?.flyToBounds(path.current.map(coords), {
            paddingTopLeft: [35, 105],
            paddingBottomRight: [35, 205],
            maxZoom: 17,
            animate: animateCamera(),
            duration: 0.7,
          });
      },
      zoomBy: (amount) => {
        const m = map.current;
        if (!m) return;
        m.flyTo(
          m.getCenter(),
          Math.max(
            m.getMinZoom(),
            Math.min(m.getMaxZoom(), m.getZoom() + amount),
          ),
          { duration: 0.4, animate: animateCamera() },
        );
      },
    }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    import("leaflet").then((L) => {
      if (cancelled || !element.current) return;
      api.current = L;
      const m = L.map(element.current, {
        center: [START[0] - 0.0006, START[1] - 0.001],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        // Leaflet's CSS zoom uses an untracked WebKit fallback timeout. A rapid
        // tab change can fire it after remove(). Tracked flyTo frames are canceled safely.
        zoomAnimation: false,
        minZoom: 14,
        maxZoom: 19,
        scrollWheelZoom: true,
        maxBounds: [
          [42.265, -83.765],
          [42.297, -83.723],
        ],
        maxBoundsViscosity: 0.7,
      });
      map.current = m;
      m.createPane("demo-base");
      m.getPane("demo-base")!.style.zIndex = "100";
      for (const block of mapBlocks) {
        L.rectangle(block.bounds.map(coords) as Leaflet.LatLngBoundsLiteral, {
          pane: "demo-base",
          stroke: false,
          interactive: false,
          fillColor: block.green ? "#d6e4c3" : "#eae7df",
          fillOpacity: 1,
        }).addTo(m);
      }
      // A quiet geographic stage, rather than a detailed live tile map.
      for (const road of streets) {
        L.polyline(road.points.map(coords), {
          pane: "demo-base",
          color: "#d9d6ce",
          weight: road.name === "Campus walk" ? 5 : 19,
          opacity: 1,
          interactive: false,
        }).addTo(m);
        L.polyline(road.points.map(coords), {
          pane: "demo-base",
          color: "#fffefa",
          weight: road.name === "Campus walk" ? 3 : 17,
          opacity: 1,
          interactive: false,
        }).addTo(m);
      }
      for (const label of mapRoadLabels) {
        L.marker(coords(label.point), {
          pane: "demo-base",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: `sq-road-label ${label.vertical ? "vertical" : ""}`,
            html: `<span>${label.name}</span>`,
            iconSize: [110, 20],
            iconAnchor: [55, 10],
          }),
        }).addTo(m);
      }
      layers.current = L.layerGroup().addTo(m);
      user.current = L.marker(coords(START), {
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: "sq-user-marker",
          html: "<span></span>",
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(m);
      resize = new ResizeObserver(() => m.invalidateSize());
      resize.observe(element.current);
      setReady((n) => n + 1);
    });
    return () => {
      cancelled = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const L = api.current,
      m = map.current,
      group = layers.current;
    if (!ready || !L || !m || !group) return;
    group.clearLayers();
    const active = !!j.activeQuestId;
    if (active)
      L.polyline(
        walkingRoute(
          j.originalStart,
          destinationById(j.destinationId).position,
        ).map(coords),
        { color: "#8fa8bb", weight: 3, dashArray: "3 8", opacity: 0.45 },
      ).addTo(group);
    L.polyline(route.map(coords), {
      color: "#fff",
      weight: 9,
      opacity: 0.9,
    }).addTo(group);
    const line = L.polyline(route.map(coords), {
      color: "#087dff",
      weight: 6,
      lineCap: "round",
      lineJoin: "round",
      className: "sq-route-line",
    }).addTo(group);
    const svg = line.getElement();
    svg?.setAttribute("pathLength", "1");
    const destination = destinationById(
      j.phase === "idle" ? state.selectedDestination : j.destinationId,
    );
    L.marker(coords(destination.position), {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "sq-destination-marker",
        html: "<span>⚑</span>",
        iconSize: [26, 32],
        iconAnchor: [13, 30],
      }),
      title: destination.name,
    })
      .addTo(group)
      .bindTooltip(destination.name, { direction: "top" });
    for (const q of quests) {
      if (
        state.mode === "guided" &&
        q.id !== j.activeQuestId &&
        q.id !== j.suggestionId
      )
        continue;
      const marker = L.marker(coords(q.position), {
        title: q.name,
        keyboard: true,
        icon: L.divIcon({
          className: `sq-quest-marker ${q.id === j.activeQuestId ? "selected" : ""} ${!state.prefs.enabled ? "muted" : ""}`,
          html: `<span>${q.image === "garden" ? "❋" : q.image === "coffee" ? "⌁" : "✧"}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(group);
      marker.getElement()?.setAttribute("aria-label", q.name);
      marker.on("click", () => onQuest(q.id));
      marker.bindTooltip(q.name, { direction: "top" });
    }
    // Fit only when a leg changes. Panning remains fully under the person's control.
    m.flyToBounds(route.map(coords), {
      paddingTopLeft: [45, 120],
      paddingBottomRight: [45, 215],
      maxZoom: 17,
      animate: animateCamera(),
      duration: 0.8,
    });
    // Position ticks update the user marker below, not the route geometry or camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    j.legStart,
    j.activeQuestId,
    j.suggestionId,
    j.destinationId,
    state.selectedDestination,
    state.prefs.enabled,
    state.mode,
    onQuest,
  ]);
  useEffect(() => {
    user.current?.setLatLng(coords(state.position));
  }, [state.position]);
  return (
    <div className="sq-map-surface">
      <div
        ref={element}
        className="sq-leaflet-map"
        aria-label="Interactive Ann Arbor demo map"
      />
      {!ready && <div className="sq-map-loading">Finding your way…</div>}
      <div className="sq-map-credit">
        Simplified demo map · not live directions
      </div>
    </div>
  );
});
