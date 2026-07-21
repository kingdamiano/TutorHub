import React from 'react';
import { Star } from 'lucide-react';
import BookingForm from './BookingForm';

interface TutorPageProps {
  params: Promise<{
    id: string;
  }>;
}

function getTutorTitle(tutor: any) {
  const bio = tutor?.bio?.trim();
  if (bio) {
    const words = bio.split(/\s+/).filter(Boolean).slice(0, 6);
    const preview = words.join(' ');
    return preview.length < bio.length ? `${preview}…` : preview;
  }

  if (tutor?.city) {
    return tutor.city;
  }

  return 'Репетитор';
}

function getInitials(tutor: any) {
  const source = [tutor?.bio, tutor?.city, tutor?.user?.email].filter(Boolean).join(' ');
  const words = source.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = words.map((word: string) => word[0]?.toUpperCase() ?? '').join('');
  return initials || 'T';
}

async function fetchTutor(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles/${id}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch tutor profile, status ${res.status}`);
  }
  return res.json();
}

async function fetchSubjectName(subjectIri: string) {
  const segments = subjectIri.split('/').filter(Boolean);
  const subjectId = segments[segments.length - 1];
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects/${subjectId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return 'Unknown subject';
  }
  const data = await res.json();
  return data.name ?? 'Unknown subject';
}

async function fetchTutorReviews(tutorIri: string) {
  const encodedTutorIri = encodeURIComponent(tutorIri);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reviews?booking.tutorProfile=${encodedTutorIri}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch reviews, status ${res.status}`);
  }

  return res.json();
}

export default async function TutorProfilePage({ params }: TutorPageProps) {
  const { id } = await params;
  const tutor = await fetchTutor(id);

  if (!tutor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Репетитор не найден</h1>
          <p className="mt-2 text-sm text-muted-foreground">Проверьте ссылку или вернитесь к каталогу.</p>
        </div>
      </main>
    );
  }

  const tutorIri = tutor['@id'] ?? `/api/tutor_profiles/${id}`;
  const reviews = await fetchTutorReviews(tutorIri);

  const subjectNames = await Promise.all(
    (tutor.subjects ?? []).map((subjectIri: string) => fetchSubjectName(subjectIri))
  );

  const subjectOptions = (tutor.subjects ?? []).map((subjectIri: string, index: number) => ({
    iri: subjectIri,
    name: subjectNames[index] ?? 'Unknown subject',
  }));

  const title = getTutorTitle(tutor);
  const initials = getInitials(tutor);
  const rating = tutor.rating !== undefined ? Number(tutor.rating).toFixed(1) : '—';
  const price = tutor.pricePerHour ?? '—';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-2xl font-semibold text-foreground">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
                <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground">
                  <Star className="mr-1 h-4 w-4 fill-current text-amber-500" />
                  {rating}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{tutor.bio ?? 'Подробное описание скоро появится.'}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1">{tutor.city ?? 'Город не указан'}</span>
                <span className="rounded-full border border-border bg-background px-3 py-1">Цена: {price} ₽/ч</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Подходит для:</p>
            <p className="mt-2">Индивидуальных занятий, подготовки к экзаменам и разборов сложных тем.</p>
          </div>
        </div>

        {subjectNames.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl font-semibold text-foreground">Предметы</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjectNames.map((name, index) => (
                <span key={`${name}-${index}`} className="rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-sm text-foreground">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)] sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Отзывы</h2>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
              {reviews['hydra:member']?.length ? `${reviews['hydra:member'].length} отзывов` : 'Пока нет отзывов'}
            </span>
          </div>

          {reviews['hydra:member'] && reviews['hydra:member'].length > 0 ? (
            <div className="mt-6 space-y-4">
              {reviews['hydra:member'].map((review: any) => {
                const roundedRating = Math.max(0, Math.min(5, Number(review.rating) || 0));

                return (
                  <article key={review.id} className="rounded-2xl border border-border bg-background/80 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={`${review.id}-${index}`} className={index < roundedRating ? 'h-4 w-4 fill-current' : 'h-4 w-4 text-muted-foreground/40'} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-foreground">
                      {review.comment ?? 'Нет комментария'}
                    </p>
                    {review.booking?.student && (
                      <p className="mt-3 text-sm text-muted-foreground">Студент: {review.booking.student}</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
              Отзывов пока нет — станьте первым, кто оставит впечатление о занятии.
            </div>
          )}
        </section>

        <BookingForm tutorProfileIri={tutorIri} subjectOptions={subjectOptions} />
      </div>
    </main>
  );
}
