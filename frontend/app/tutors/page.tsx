import TutorGrid from '../../components/TutorGrid';
import BackgroundBlobs from '../../components/BackgroundBlobs';
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
    <main className="relative min-h-screen overflow-hidden bg-[#3D1534] text-[#3D1534]">
      <BackgroundBlobs className="absolute inset-0 pointer-events-none" />

      <div className="mx-auto flex max-w-[calc(80rem-20px)] flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[2rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] sm:p-8">
          <header className="mb-5 max-w-3xl">
            <h1 className="text-3xl font-semibold sm:text-4xl text-[#3D1534]">Каталог репетиторов</h1>
            <p className="mt-3 text-sm text-[#3D1534]/80 sm:text-base">
              Выбирайте преподавателей по предметам, городу и тарифу — всё в одном аккуратном каталоге.
            </p>
          </header>

          <TutorGrid tutors={resolvedTutors} />
        </section>
      </div>
    </main>
  );
}
