import Image from 'next/image';
import Link from 'next/link';
import TutorCarousel from '@/components/TutorCarousel';
import FAQ from '@/components/FAQ';
import SubjectViewAllCard from '@/components/SubjectViewAllCard';
import {
  Calculator,
  Languages,
  BookOpen,
  Clock,
  Zap,
  Beaker,
  Leaf,
  Globe,
  Music,
} from 'lucide-react';

function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
  return raw.replace(/http:\/\/localhost(?::\d+)?/i, 'http://127.0.0.1');
}

async function getPlatformStats() {
  const apiUrl = getApiBaseUrl();

  try {
    const [profilesRes, reviewsRes] = await Promise.all([
      fetch(`${apiUrl}/api/tutor_profiles?itemsPerPage=1`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/api/reviews?itemsPerPage=100`, { next: { revalidate: 60 } }),
    ]);

    const stats = {
      tutors: 48,
      rating: 4.9,
      lessons: 1250,
    };

    if (profilesRes.ok) {
      const profilesJson = await profilesRes.json();
      const total = profilesJson['hydra:totalItems'] ?? profilesJson['hydra:member']?.length ?? 0;
      if (typeof total === 'number' && total > 0) {
        stats.tutors = total;
      }
    }

    if (reviewsRes.ok) {
      const reviewsJson = await reviewsRes.json();
      const reviews = reviewsJson['hydra:member'] ?? reviewsJson ?? [];
      if (Array.isArray(reviews) && reviews.length > 0) {
        const average = reviews.reduce((sum: number, item: any) => sum + Number(item.rating ?? 0), 0) / reviews.length;
        if (Number.isFinite(average)) {
          stats.rating = Number(average.toFixed(1));
        }
        stats.lessons = Math.max(stats.lessons, reviews.length * 24);
      }
    }

    return stats;
  } catch {
    return {
      tutors: 48,
      rating: 4.9,
      lessons: 1250,
    };
  }
}

function buildAbsoluteUrl(apiUrl: string, path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function fetchSubjectName(apiUrl: string, subjectIri: string) {
  try {
    const res = await fetch(buildAbsoluteUrl(apiUrl, subjectIri), { next: { revalidate: 60 } });
    if (!res.ok) {
      return 'Предмет';
    }
    const data = await res.json();
    return data.name ?? 'Предмет';
  } catch {
    return 'Предмет';
  }
}

async function getPopularTutors() {
  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/api/tutor_profiles?itemsPerPage=3`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const tutors = data['hydra:member'] ?? [];
      const normalizedTutors = await Promise.all(
        tutors.map(async (tutor: any) => {
          const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
          const normalizedSubjects = await Promise.all(
            subjects.map(async (subject: any) => {
              if (!subject) return null;
              if (typeof subject === 'string') {
                const name = await fetchSubjectName(apiUrl, subject);
                return { '@id': subject, name };
              }
              if (typeof subject === 'object') {
                return subject;
              }
              return null;
            })
          );
          return {
            ...tutor,
            subjects: normalizedSubjects.filter(Boolean),
          };
        })
      );
      return normalizedTutors;
    }
    console.error('Popular tutors fetch failed:', res.status, res.statusText);
  } catch (error) {
    console.error('Popular tutors fetch error:', error);
  }

  return [];
}

async function getSubjects() {
  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/api/subjects?itemsPerPage=12`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data['hydra:member'] ?? [];
    }
    console.error('Subjects fetch failed:', res.status, res.statusText);
  } catch (error) {
    console.error('Subjects fetch error:', error);
  }

  return [];
}

function getIconForSubject(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('матем')) return <Calculator className="w-6 h-6" />;
  if (lower.includes('англ')) return <Languages className="w-6 h-6" />;
  if (lower.includes('русск')) return <BookOpen className="w-6 h-6" />;
  if (lower.includes('истор')) return <Clock className="w-6 h-6" />;
  if (lower.includes('физ')) return <Zap className="w-6 h-6" />;
  if (lower.includes('хим')) return <Beaker className="w-6 h-6" />;
  if (lower.includes('биол')) return <Leaf className="w-6 h-6" />;
  if (lower.includes('геог')) return <Globe className="w-6 h-6" />;
  if (lower.includes('музы')) return <Music className="w-6 h-6" />;
  return <BookOpen className="w-6 h-6" />;
}

export default async function Home() {
  const stats = await getPlatformStats();
  const tutors = await getPopularTutors();
  const subjects = await getSubjects();
  const fallbackSubjects = [
    { id: 'math', name: 'Математика' },
    { id: 'english', name: 'Английский' },
    { id: 'russian', name: 'Русский язык' },
    { id: 'physics', name: 'Физика' },
  ];

  const steps = [
    {
      title: 'Найдите репетитора',
      description: 'Просматривайте профили, предметы и отзывы в одном удобном каталоге.',
      image: '/images/step-01.png',
    },
    {
      title: 'Забронируйте урок',
      description: 'Выбирайте удобное время и отправляйте заявку прямо через платформу.',
      image: '/images/step-02.png',
    },
    {
      title: 'Учитесь и оставляйте отзыв',
      description: 'После занятия можно оценить опыт и помочь другим студентам.',
      image: '/images/step-03.png',
    },
  ];

  const sectionPadding = 'py-16 lg:py-20';

  return (
    <main className="flex flex-col">
      <div className="mx-auto flex max-w-7xl flex-col px-4 pt-8 pb-0 sm:px-6 sm:pt-10 md:pt-12 lg:px-8 lg:pt-[76px] lg:pb-0 w-full">
        {/* HERO SECTION */}
        <section className="px-6 pt-4 pb-0 sm:px-8 sm:pt-5 md:pt-6 lg:px-10 lg:pt-3 lg:pb-0">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-7 md:gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:text-left">
            <div className="order-1 lg:order-none flex w-full flex-col items-center justify-center lg:items-start lg:pr-8 lg:mt-[10px]">
              <h1 className="max-w-3xl text-center font-serif text-4xl leading-tight text-white sm:text-5xl md:text-4xl lg:text-left lg:text-6xl">
                Найдите <em className="not-italic text-[#F6E0B6]">идеального</em> репетитора для ваших целей
              </h1>
            </div>

            <div className="order-2 lg:order-none flex w-full flex-col items-center justify-center lg:items-center lg:mt-8">
              <div className="relative w-full max-w-3xl min-h-[320px] overflow-hidden rounded-[30%_70%_70%_30%/_30%_30%_70%_70%] border-[3px] border-border bg-[#3D1534] text-white shadow-xl sm:min-h-[380px] lg:min-h-[420px]">
                <Image
                  src="/hero-photo.jpg"
                  alt="Студентка занимается с репетитором при свете лампы"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="order-3 lg:order-none flex w-full items-center justify-center lg:justify-start lg:mt-[-75px]">
              <Link
                href="/tutors"
                className="inline-flex w-fit rounded-full bg-[#F6E0B6] px-14 py-3 text-sm font-semibold text-[#3D1534] transition hover:opacity-90"
              >
                Начать сейчас
              </Link>
            </div>
          </div>
        </section>

        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#3D1534] py-20 sm:py-24 lg:py-28">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
            <div className="mx-auto grid w-full max-w-[1120px] justify-center justify-items-center gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {subjects ? (
                subjects.length > 0 ? (
                  <>
                    {subjects.slice(0, 4).map((subject: any) => {
                      const subjectId = subject.id || subject['@id']?.split('/').pop();
                      return (
                        <Link
                          key={subjectId}
                          href={`/tutors?subjects.id=${subjectId}`}
                          className="group flex w-full max-w-[220px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:bg-[#F6E0B6]/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
                        >
                          <div className="rounded-full bg-[#F6E0B6]/20 p-3 text-[#FFF4EB] transition-colors duration-200 group-hover:bg-[#F6E0B6] group-hover:text-[#3D1534]">
                            {getIconForSubject(subject.name || '')}
                          </div>
                          <p className="mt-3 text-center text-sm font-sans font-semibold text-[#FFF4EB] transition-colors duration-200 group-hover:text-[#F6E0B6]">
                            {subject.name || 'Предмет'}
                          </p>
                        </Link>
                      );
                    })}

                    <SubjectViewAllCard />
                  </>
                ) : (
                  <div className="col-span-full py-8 text-center text-[#FFF4EB]/70">
                    {/* fallback: render some popular subjects that still navigate to tutors (by name) */}
                    <div className="mx-auto grid w-full max-w-[1120px] justify-center justify-items-center gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                      {fallbackSubjects.map((s) => (
                        <Link
                          key={s.id}
                          href={`/tutors?subject=${encodeURIComponent(s.name)}`}
                          className="group flex w-full max-w-[220px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:bg-[#F6E0B6]/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
                        >
                          <div className="rounded-full bg-[#F6E0B6]/20 p-3 text-[#FFF4EB] transition-colors duration-200 group-hover:bg-[#F6E0B6] group-hover:text-[#3D1534]">
                            {getIconForSubject(s.name)}
                          </div>
                          <p className="mt-3 text-center text-sm font-sans font-semibold text-[#FFF4EB] transition-colors duration-200 group-hover:text-[#F6E0B6]">
                            {s.name}
                          </p>
                        </Link>
                      ))}
                      <SubjectViewAllCard />
                    </div>
                  </div>
                )
              ) : (
                <div className="col-span-full py-8 text-center text-[#FFF4EB]/70">
                  Ошибка загрузки предметов.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* HOW IT WORKS - unified wheat section */}
      <section className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#F6E0B6] ${sectionPadding}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#F6E0B6]/20 rounded-full blur-3xl" />
          <div className="absolute top-[-40px] right-1/6 w-112 h-112 bg-[#3D1534]/35 rounded-full blur-3xl" />
          <div className="absolute bottom-6 left-1/6 w-96 h-96 bg-[#3D1534]/20 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center">
            <h2 className="font-sans text-3xl font-semibold text-[#3D1534] mb-12">Просто, удобно и без лишних шагов</h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="overflow-hidden rounded-2xl border border-white/30 bg-[#F6E0B6]/20 backdrop-blur-xl scale-105 shadow-xl">
                <div className="h-[180px] w-full overflow-hidden rounded-t-2xl">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={600}
                    height={180}
                    className="h-[180px] w-full object-cover"
                  />
                </div>
                <div className="p-6 pb-8 bg-[#FFF4EB]">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-[#3D1534]">
                    0{index + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-sans font-semibold text-[#3D1534]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#3D1534]/80">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR TUTORS + FOR TUTORS + FAQ - unified full-width section */}
      <section className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#3D1534] ${sectionPadding}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-12 left-1/6 h-96 w-96 rounded-full bg-[#F6E0B6]/20 blur-3xl" />
          <div className="absolute top-[-40px] right-0 h-96 w-96 rounded-full bg-[#3E4B8E]/25 blur-3xl" />
          <div className="absolute top-[32%] left-[45%] h-64 w-64 rounded-full bg-[#3E4B8E]/18 blur-3xl" />
          <div className="absolute bottom-8 left-1/4 h-72 w-72 rounded-full bg-[#CDE7FF]/15 blur-3xl" />
          <div className="absolute bottom-[-40px] right-[15%] h-80 w-80 rounded-full bg-[#F6E0B6]/12 blur-3xl" />
          <div className="absolute bottom-[12%] left-[8%] h-56 w-56 rounded-full bg-[#F6E0B6]/10 blur-3xl" />
          <div className="absolute bottom-[4%] right-[8%] h-64 w-64 rounded-full bg-[#3E4B8E]/16 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center">
            <h2 className="mb-4 font-sans text-3xl font-semibold text-white">Популярные репетиторы</h2>
          </div>

          <div className="mt-0">
            <TutorCarousel tutors={tutors} />
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/tutors"
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-12 py-3 text-sm font-semibold text-white backdrop-blur-2xl transition hover:bg-white/20"
            >
              Смотреть всех
            </Link>
          </div>

          <div className="mt-16 flex flex-col items-center justify-center gap-6 px-2 py-4 text-center sm:px-4">
            <div>
              <h2 className="mb-10 font-sans text-3xl font-semibold text-white sm:text-4xl">
                Хотите преподавать?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-[#FFF4EB]/90">
                Присоединяйтесь к нашей платформе. Гибкий график, находите учеников сами, безопасные платежи и постоянная поддержка.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex rounded-full bg-[#F6E0B6] px-12 py-3 text-sm font-semibold text-[#3D1534] shadow-[0_10px_30px_rgba(255,240,224,0.22)] transition hover:opacity-90"
            >
              Стать репетитором
            </Link>
          </div>

          <div className="mt-16 pb-8">
            <div className="text-center mb-8">
              <h2 className="font-sans text-3xl font-semibold text-white mb-10">Частые вопросы</h2>
            </div>
            <FAQ />
          </div>
        </div>
      </section>
    </main>
  );
}
