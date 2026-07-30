"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string };

export default function SubjectFilters({
  subjects,
  activeId,
}: {
  subjects: Subject[];
  activeId?: string | null;
}) {
  const router = useRouter();

  function selectAll() {
    router.push('/tutors');
  }

  function selectSubject(id: string) {
    if (activeId === id) {
      router.push('/tutors');
      return;
    }

    router.push(`/tutors?subjects.id=${encodeURIComponent(id)}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={selectAll}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition ${!activeId ? 'bg-[#3D1534] text-white shadow-sm' : 'bg-white text-[#3D1534] hover:bg-secondary hover:text-[#3d1534]'}`}
      >
        Все предметы
      </button>

      {subjects.map((s) => {
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => selectSubject(s.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${isActive ? 'bg-[#3D1534] text-white shadow-sm' : 'bg-white text-[#3D1534] hover:bg-secondary hover:text-[#3d1534]'}`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
