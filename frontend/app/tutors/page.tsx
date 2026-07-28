import TutorGrid from '../../components/TutorGrid';
import { buildApiUrl } from '@/lib/api';

async function fetchTutors() {
  const res = await fetch(buildApiUrl('/api/tutor_profiles?itemsPerPage=50'), {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tutors');
  }
  const data = await res.json();
  return data['hydra:member'] ?? [];
}

async function fetchSubjects() {
  const res = await fetch(buildApiUrl('/api/subjects?itemsPerPage=100'), {
    cache: 'no-store',
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data['hydra:member'] ?? [];
}

function getSubjectId(subject: any) {
  if (typeof subject === 'string') {
    const segments = subject.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? subject;
  }
  if (subject && typeof subject === 'object') {
    if (typeof subject.id === 'number' || typeof subject.id === 'string') {
      return String(subject.id);
    }
    const iri = subject['@id'];
    if (typeof iri === 'string') {
      const segments = iri.split('/').filter(Boolean);
      return segments[segments.length - 1] ?? iri;
    }
  }
  return '';
}

function resolveSubjects(tutor: any, subjectMap: Record<string, string>) {
  if (!Array.isArray(tutor.subjects)) {
    return [];
  }

  return tutor.subjects
    .map((subject: any) => {
      if (!subject) return null;

      if (typeof subject === 'string') {
        const subjectId = getSubjectId(subject);
        return { '@id': subject, name: subjectMap[subjectId] ?? 'Предмет' };
      }

      if (typeof subject === 'object') {
        const subjectId = getSubjectId(subject);
        return {
          ...subject,
          name: subject.name || subjectMap[subjectId] || 'Предмет',
        };
      }

      return null;
    })
    .filter(Boolean);
}

export default async function TutorsPage() {
  const [tutors, subjects] = await Promise.all([fetchTutors(), fetchSubjects()]);

  const subjectMap = Object.fromEntries(
    subjects
      .map((subject: any) => {
        const subjectId = getSubjectId(subject);
        return [subjectId, subject.name ?? 'Предмет'];
      })
      .filter(([id]) => Boolean(id))
  );

  const resolvedTutors = tutors.map((tutor: any) => ({
    ...tutor,
    subjects: resolveSubjects(tutor, subjectMap),
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F0A14] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8%] top-[-10%] h-64 w-64 rounded-full bg-[#F6E0B6]/20 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-5%] h-72 w-72 rounded-full bg-[#3D1534]/40 blur-3xl" />
        <div className="absolute left-[45%] top-[20%] h-40 w-40 rounded-full bg-[#5A5FB0]/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#F6E0B6]">TutorHub</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Каталог репетиторов</h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Выбирайте преподавателей по предметам, городу и тарифу — всё в одном аккуратном каталоге.
          </p>
        </header>

        <TutorGrid tutors={resolvedTutors} />
      </div>
    </main>
  );
}
