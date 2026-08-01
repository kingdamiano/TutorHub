import React from 'react';
import { Star } from 'lucide-react';
import BackgroundBlobs from '../../../components/BackgroundBlobs';
import BookingForm from './BookingForm';

interface TutorPageProps {
  params: Promise<{
    id: string;
  }>;
}

function getTutorTitle(tutor: any) {
  const name = tutor?.name?.trim();
  if (name) {
    return name;
  }

  return 'Репетитор';
}

function getInitials(tutor: any) {
  const source = [tutor?.bio, tutor?.city, tutor?.user?.email].filter(Boolean).join(' ');
  const words = source.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = words.map((word: string) => word[0]?.toUpperCase() ?? '').join('');
  return initials || 'T';
}

function resolvePhotoSrc(photo: string | null | undefined) {
  if (!photo) return '';
  if (/^https?:\/\//i.test(photo)) return photo;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  return `${baseUrl}${photo.startsWith('/') ? '' : '/'}${photo}`;
}

async function fetchTutor(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles/${id}`, {
      cache: 'no-store',
    });

    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSubjectName(subjectIri: string) {
  try {
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
  } catch {
    return 'Unknown subject';
  }
}

async function fetchTutorReviews(tutorIri: string) {
  try {
    const encodedTutorIri = encodeURIComponent(tutorIri);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/reviews?booking.tutorProfile=${encodedTutorIri}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return { 'hydra:member': [] };
    }

    return res.json();
  } catch {
    return { 'hydra:member': [] };
  }
}

export default async function TutorProfilePage({ params }: TutorPageProps) {
  const { id } = await params;
  const tutor = await fetchTutor(id);

  if (!tutor) {
    return (
      <main className="relative bg-[#3D1534] px-4 py-10 sm:px-6 lg:px-8">
        <BackgroundBlobs className="absolute inset-0 pointer-events-none" />

        <div className="mx-auto relative z-10 flex max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/95 p-8 text-center text-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
            <h1 className="font-sans text-2xl font-semibold text-foreground">Репетитор не найден</h1>
            <p className="mt-2 text-sm text-muted-foreground">Проверьте ссылку или вернитесь к каталогу.</p>
          </div>
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
  const hasPhoto = Boolean(tutor.photo);
  const photoSrc = resolvePhotoSrc(tutor.photo);

  return (
    <main className="relative bg-[#3D1534] px-4 py-10 sm:px-6 lg:px-8">
      <BackgroundBlobs className="absolute inset-0 pointer-events-none" />

      <div className="mx-auto relative z-10 max-w-6xl">
        <section className="rounded-[1.25rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-[#3D1534] shadow-sm">
                {hasPhoto ? (
                  <img
                    src={photoSrc}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-sans text-3xl font-semibold text-foreground">{title}</h1>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-foreground">
                    <Star className="mr-1 h-4 w-4 fill-current text-amber-500" />
                    {rating}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3D1534]">{tutor.bio ?? 'Подробное описание скоро появится.'}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#3D1534]">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-foreground">{tutor.city ?? 'Город не указан'}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-foreground">Цена: {price} ₽/ч</span>
                </div>
              </div>
            </div>

          </div>

          {subjectNames.length > 0 && (
            <div className="mt-8">
              <h2 className="font-sans text-xl font-semibold text-foreground">Предметы</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {subjectNames.map((name, index) => (
                  <span key={`${name}-${index}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-foreground">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.25rem] border border-[#3D1534]/10 bg-[#FFF4EB] p-6 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-2xl font-semibold text-foreground">Отзывы</h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-[#3D1534]">
                {reviews['hydra:member']?.length ? `${reviews['hydra:member'].length} отзывов` : 'Пока нет отзывов'}
              </span>
            </div>

            {reviews['hydra:member'] && reviews['hydra:member'].length > 0 ? (
              <div className="mt-6 space-y-4">
                {reviews['hydra:member'].map((review: any) => {
                  const roundedRating = Math.max(0, Math.min(5, Number(review.rating) || 0));

                  return (
                    <article key={review.id} className="rounded-2xl border border-[#3D1534]/10 bg-[#FFF4EB] p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${review.id}-${index}`}
                              className={
                                index < roundedRating
                                  ? 'h-4 w-4 fill-current'
                                  : 'h-4 w-4 text-muted-foreground/40'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm text-[#3D1534]">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU') : '—'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-foreground">{review.comment ?? 'Нет комментария'}</p>
                      {review.booking?.student && (
                        <p className="mt-3 text-sm text-[#3D1534]">Студент: {review.booking.student}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#3D1534]/10 bg-white p-6 text-sm text-[#3D1534]">
                Отзывов пока нет — станьте первым, кто оставит впечатление о занятии.
              </div>
            )}
          </section>

          <BookingForm tutorProfileIri={tutorIri} subjectOptions={subjectOptions} />
        </div>
      </div>
    </main>
  );
}
