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
  const [ready, setReady] = useState(0),
    [offline, setOffline] = useState(false);
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
      // Offline vector graph stays under the live basemap. Both use the same lat/lon projection.
      for (const road of streets) {
        L.polyline(road.points.map(coords), {
          pane: "demo-base",
          color: "#fffef9",
          weight: 14,
          opacity: 1,
        }).addTo(m);
        L.polyline(road.points.map(coords), {
          pane: "demo-base",
          color: "#dedcd3",
          weight: 1,
          opacity: 0.7,
        }).addTo(m);
        const point = road.points[Math.floor(road.points.length / 2)];
        L.marker(coords(point), {
          pane: "demo-base",
          interactive: false,
          icon: L.divIcon({
            className: "sq-road-label",
            html: road.name,
            iconSize: [110, 20],
            iconAnchor: [55, 10],
          }),
        }).addTo(m);
      }
      const tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19, crossOrigin: true },
      ).addTo(m);
      let errors = 0;
      tiles.on("tileerror", () => {
        if (++errors >= 3 && !cancelled) {
          m.removeLayer(tiles);
          setOffline(true);
        }
      });
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
        { color: "#969c9c", weight: 3, dashArray: "4 8", opacity: 0.65 },
      ).addTo(group);
    L.polyline(route.map(coords), {
      color: "#fff",
      weight: 9,
      opacity: 0.9,
    }).addTo(group);
    const line = L.polyline(route.map(coords), {
      color: active ? "#9a7448" : "#6d8eae",
      weight: 5,
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
    j.destinationId,
    state.selectedDestination,
    state.prefs.enabled,
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
        {offline ? (
          "Offline · demo street map"
        ) : (
          <>
            ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap contributors
            </a>
          </>
        )}
      </div>
    </div>
  );
});
