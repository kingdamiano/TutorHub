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

  const selectedIds = activeIds ?? [];

  function selectAll() {
    router.push('/tutors');
  }

  function toggleSubject(id: string) {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id)
      : [...selectedIds, id];

    if (nextIds.length === 0) {
      router.push('/tutors');
      return;
    }

    const params = nextIds.map((subjectId) => `subjects.id=${encodeURIComponent(subjectId)}`).join('&');
    router.push(`/tutors?${params}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={selectAll}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition ${selectedIds.length === 0 ? 'bg-[#3D1534] text-white shadow-sm' : 'bg-white text-[#3D1534] hover:bg-secondary hover:text-[#3d1534]'}`}
      >
        Все предметы
      </button>

      {subjects.map((s) => {
        const isActive = selectedIds.includes(s.id);
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
