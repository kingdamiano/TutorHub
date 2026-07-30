'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function SubjectViewAllCard() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const update = () => setIsDesktop(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  if (!isDesktop) {
    return null;
  }

  return (
    <Link
      href="/tutors"
      className="group flex w-full max-w-[220px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:bg-[#F6E0B6]/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
    >
      <div className="rounded-full bg-[#F6E0B6]/20 p-3 text-[#FFF4EB] transition-colors duration-200 group-hover:bg-[#F6E0B6] group-hover:text-[#3D1534]">
        <BookOpen className="h-6 w-6" />
      </div>
      <p className="mt-3 text-center text-sm font-sans font-semibold text-[#FFF4EB] transition-colors duration-200 group-hover:text-[#F6E0B6]">
        Смотреть все
      </p>
    </Link>
  );
}
