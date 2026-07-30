import TutorGrid from '../../components/TutorGrid';
import BackgroundBlobs from '../../components/BackgroundBlobs';
import { buildApiUrl } from '@/lib/api';
import SubjectFilters from '@/components/SubjectFilters';

type SearchParams = { [key: string]: string | string[] | undefined };

type RawSubject =
  | string
  | {
      id?: string | number;
      '@id'?: string;
      name?: string;
      [key: string]: unknown;
    };

type RawTutor = {
  subjects?: RawSubject[];
  [key: string]: unknown;
};

async function fetchTutors(subjectQuery?: string): Promise<RawTutor[]> {
  const q = subjectQuery ?? '';
  const apiUrl = buildApiUrl(`/api/tutor_profiles?itemsPerPage=50${q}`);
  console.log('TutorsPage fetch URL:', apiUrl);
  const res = await fetch(apiUrl, {
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

function getSubjectId(subject: RawSubject) {
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

function resolveSubjects(tutor: RawTutor, subjectMap: Record<string, string>) {
  if (!Array.isArray(tutor.subjects)) {
    return [];
  }

  return tutor.subjects
    .map((subject: RawSubject | null) => {
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
    .filter(Boolean) as Array<{ '@id': string; name: string }>;
}

export default async function TutorsPage({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }) {
  let params: SearchParams = {};
  if (searchParams) {
    if (typeof (searchParams as Promise<SearchParams>)?.then === 'function') {
      params = await (searchParams as Promise<SearchParams>);
    } else {
      params = searchParams as SearchParams;
    }
  }

  const active = params?.['subjects.id'];
  const activeId = Array.isArray(active) ? active[0] : active ?? null;
  const subjectQuery = activeId ? `&subjects.id=${encodeURIComponent(activeId)}` : '';

  const [tutors, subjects] = await Promise.all([fetchTutors(subjectQuery), fetchSubjects()]);

  const subjectMap = Object.fromEntries(
    subjects
      .map((subject: RawSubject) => {
        const subjectId = getSubjectId(subject);
        const name = typeof subject === 'string' ? 'Предмет' : subject.name ?? 'Предмет';
        return [subjectId, name];
      })
      .filter(([id]) => Boolean(id))
  );

  const resolvedTutors = tutors.map((tutor) => ({
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

          {/* Subject filters (client) */}
          <SubjectFilters
            subjects={subjects.map((s: RawSubject) => ({
              id: getSubjectId(s),
              name: typeof s === 'string' ? 'Предмет' : s.name ?? 'Предмет',
            }))}
            activeId={activeId}
          />

          <TutorGrid tutors={resolvedTutors} />
        </section>
      </div>
    </main>
  );
}
