import type { SVGProps } from 'react';

export type PixelIconName =
  | 'academy'
  | 'award'
  | 'book'
  | 'brain'
  | 'check'
  | 'chevronDown'
  | 'clock'
  | 'close'
  | 'flame'
  | 'grammar'
  | 'headphones'
  | 'home'
  | 'lock'
  | 'logout'
  | 'magic'
  | 'menu'
  | 'mic'
  | 'pencil'
  | 'play'
  | 'profile'
  | 'quiz'
  | 'reset'
  | 'scroll'
  | 'sparkle'
  | 'star'
  | 'sword'
  | 'trophy'
  | 'zap';

type Pixel = readonly [x: number, y: number, w: number, h: number, fill?: string];

const a = 'currentColor';
const b = 'var(--pixel-accent, #ffc44f)';
const c = 'var(--pixel-cyan, #6ce4ff)';
const d = 'var(--pixel-dark, #05153f)';

const pixels: Record<PixelIconName, Pixel[]> = {
  academy: [
    [7, 1, 2, 2, b], [6, 3, 4, 2, a], [5, 5, 6, 2, a], [3, 7, 10, 7, a], [5, 9, 2, 5, d], [9, 9, 2, 5, d], [7, 8, 2, 2, b]
  ],
  award: [
    [6, 1, 4, 2, b], [4, 3, 8, 5, b], [5, 4, 6, 3, d], [7, 5, 2, 1, b], [6, 8, 4, 3, a], [4, 11, 3, 4, a], [9, 11, 3, 4, a]
  ],
  book: [
    [2, 3, 5, 10, a], [9, 3, 5, 10, a], [3, 4, 3, 8, d], [10, 4, 3, 8, d], [7, 4, 2, 9, b], [4, 6, 2, 1, c], [10, 6, 2, 1, c]
  ],
  brain: [
    [5, 3, 2, 2, a], [9, 3, 2, 2, a], [3, 5, 10, 6, a], [4, 11, 8, 2, a], [5, 6, 2, 1, d], [9, 6, 2, 1, d], [7, 8, 2, 4, d]
  ],
  check: [
    [3, 8, 2, 2, a], [5, 10, 2, 2, a], [7, 8, 2, 2, a], [9, 6, 2, 2, a], [11, 4, 2, 2, a]
  ],
  chevronDown: [
    [4, 5, 2, 2, a], [6, 7, 2, 2, a], [8, 9, 2, 2, a], [10, 7, 2, 2, a], [12, 5, 2, 2, a]
  ],
  clock: [
    [5, 2, 6, 2, a], [3, 4, 2, 8, a], [11, 4, 2, 8, a], [5, 12, 6, 2, a], [7, 5, 2, 4, b], [9, 9, 2, 2, b]
  ],
  close: [
    [3, 3, 2, 2, a], [11, 3, 2, 2, a], [5, 5, 2, 2, a], [9, 5, 2, 2, a], [7, 7, 2, 2, a], [5, 9, 2, 2, a], [9, 9, 2, 2, a], [3, 11, 2, 2, a], [11, 11, 2, 2, a]
  ],
  flame: [
    [8, 1, 2, 3, b], [6, 4, 2, 2, c], [8, 4, 3, 3, b], [4, 6, 8, 6, a], [5, 12, 6, 2, a], [7, 8, 2, 4, b]
  ],
  grammar: [
    [4, 2, 8, 2, b], [3, 4, 10, 10, a], [5, 5, 6, 8, d], [6, 7, 4, 1, c], [6, 10, 4, 1, c]
  ],
  headphones: [
    [5, 2, 6, 2, a], [3, 4, 2, 8, a], [11, 4, 2, 8, a], [2, 9, 3, 4, b], [11, 9, 3, 4, b], [6, 13, 4, 1, c]
  ],
  home: [
    [7, 2, 2, 2, b], [5, 4, 6, 2, a], [3, 6, 10, 2, a], [4, 8, 8, 6, a], [6, 10, 4, 4, d]
  ],
  lock: [
    [5, 2, 6, 2, a], [4, 4, 2, 4, a], [10, 4, 2, 4, a], [3, 8, 10, 6, b], [7, 10, 2, 3, d]
  ],
  logout: [
    [2, 3, 6, 2, a], [2, 5, 2, 6, a], [2, 11, 6, 2, a], [8, 7, 5, 2, b], [11, 5, 2, 2, b], [11, 9, 2, 2, b]
  ],
  magic: [
    [7, 1, 2, 3, b], [7, 6, 2, 3, b], [3, 5, 3, 2, b], [10, 5, 3, 2, b], [5, 3, 2, 2, c], [9, 7, 2, 2, c], [4, 11, 8, 2, a]
  ],
  menu: [
    [3, 4, 10, 2, a], [3, 7, 10, 2, a], [3, 10, 10, 2, a]
  ],
  mic: [
    [6, 2, 4, 7, a], [5, 3, 6, 5, a], [4, 8, 2, 3, b], [10, 8, 2, 3, b], [7, 11, 2, 2, a], [5, 13, 6, 1, a]
  ],
  pencil: [
    [11, 2, 2, 2, b], [9, 4, 2, 2, b], [7, 6, 2, 2, a], [5, 8, 2, 2, a], [3, 10, 2, 2, a], [2, 12, 2, 2, c]
  ],
  play: [
    [5, 3, 2, 10, a], [7, 5, 2, 6, a], [9, 6, 2, 4, a], [11, 7, 2, 2, a]
  ],
  profile: [
    [6, 2, 4, 4, b], [5, 6, 6, 2, a], [3, 9, 10, 5, a], [5, 10, 6, 3, d]
  ],
  quiz: [
    [5, 2, 6, 2, b], [9, 4, 2, 2, b], [7, 6, 2, 2, b], [7, 9, 2, 2, a], [7, 13, 2, 2, a]
  ],
  reset: [
    [5, 2, 6, 2, a], [3, 4, 2, 6, a], [11, 4, 2, 6, a], [5, 10, 6, 2, a], [3, 2, 2, 2, b], [2, 3, 2, 2, b]
  ],
  scroll: [
    [4, 2, 8, 2, b], [3, 4, 10, 9, a], [5, 5, 6, 7, d], [6, 6, 4, 1, c], [6, 9, 4, 1, c], [4, 13, 8, 1, b]
  ],
  sparkle: [
    [7, 1, 2, 4, b], [7, 11, 2, 4, b], [1, 7, 4, 2, b], [11, 7, 4, 2, b], [6, 6, 4, 4, c]
  ],
  star: [
    [7, 1, 2, 3, b], [4, 4, 8, 2, b], [5, 6, 6, 3, b], [4, 9, 3, 4, b], [9, 9, 3, 4, b], [7, 8, 2, 2, d]
  ],
  sword: [
    [8, 1, 2, 8, c], [7, 9, 4, 2, b], [6, 11, 2, 2, a], [8, 13, 2, 2, a]
  ],
  trophy: [
    [5, 2, 6, 6, b], [3, 3, 2, 4, b], [11, 3, 2, 4, b], [7, 8, 2, 3, a], [5, 11, 6, 2, a], [4, 13, 8, 1, a]
  ],
  zap: [
    [8, 1, 4, 2, b], [7, 3, 3, 3, b], [5, 6, 4, 2, b], [6, 8, 3, 2, b], [4, 10, 3, 5, b]
  ]
};

type PixelIconProps = SVGProps<SVGSVGElement> & {
  name: PixelIconName;
  size?: number;
};

export function PixelIcon({ name, size = 24, ...props }: PixelIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      shapeRendering="crispEdges"
      {...props}
    >
      {pixels[name].map(([x, y, w, h, fill], index) => (
        <rect key={`${name}-${index}`} x={x} y={y} width={w} height={h} fill={fill ?? a} />
      ))}
    </svg>
  );
}
