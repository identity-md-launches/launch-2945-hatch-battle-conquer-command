import { useId } from "react";
import type { Element } from "./game";

const palette = {
  Nature: {
    dark: "#102d23",
    mid: "#286448",
    light: "#a9d6a0",
    glow: "#7ace95",
    vein: "#d5e7b1",
  },
  Fire: {
    dark: "#381b14",
    mid: "#a34c28",
    light: "#ecc28a",
    glow: "#ed9961",
    vein: "#f4d6a1",
  },
  Storm: {
    dark: "#231d3c",
    mid: "#695086",
    light: "#c8b5ed",
    glow: "#b4a0e4",
    vein: "#eee0ff",
  },
};
export function EggArt({
  element,
  large = false,
}: {
  element: Element;
  large?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const p = palette[element];
  const eggPath =
    "M110 19C88 19 55 80 55 119c0 35 23 56 55 56s55-21 55-56c0-39-33-100-55-100Z";
  const scales = Array.from({ length: 13 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      const x = 42 + col * 18 + (row % 2) * 9;
      const y = 22 + row * 13;
      return (
        <path
          key={`${row}-${col}`}
          d={`M${x - 10} ${y}Q${x} ${y + 21} ${x + 10} ${y}`}
          fill="none"
          stroke={p.light}
          strokeWidth="1.2"
          opacity={0.16 + ((row + col) % 3) * 0.05}
        />
      );
    }),
  );
  return (
    <svg
      className={`egg-art ${large ? "large" : ""}`}
      viewBox="0 0 220 210"
      role="img"
      aria-label={`${element} dragon egg`}
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={p.glow} stopOpacity=".18" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shell`} cx="32%" cy="26%" r="80%">
          <stop stopColor={p.light} />
          <stop offset=".28" stopColor={p.mid} />
          <stop offset=".7" stopColor={p.dark} />
          <stop offset="1" stopColor="#0d1713" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={p.light} stopOpacity=".8" />
          <stop offset=".5" stopColor={p.mid} />
          <stop offset="1" stopColor={p.dark} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={eggPath} />
        </clipPath>
        <filter
          id={`${id}-shadow`}
          x="-50%"
          width="200%"
          y="-50%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse cx="110" cy="112" rx="104" ry="96" fill={`url(#${id}-halo)`} />
      <ellipse
        cx="110"
        cy="185"
        rx="61"
        ry="9"
        fill="#000"
        opacity=".5"
        filter={`url(#${id}-shadow)`}
      />
      <path d="m40 179 20-9 39 3 20-4 43 5 16 10-28 10H78Z" fill="#242b25" />
      <path d="m40 179 33 4 29-7 27 6 33-8 16 10-28 3H78Z" fill="#3e473b" />
      <path
        d={eggPath}
        fill={`url(#${id}-shell)`}
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${id}-clip)`}>
        {scales}
        <path
          d="m112 26-10 29 14 11-12 24 18 14-14 26 10 21-9 20"
          stroke={p.vein}
          strokeWidth="1"
          opacity=".6"
          fill="none"
        />
        <ellipse
          cx="83"
          cy="66"
          rx="15"
          ry="24"
          fill={p.light}
          opacity=".12"
          transform="rotate(20 83 66)"
        />
      </g>
      <g fill={p.light}>
        <circle cx="42" cy="101" r="1.2" opacity=".7" />
        <circle cx="177" cy="65" r="1" opacity=".8" />
        <circle cx="155" cy="33" r="1.4" opacity=".6" />
        <circle cx="63" cy="40" r="1" opacity=".5" />
      </g>
      <path
        d="m171 129 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
        fill={p.light}
        opacity=".6"
      />
    </svg>
  );
}

export function DragonArt({
  element,
  className = "",
}: {
  element: Element;
  className?: string;
}) {
  return (
    <div
      className={`dragon-art ${element.toLowerCase()} ${className}`}
      role="img"
      aria-label={`${element} dragon portrait`}
    >
      <img src="./assets/verdant-dragon.webp" alt="" draggable="false" />
    </div>
  );
}

export function ArenaArt() {
  return (
    <svg
      className="arena-art"
      viewBox="0 0 420 215"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="arena-sky" x2="0" y2="1">
          <stop stopColor="#21392c" />
          <stop offset="1" stopColor="#131e18" />
        </linearGradient>
        <linearGradient id="arena-stone" x2="0" y2="1">
          <stop stopColor="#7c8560" />
          <stop offset="1" stopColor="#313e2c" />
        </linearGradient>
        <radialGradient id="arena-light">
          <stop stopColor="#c6d7a0" stopOpacity=".35" />
          <stop offset="1" stopColor="#b9d39b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill="url(#arena-sky)" d="M0 0h420v215H0z" />
      <circle cx="250" cy="60" r="130" fill="url(#arena-light)" />
      <path
        d="m0 140 35-60 31 50 40-74 43 83 52-56 40 62 57-89 43 76 40-57 39 68v72H0Z"
        fill="#273e2a"
      />
      <path
        d="M12 0h14v153H12zm21 0 10 130-4 40H28zm335 0h12v151h-12zm25 0 9 175h-17Z"
        fill="#15241a"
      />
      <ellipse cx="212" cy="176" rx="147" ry="33" fill="#101b13" />
      <ellipse cx="212" cy="164" rx="147" ry="33" fill="url(#arena-stone)" />
      <ellipse
        cx="212"
        cy="164"
        rx="116"
        ry="24"
        stroke="#b0b38a"
        strokeOpacity=".45"
        strokeWidth="2"
      />
      <ellipse
        cx="212"
        cy="164"
        rx="100"
        ry="19"
        stroke="#252e21"
        strokeWidth="7"
      />
      <path
        d="M136 143V83q0-55 66-55t66 55v59h-20V83q0-36-46-36t-46 36v60Z"
        fill="url(#arena-stone)"
      />
      <path
        d="M141 99h15m-15 21h15m92-21h15m-15 21h15M173 37l10 13m35-14-4 12m30 4-11 10"
        stroke="#20301e"
        strokeWidth="3"
      />
      <path d="M126 145h41v8h-41zm111 0h41v8h-41z" fill="#7b8559" />
      <path d="m192 131 10-23 11 23-11 6-10-6Z" fill="#99bb75" />
      <path d="m202 108v29" stroke="#d3e2ac" />
      <path
        d="m54 162 9-21 10 21m264 15 11-29 12 29"
        stroke="#485c31"
        strokeWidth="6"
      />
      <path
        d="m125 66 12 10 12-6m97-14 10 7 13-2"
        stroke="#557440"
        strokeWidth="3"
      />
      <g fill="#d1d29a">
        <circle cx="99" cy="69" r="1.4" />
        <circle cx="309" cy="115" r="1.5" />
        <circle cx="214" cy="78" r="1" />
        <circle cx="178" cy="105" r="1.3" />
        <circle cx="280" cy="45" r="1.2" />
      </g>
    </svg>
  );
}
