import { Icon } from "./Icons";
import type { Discovery, Scene } from "./story";

const original =
  "M365 678 L365 570 Q365 550 385 550 L417 550 Q435 550 435 530 L435 260 Q435 244 416 244 L388 244";
const detour =
  "M365 678 L365 570 Q365 550 345 550 L215 550 Q195 550 195 530 L195 440";
const onward =
  "M195 440 L195 380 Q195 362 215 362 L415 362 Q435 362 435 342 L435 260 Q435 244 416 244 L388 244";
const horizontal = [135, 362, 550, 735];
const vertical = [80, 195, 365, 435, 580];
export function JourneyMap({
  scene,
  place,
}: {
  scene: Scene;
  place: Discovery;
}) {
  const rerouted = scene === "detour" || scene === "arrival";
  const returned = scene === "return";
  const position = returned
    ? [245, 362]
    : rerouted
      ? [195, scene === "arrival" ? 440 : 525]
      : [365, 645];
  return (
    <div
      className={`journey-map ${rerouted ? "is-rerouted" : ""} ${returned ? "is-returned" : ""}`}
    >
      <svg
        className="city-map"
        viewBox="0 0 640 850"
        role="img"
        aria-label={`Simulated walking map of Ann Arbor. ${rerouted ? `A detour to ${place.name}, then` : "Walking"} to Michigan Union.`}
      >
        <defs>
          <pattern
            id="map-parcels"
            width="52"
            height="65"
            patternUnits="userSpaceOnUse"
          >
            <rect x="5" y="6" width="42" height="51" rx="5" fill="#e6e5de" />
            <path d="M12 16h25v30H12z" fill="#eae9e3" />
          </pattern>
          <filter
            id="marker-shadow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".17" />
          </filter>
        </defs>
        <rect width="640" height="850" fill="#f0f0e9" />
        <rect width="640" height="850" fill="url(#map-parcels)" opacity=".7" />
        <path d="M457 382h107v147H457zM455 153h106v186H455z" fill="#dce6d2" />
        <path
          d="M473 402q55 45 70 113M470 509q40-71 78-103"
          fill="none"
          stroke="#f0f0df"
          strokeWidth="5"
        />
        <path d="M109 389h60v128h-60zM216 157h121v74H216z" fill="#e2e8d8" />
        <g stroke="#deded6" strokeWidth="31" fill="none">
          {horizontal.map((y) => (
            <path key={y} d={`M-20 ${y}H660`} />
          ))}
          {vertical.map((x) => (
            <path key={x} d={`M${x} -20V870`} />
          ))}
        </g>
        <g stroke="#fffefb" strokeWidth="24" fill="none">
          {horizontal.map((y) => (
            <path key={y} d={`M-20 ${y}H660`} />
          ))}
          {vertical.map((x) => (
            <path key={x} d={`M${x} -20V870`} />
          ))}
        </g>
        <path d="M-10 800 650 50" stroke="#deded6" strokeWidth="21" />
        <path d="M-10 800 650 50" stroke="#fffefb" strokeWidth="17" />
        <g
          fill="#abaea2"
          fontFamily="Inter_400Regular, sans-serif"
          fontSize="11"
          textAnchor="middle"
          letterSpacing=".3"
        >
          <text x="290" y="139">
            E WASHINGTON ST
          </text>
          <text x="288" y="366">
            E LIBERTY ST
          </text>
          <text x="290" y="554">
            E WILLIAM ST
          </text>
          <text x="291" y="739">
            E JEFFERSON ST
          </text>
          <text transform="translate(439 454) rotate(-90)">S STATE ST</text>
          <text transform="translate(369 450) rotate(-90)">MAYNARD ST</text>
          <text transform="translate(84 455) rotate(-90)">S DIVISION ST</text>
          <text x="512" y="466" fontSize="15" fill="#8fa184">
            The Diag
          </text>
          <text x="512" y="484" fontSize="9">
            UNIVERSITY OF MICHIGAN
          </text>
          <text x="275" y="300" fontSize="12" fill="#969b91">
            Nickels Arcade
          </text>
          <text x="275" y="665" fontSize="12" fill="#969b91">
            Ann Arbor
          </text>
        </g>
        <path d={original} className="original-route route-shadow" />
        <path d={original} className="original-route" />
        <path d={detour} className="detour-route route-shadow" pathLength="1" />
        <path
          key={rerouted ? "detour-active" : "detour-hidden"}
          d={detour}
          className="detour-route"
          pathLength="1"
        />
        <path
          key={returned ? "onward-active" : "onward-hidden"}
          d={onward}
          className="onward-route"
          pathLength="1"
        />
        <g transform="translate(388 244)" filter="url(#marker-shadow)">
          <circle r="16" fill="#faf9f5" />
          <circle r="9" fill="#788c74" />
          <path d="m-3 0 2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
        </g>
        <g className="destination-label" transform="translate(365 202)">
          <rect
            x="-67"
            y="-20"
            width="134"
            height="29"
            rx="14.5"
            fill="#fffefb"
          />
          <text
            x="0"
            y="-1"
            fontFamily="Inter_600SemiBold, sans-serif"
            fontSize="12"
            textAnchor="middle"
            fill="#505b4d"
          >
            Michigan Union
          </text>
        </g>
        <g className="quest-map-pin" transform="translate(195 440)">
          <circle
            className="quest-pin-halo"
            r="31"
            fill="#c58e74"
            opacity=".14"
          />
          <circle r="17" fill="#a96e54" stroke="#fffdf8" strokeWidth="4" />
          <path d="m0-7 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#fffaf0" />
          <g transform="translate(0 -33)">
            <rect
              x="-68"
              y="-24"
              width="136"
              height="27"
              rx="13.5"
              fill="#fffaf4"
            />
            <text
              textAnchor="middle"
              y="-6"
              fontSize="10.5"
              fontFamily="Inter_500Medium, sans-serif"
              fill="#8f634e"
            >
              {place.shortName}
            </text>
          </g>
        </g>
        <g
          className="walking-marker"
          style={{ transform: `translate(${position[0]}px, ${position[1]}px)` }}
        >
          <circle
            className="location-pulse"
            r="25"
            fill="#7698ce"
            opacity=".16"
          />
          <circle
            r="12"
            fill="#648bc2"
            stroke="white"
            strokeWidth="4"
            filter="url(#marker-shadow)"
          />
          <path
            d="m-4-15 4-6 4 6"
            stroke="#648bc2"
            strokeWidth="2"
            fill="none"
          />
        </g>
      </svg>
      <div className="map-compass" aria-hidden="true">
        <span>N</span>
        <Icon name="compass" size={23} />
      </div>
      <div className="map-attribution">
        Ann Arbor, MI <span>·</span> Illustrated map
      </div>
    </div>
  );
}
