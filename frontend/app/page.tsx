import Link from 'next/link';
import { cookies } from 'next/headers';

async function getPlatformStats() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

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

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = Boolean(token);
  const stats = await getPlatformStats();

  const steps = [
    {
      title: 'Найдите репетитора',
      description: 'Просматривайте профили, предметы и отзывы в одном удобном каталоге.',
    },
    {
      title: 'Забронируйте урок',
      description: 'Выбирайте удобное время и отправляйте заявку прямо через платформу.',
    },
    {
      title: 'Учитесь и оставляйте отзыв',
      description: 'После занятия можно оценить опыт и помочь другим студентам.',
    },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_-32px_rgba(15,23,42,0.28)]">
        <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center rounded-full border border-border bg-secondary/80 px-3 py-1 text-sm font-medium text-foreground">
              Study Lamp · современная платформа для обучения
            </span>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Найдите <em className="not-italic text-primary">идеального</em> репетитора для ваших целей
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              TutorHub помогает студентам быстро находить преподавателей по нужным предметам, бронировать занятия и получать поддержку в удобном формате.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tutors"
                className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Найти репетитора
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Стать репетитором
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-background/70 p-6 shadow-sm">
            <div className="rounded-[1.5rem] border border-border bg-card/80 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Почему студенты выбирают нас</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-border bg-background/80 p-4">
                  <p className="text-3xl font-semibold text-foreground">{stats.tutors}+</p>
                  <p className="mt-1 text-sm text-muted-foreground">репетиторов в каталоге</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/80 p-4">
                  <p className="text-3xl font-semibold text-foreground">{stats.rating.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">средний рейтинг</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/80 p-4">
                  <p className="text-3xl font-semibold text-foreground">{stats.lessons}+</p>
                  <p className="mt-1 text-sm text-muted-foreground">проведённых уроков</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Как это работает</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground">Просто, удобно и без лишних шагов</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-background/80 p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                0{index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
