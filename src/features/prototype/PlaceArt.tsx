import type { Discovery } from "./story";
/** Original vector scenery for the fictional discovery, rather than a place photo. */
export function PlaceArt({
  place,
  arrival = false,
}: {
  place: Discovery;
  arrival?: boolean;
}) {
  return (
    <svg
      className={`place-art ${arrival ? "is-arrival" : ""}`}
      viewBox="0 0 480 260"
      fill="none"
      role="img"
      aria-label={
        place.type === "fountain"
          ? "An illustrated fountain in a quiet, leafy courtyard"
          : "An illustrated arched passageway with soft afternoon light"
      }
    >
      <defs>
        <radialGradient id="art-light">
          <stop stopColor="#f6e6c9" stopOpacity=".85" />
          <stop offset="1" stopColor="#f6e6c9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="art-water" x2="0" y2="1">
          <stop stopColor="#cadfdf" />
          <stop offset="1" stopColor="#a9c9d1" />
        </linearGradient>
        <linearGradient id="art-stone" x2="0" y2="1">
          <stop stopColor="#e8e3d7" />
          <stop offset="1" stopColor="#c6c2b5" />
        </linearGradient>
      </defs>
      <ellipse cx="244" cy="135" rx="208" ry="130" fill="url(#art-light)" />
      <ellipse cx="241" cy="226" rx="170" ry="14" fill="#9f9b8b" opacity=".1" />
      <g stroke="#c7c2b4" strokeWidth="1">
        <path d="M65 225h350M97 206h285M120 189h236M142 175h193" />
        <path
          d="m110 225 48-50m34 50 20-50m63 50-8-50m85 50-31-50"
          opacity=".5"
        />
      </g>
      <g className="art-leaves" fill="#a6b9a1">
        <path d="M79 199c-7-24-24-44-29-68 26 7 38 39 29 68Z" />
        <path d="M80 173c9-29 6-56-3-73-15 21-14 46 3 73Z" />
        <path d="M87 202c4-23 19-37 38-42-3 23-17 36-38 42Z" />
        <path d="M389 205c-6-27 3-58 23-79 7 28-4 57-23 79Z" />
        <path d="M390 179c-23-6-36-22-40-40 24 3 37 17 40 40Z" />
      </g>
      <g stroke="#8e9d86" strokeWidth="1.5">
        <path d="m76 218 5-65m305 65 9-55" />
      </g>
      {place.type === "fountain" ? (
        <g>
          <path d="M150 207h180l-13-12H164l-14 12Z" fill="#d5d1c6" />
          <path d="M150 207v9h180v-9" fill="#bfbdaf" />
          <ellipse cx="240" cy="183" rx="76" ry="22" fill="url(#art-stone)" />
          <path d="M164 180v12c7 24 144 24 152 0v-12" fill="#d3d1c3" />
          <ellipse cx="240" cy="180" rx="76" ry="21" fill="#ece8dd" />
          <ellipse cx="240" cy="179" rx="65" ry="15" fill="url(#art-water)" />
          <ellipse
            className="water-ring"
            cx="240"
            cy="178"
            rx="42"
            ry="9"
            stroke="#f9fcf9"
            opacity=".75"
          />
          <path d="M229 176h22l-3-56h-16l-3 56Z" fill="url(#art-stone)" />
          <path d="M205 115c3 26 67 26 70 0" fill="#cbc9ba" />
          <ellipse cx="240" cy="115" rx="35" ry="9" fill="#ece8da" />
          <ellipse cx="240" cy="113" rx="28" ry="5" fill="#bdd4d6" />
          <path d="M234 110h12l-3-26h-6l-3 26Z" fill="#c1c3b4" />
          <g
            className="water-stream"
            stroke="#9dbfc8"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M240 86c-16-42-31-20-31 18m31-18c16-42 31-20 31 18m-31-18V65" />
            <path d="M215 119v45m50-45v45" opacity=".7" />
          </g>
          <g transform="rotate(-8 301 206)">
            <path d="M291 192h22v27h-22z" fill="#fffdf6" stroke="#d6cfbd" />
            <path d="M296 199h12m-12 4h10m-10 4h11" stroke="#b5ad9d" />
          </g>
        </g>
      ) : (
        <g>
          <path
            d="M150 208V105a90 90 0 0 1 180 0v103h-33V106a57 57 0 0 0-114 0v102h-33Z"
            fill="url(#art-stone)"
          />
          <path
            d="M162 207V106a78 78 0 0 1 156 0v101M185 116h110M185 147h110M185 178h110"
            stroke="#b8b6a8"
          />
          <path d="m184 208 35-95h42l35 95" fill="#e9dfc5" opacity=".6" />
          <path
            d="M220 208v-80a20 20 0 0 1 40 0v80"
            fill="#b7c7b2"
            opacity=".6"
          />
          <g className="echo-rings" stroke="#a4b7b0">
            <path d="M207 138q-12 22 0 44m-11-54q-20 32 0 64m76-54q12 22 0 44m11-54q20 32 0 64" />
          </g>
        </g>
      )}
      <path
        d="m126 88 4-6 4 6-4-2-4 2Zm211-27 5-6 5 6-5-2-5 2Z"
        fill="#a29e92"
      />
      <circle cx="332" cy="113" r="2" fill="#d8be8e" />
      <circle cx="141" cy="143" r="1.5" fill="#d8be8e" />
    </svg>
  );
}
