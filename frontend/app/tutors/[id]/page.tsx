import React from 'react';
import BookingForm from './BookingForm';

interface TutorPageProps {
  params: Promise<{
    id: string;
  }>;
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
      <main>
        <h1>Репетитор не найден</h1>
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

  return (
    <main>
      <h1>Профиль репетитора {id}</h1>
      <div>City: {tutor.city ?? 'N/A'}</div>
      <div>Bio: {tutor.bio ?? 'N/A'}</div>
      <div>Price per hour: {tutor.pricePerHour ?? 'N/A'}</div>
      {tutor.rating !== undefined && <div>Rating: {tutor.rating}</div>}
      <div>
        <h2>Subjects</h2>
        <ul>
          {subjectNames.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Отзывы</h2>
        {reviews['hydra:member'] && reviews['hydra:member'].length > 0 ? (
          <ul>
            {reviews['hydra:member'].map((review: any) => (
              <li key={review.id}>
                <div>Оценка: {review.rating}/5</div>
                <div>Комментарий: {review.comment ?? 'Нет комментария'}</div>
                <div>Дата: {new Date(review.createdAt).toLocaleString('ru-RU')}</div>
                {review.booking?.student && <div>Студент: {review.booking.student}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <div>Отзывов пока нет</div>
        )}
      </div>
      <BookingForm tutorProfileIri={tutorIri} subjectOptions={subjectOptions} />
    </main>
  );
}
