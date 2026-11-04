import type { CSSProperties } from "react";

const paths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  egg: (
    <>
      <path d="M20 15a8 8 0 0 1-16 0C4 10 9 3 12 3s8 7 8 12Z" />
      <path d="m12 7-2 5 4 1-2 5" />
    </>
  ),
  dragon: (
    <>
      <path d="m4 19 1-7 5-5-1-4 5 3 5-2-2 6 4 3-6 3-3 5-3-3-5 1Z" />
      <path d="m14 10 2 1M6 13l5 2" />
    </>
  ),
  swords: (
    <>
      <path d="m4 3 3 1 11 11-3 3L4 7 4 3Zm16 0-3 1-5 5m5 3 3-5V3M3 17l4 4m-2-2 4-4m8 2 4 4m-2-2-4-4" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  trophy: (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm4 10v7m-4 1h8M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" />
    </>
  ),
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" />,
  book: (
    <>
      <path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  leaf: (
    <>
      <path d="M20 3C8 2 3 8 5 15c7 5 15 0 15-12ZM3 21 15 9" />
    </>
  ),
  fire: (
    <path d="M12 2c1 6-5 7-5 12a5 5 0 0 0 10 0c0-3-1-5-3-7 0 3-2 4-2 4s-3-4 0-9Z" />
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  heart: (
    <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 5 3 10 8 15 5-5 12-10 8-15Z" />
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  crown: (
    <>
      <path d="m3 6 5 4 4-6 4 6 5-4-3 12H6L3 6Zm3 15h12" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  reset: (
    <>
      <path d="M4 5v5h5M4 10a8 8 0 1 1 1 8" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  style,
  className = "",
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 30 : 39}
      height={small ? 30 : 39}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m24 2 4 10 12-6-4 13 10 8-14 2-8 16-9-13L3 30l9-11L9 6l12 7 3-11Z"
        fill="#79ba97"
      />
      <path d="m24 12 3 9 8-4-3 10-8 9-5-10 5-2-7-5 7-7Z" fill="#0c1711" />
      <path d="m26 20 4 1-4 3" fill="#f5e9c9" />
    </svg>
  );
}
