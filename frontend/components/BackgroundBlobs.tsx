"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Props = { className?: string };

export default function BackgroundBlobs({ className = '' }: Props) {
  const pathname = usePathname();

  const [bases, setBases] = useState<Array<{ top?: string; right?: string; left?: string; bottom?: string; width: string; height: string; bg: string; blur: string }>>([]);
  const [extras, setExtras] = useState<Array<{ top: string; left: string; size: string; bg: string; blur: string }>>([]);

  useEffect(() => {
    // regenerate bases and extras whenever the route changes so each page is different
    const palette = [
      'rgba(246,224,182,0.18)',
      'rgba(62,75,142,0.20)',
      'rgba(205,231,255,0.12)',
      'rgba(237,201,255,0.14)',
      'rgba(255,209,213,0.12)'
    ];

    const makeRandomPos = () => `${Math.floor(Math.random() * 140) - 20}%`;
    const makeRandomPx = (min: number, max: number) => `${Math.floor(Math.random() * (max - min + 1)) + min}px`;

    const generatedBases = Array.from({ length: 3 }).map(() => {
      const topOrBottom = Math.random() > 0.5 ? { top: makeRandomPos() } : { bottom: makeRandomPos() };
      const leftOrRight = Math.random() > 0.5 ? { left: makeRandomPos() } : { right: makeRandomPos() };
      return {
        ...topOrBottom,
        ...leftOrRight,
        width: makeRandomPx(160, 420),
        height: makeRandomPx(160, 420),
        bg: palette[Math.floor(Math.random() * palette.length)],
        blur: `${Math.floor(Math.random() * 28) + 20}px`
      };
    });

    const extraCount = Math.floor(Math.random() * 3) + 1; // 1..3
    const generatedExtras = Array.from({ length: extraCount }).map(() => {
      const top = makeRandomPos();
      const left = makeRandomPos();
      const size = makeRandomPx(48, 168);
      const bg = palette[Math.floor(Math.random() * palette.length)];
      const blur = `${Math.floor(Math.random() * 24) + 18}px`;
      return { top, left, size, bg, blur };
    });

    setBases(generatedBases);
    setExtras(generatedExtras);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}>
      {bases.map((b, i) => (
        <div
          key={`base-blob-${i}`}
          className="absolute rounded-full"
          style={{
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            width: b.width,
            height: b.height,
            backgroundColor: b.bg,
            filter: `blur(${b.blur})`
          }}
        />
      ))}

      {extras.map((b, i) => (
        <div
          key={`extra-blob-${i}`}
          className="absolute rounded-full"
          style={{ top: b.top, left: b.left, width: b.size, height: b.size, backgroundColor: b.bg, filter: `blur(${b.blur})` }}
        />
      ))}
    </div>
  );
}
