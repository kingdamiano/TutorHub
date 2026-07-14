'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Booking = {
  '@id'?: string;
  id?: number;
  student?: string;
  tutorProfile?: string;
  subject?: string;
  startAt?: string;
  durationMinutes?: number;
  status?: string;
};

type TutorProfile = {
  '@id'?: string;
  id?: number;
  user?: string;
  city?: string;
  bio?: string;
};

type Subject = {
  '@id'?: string;
  id?: number;
  name?: string;
};

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enrichedBookings, setEnrichedBookings] = useState<Array<Booking & { tutor?: TutorProfile | null; subjectObj?: Subject | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getCookieValue(name: string) {
    if (typeof document === 'undefined') return null;
    const cookieString = document.cookie;
    const pairs = cookieString.split(';').map((p) => p.trim());
    const match = pairs.find((p) => p.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  }

  useEffect(() => {
    const t = getCookieValue('token');
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!meRes.ok) throw new Error('Failed to fetch /api/me');
        const meJson = await meRes.json();
        setMe(meJson);

        const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
          headers: { Authorization: `Bearer ${t}`, Accept: 'application/ld+json' },
        });
        if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
        const bookingsJson = await bookingsRes.json();
        // bookingsJson could be a collection with 'hydra:member' or an array
        const items: Booking[] = bookingsJson['hydra:member'] ?? bookingsJson ?? [];

        setBookings(items);
      } catch (err: any) {
        setError(err.message ?? 'Error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Enrich bookings with tutorProfile and subject details
  useEffect(() => {
    if (!token || bookings.length === 0) {
      setEnrichedBookings([]);
      return;
    }

    let cancelled = false;

    async function enrich() {
      const tutorMap: Record<string, TutorProfile | null> = {};
      const subjectMap: Record<string, Subject | null> = {};

      const tutorIris = Array.from(new Set(bookings.map((b) => b.tutorProfile).filter(Boolean) as string[]));
      const subjectIris = Array.from(new Set(bookings.map((b) => b.subject).filter(Boolean) as string[]));

      const tutorPromises = tutorIris.map(async (iri) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
          });
          if (!res.ok) {
            tutorMap[iri] = null;
            return;
          }
          const json = await res.json();
          tutorMap[iri] = json as TutorProfile;
        } catch (e) {
          tutorMap[iri] = null;
        }
      });

      const subjectPromises = subjectIris.map(async (iri) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
          });
          if (!res.ok) {
            subjectMap[iri] = null;
            return;
          }
          const json = await res.json();
          subjectMap[iri] = json as Subject;
        } catch (e) {
          subjectMap[iri] = null;
        }
      });

      await Promise.all([...tutorPromises, ...subjectPromises]);

      if (cancelled) return;

      const enriched = bookings.map((b) => ({
        ...b,
        tutor: b.tutorProfile ? tutorMap[b.tutorProfile] ?? null : null,
        subjectObj: b.subject ? subjectMap[b.subject] ?? null : null,
      }));

      setEnrichedBookings(enriched);
    }

    enrich();

    return () => {
      cancelled = true;
    };
  }, [bookings, token]);

  if (!token) {
    return (
      <main>
        <h1>Личный кабинет</h1>
        <p>
          Войдите, чтобы увидеть личный кабинет. <Link href="/login">Войти</Link>
        </p>
      </main>
    );
  }

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <main>
      <h1>Личный кабинет</h1>
      {me && <div>Вы: {me.email} (roles: {JSON.stringify(me.roles)})</div>}
      <h2>Мои бронирования</h2>
      {bookings.length === 0 && <div>Нет бронирований.</div>}
      <ul>
        {(enrichedBookings.length > 0 ? enrichedBookings : bookings).map((b) => {
          const anyB: any = b;
          const tutor = anyB.tutor ?? null;
          const subjectObj = anyB.subjectObj ?? null;
          return (
            <li key={b['@id'] ?? b.id}>
              <div>Booking: {b['@id'] ?? b.id}</div>
              <div>
                Тьютор:{' '}
                {tutor ? (
                  <>
                    {tutor.city ?? '—'}{tutor.bio ? ` — ${tutor.bio}` : ''}
                  </>
                ) : (
                  b.tutorProfile ?? '—'
                )}
              </div>
              <div>Предмет: {subjectObj ? subjectObj.name ?? '—' : b.subject ?? '—'}</div>
              <div>Дата: {b.startAt ?? '—'}</div>
              <div>Длительность: {b.durationMinutes ?? '—'} минут</div>
              <div>Статус: {b.status ?? '—'}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
