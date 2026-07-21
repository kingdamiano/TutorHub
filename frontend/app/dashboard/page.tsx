'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleCheckBig, Clock3, XCircle } from 'lucide-react';

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

type User = {
  '@id'?: string;
  id?: number;
  email?: string;
};

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enrichedBookings, setEnrichedBookings] = useState<Array<Booking & { tutor?: TutorProfile | null; subjectObj?: Subject | null; studentObj?: User | null }>>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
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
      const studentMap: Record<string, User | null> = {};

      const tutorIris = Array.from(new Set(bookings.map((b) => b.tutorProfile).filter(Boolean) as string[]));
      const subjectIris = Array.from(new Set(bookings.map((b) => b.subject).filter(Boolean) as string[]));
      const studentIris = Array.from(new Set(bookings.map((b) => b.student).filter(Boolean) as string[]));

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

        const studentPromises = studentIris.map(async (iri) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
            });
            if (!res.ok) {
              studentMap[iri] = null;
              return;
            }
            const json = await res.json();
            studentMap[iri] = json as User;
          } catch (e) {
            studentMap[iri] = null;
          }
        });

      await Promise.all([...tutorPromises, ...subjectPromises, ...studentPromises]);

      if (cancelled) return;

      const enriched = bookings.map((b) => ({
        ...b,
        tutor: b.tutorProfile ? tutorMap[b.tutorProfile] ?? null : null,
        subjectObj: b.subject ? subjectMap[b.subject] ?? null : null,
        studentObj: b.student ? studentMap[b.student] ?? null : null,
      }));

      setEnrichedBookings(enriched);
    }

    enrich();

    return () => {
      cancelled = true;
    };
  }, [bookings, token]);

  async function updateBookingStatus(b: Booking, newStatus: string) {
    if (!token) return;
    const idOrIri = b['@id'] ?? (b.id ? `/api/bookings/${b.id}` : null);
    if (!idOrIri) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}${idOrIri}`;
    const key = idOrIri;
    setProcessingIds((s) => [...s, key]);
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/merge-patch+json',
          Accept: 'application/ld+json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update booking');

      // Update local state: bookings and enrichedBookings
      const updated = (await res.json()) as any;

      setBookings((prev) => prev.map((itm) => (itm['@id'] === updated['@id'] || itm.id === updated.id ? { ...itm, ...updated } : itm)));
      setEnrichedBookings((prev) =>
        prev.map((itm: any) => (itm['@id'] === updated['@id'] || itm.id === updated.id ? { ...itm, ...updated } : itm)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingIds((s) => s.filter((x) => x !== key));
    }
  }

  const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock3 }> = {
    pending: {
      label: 'В ожидании',
      className: 'border border-amber-200 bg-amber-50/80 text-amber-800',
      icon: Clock3,
    },
    confirmed: {
      label: 'Подтверждено',
      className: 'border border-emerald-200 bg-emerald-50/80 text-emerald-800',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Завершено',
      className: 'border border-slate-200 bg-slate-100/80 text-slate-700',
      icon: CircleCheckBig,
    },
    cancelled: {
      label: 'Отклонено',
      className: 'border border-rose-200 bg-rose-50/80 text-rose-700 line-through',
      icon: XCircle,
    },
  };

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Личный кабинет</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Войдите, чтобы увидеть личный кабинет.{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Войти
            </Link>
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Загрузка...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Ошибка: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Личный кабинет</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Здесь собраны ваши бронирования и действия по ним.
          </p>
        </header>

        {me && (
          <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Профиль</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-3 py-1">{me.email}</span>
              <span className="rounded-full border border-border bg-background px-3 py-1">
                {me.roles?.includes('ROLE_TUTOR') ? 'Репетитор' : 'Студент'}
              </span>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Мои бронирования</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {bookings.length === 0 ? 'Пока нет бронирований.' : 'Список актуальных заявок и уроков.'}
              </p>
            </div>
          </div>

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-6 text-sm text-muted-foreground">
              Нет бронирований.
            </div>
          )}

          <div className="space-y-4">
            {(enrichedBookings.length > 0 ? enrichedBookings : bookings).map((b) => {
              const anyB: any = b;
              const tutor = anyB.tutor ?? null;
              const subjectObj = anyB.subjectObj ?? null;
              const isTutor = me?.roles?.includes('ROLE_TUTOR');
              const studentEmail = anyB.studentObj?.email ?? b.student ?? '—';
              const bKey = b['@id'] ?? (b.id ? `/api/bookings/${b.id}` : String(b['@id'] ?? b.id));
              const normalizedStatus = (b.status ?? 'pending').toLowerCase();
              const statusInfo = statusConfig[normalizedStatus] ?? {
                label: b.status ?? '—',
                className: 'border border-border bg-muted/70 text-muted-foreground',
                icon: Clock3,
              };
              const BadgeIcon = statusInfo.icon;

              return (
                <article key={b['@id'] ?? b.id} className="rounded-2xl border border-border bg-background/80 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}>
                          <BadgeIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {subjectObj ? subjectObj.name ?? '—' : b.subject ?? '—'}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {tutor?.city ? `${tutor.city}` : 'Репетитор'}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {tutor?.bio ? tutor.bio : 'Подробности доступны после уточнения.'}
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Дата:</span> {b.startAt ?? '—'}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Длительность:</span> {b.durationMinutes ?? '—'} минут
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <p>
                      {isTutor ? `Студент: ${studentEmail}` : `Город/био репетитора: ${tutor?.city ?? '—'}${tutor?.bio ? ` · ${tutor.bio}` : ''}`}
                    </p>

                    {isTutor && (
                      <div className="flex flex-wrap gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={processingIds.includes(bKey)}
                              onClick={() => updateBookingStatus(b, 'confirmed')}
                              className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Подтвердить
                            </button>
                            <button
                              type="button"
                              disabled={processingIds.includes(bKey)}
                              onClick={() => updateBookingStatus(b, 'cancelled')}
                              className="rounded-full border border-destructive/40 bg-transparent px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Отклонить
                            </button>
                          </>
                        )}

                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={processingIds.includes(bKey)}
                            onClick={() => updateBookingStatus(b, 'completed')}
                            className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Завершить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
