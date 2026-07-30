"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string };

export default function SubjectFilters({
  subjects,
  activeIds,
}: {
  subjects: Subject[];
  activeIds?: string[];
}) {
  const router = useRouter();

  function selectAll() {
    router.push('/tutors');
  }

  function toggleSubject(id: string) {
    const nextIds = (activeIds ?? []).includes(id)
      ? (activeIds ?? []).filter((currentId) => currentId !== id)
      : [...(activeIds ?? []), id];

    const nextUrl = nextIds.length > 0 ? `/tutors?subjects.id=${encodeURIComponent(nextIds.join(','))}` : '/tutors';
    router.push(nextUrl);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={selectAll}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition ${(activeIds ?? []).length === 0 ? 'bg-[#3D1534] text-white shadow-sm' : 'bg-white text-[#3D1534] hover:bg-secondary hover:text-[#3d1534]'}`}
      >
        Все предметы
      </button>

      {subjects.map((s) => {
        const isActive = (activeIds ?? []).includes(s.id);
        return (
          <button
            key={s.id}
            onClick={() => toggleSubject(s.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${isActive ? 'bg-[#3D1534] text-white shadow-sm' : 'bg-white text-[#3D1534] hover:bg-secondary hover:text-[#3d1534]'}`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
