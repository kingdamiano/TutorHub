'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type AvailabilitySlot = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  tutorProfile: string | { '@id'?: string };
};

type UserResponse = {
  id: number;
  tutorProfile?: string | { '@id'?: string } | null;
};

type MeResponse = {
  id: number;
  roles?: string[];
};

const dayNames = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie || '';
  const pairs = cookieString.split(';').map((p) => p.trim());
  const match = pairs.find((p) => p.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

function normalizeTime(value: string) {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
}

function formatTime(value: string) {
  if (!value) return value;

  const isoMatch = value.match(/T(\d{2}:\d{2}):\d{2}/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const simpleMatch = value.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (simpleMatch) {
    return simpleMatch[1];
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  return value;
}

export default function TutorAvailabilityPage() {
  const [token, setToken] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [tutorProfileIri, setTutorProfileIri] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const tokenValue = getCookieValue('token');
    setToken(tokenValue);
    if (!tokenValue) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${tokenValue}` },
        });

        if (meRes.status === 401) {
          deleteCookie('token');
          deleteCookie('userEmail');
          setSessionExpired(true);
          return;
        }

        if (!meRes.ok) {
          setHasAccess(false);
          return;
        }

        const meJson = (await meRes.json()) as MeResponse;

        if (!meJson.roles?.includes('ROLE_TUTOR')) {
          setHasAccess(false);
          return;
        }

        setMe(meJson);

        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${meJson.id}`, {
          headers: { Authorization: `Bearer ${tokenValue}`, Accept: 'application/ld+json' },
        });
        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userJson = (await userRes.json()) as UserResponse;
        setUser(userJson);

        const rawTp = userJson.tutorProfile ?? null;
        const iri = typeof rawTp === 'string' ? rawTp : rawTp?.['@id'] ?? null;
        if (!iri) {
          return;
        }

        setTutorProfileIri(iri);

        const availRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/availabilities`, {
          headers: { Authorization: `Bearer ${tokenValue}`, Accept: 'application/ld+json' },
        });
        if (!availRes.ok) {
          throw new Error('Failed to fetch availabilities');
        }

        const availJson = await availRes.json();
        const allSlots: AvailabilitySlot[] = availJson['hydra:member'] ?? [];
        const filtered = allSlots.filter((slot) => {
          const slotTp = typeof slot.tutorProfile === 'string' ? slot.tutorProfile : slot.tutorProfile?.['@id'];
          return slotTp === iri;
        });
        setAvailabilities(filtered);
      } catch (e: any) {
        setError(e.message ?? 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const groupedByDay = useMemo(() => {
    return availabilities.reduce<Record<number, AvailabilitySlot[]>>((acc, slot) => {
      const day = slot.dayOfWeek ?? 0;
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {});
  }, [availabilities]);

  const sortedGroupedByDay = useMemo(() => {
    const result: Record<number, AvailabilitySlot[]> = {};
    Object.entries(groupedByDay).forEach(([day, slots]) => {
      result[Number(day)] = [...slots].sort((a, b) => {
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });
    });
    return result;
  }, [groupedByDay]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tutorProfileIri) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body = {
        tutorProfile: tutorProfileIri,
        dayOfWeek: Number(dayOfWeek),
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/availabilities`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/ld+json',
          Accept: 'application/ld+json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 422) {
        const text = await res.text();
        setError(text || 'Этот слот конфликтует с существующими.');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Ошибка создания слота: ${res.status}`);
      }

      const created = await res.json();
      setAvailabilities((prev) => [...prev, created]);
      setSuccess('Слот успешно добавлен');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка при сохранении слота');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/availabilities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Ошибка удаления слота: ${res.status}`);
      }
      setAvailabilities((prev) => prev.filter((slot) => slot.id !== id));
      setSuccess('Слот удалён');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка при удалении слота');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Загрузка…
        </div>
      </main>
    );
  }

  if (sessionExpired) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <p className="text-sm leading-6 text-muted-foreground">
            Сессия истекла, пожалуйста, <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">войдите заново</Link>.
          </p>
        </section>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Эта страница доступна только репетиторам
        </div>
      </main>
    );
  }

  if (!tutorProfileIri) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Моё расписание</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Сначала создайте профиль репетитора.</p>
          <Link href="/tutor/profile" className="mt-5 inline-flex rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Перейти к созданию профиля
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Моё расписание</h1>
          <p className="text-sm leading-6 text-muted-foreground">Добавляйте и управляйте доступными слотами для уроков.</p>
        </header>

        {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Добавить новый слот</h2>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">День недели</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {dayNames.map((name, index) => (
                  <option key={name} value={index}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Начало</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Конец</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Сохраняем…' : 'Добавить слот'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Существующие слоты</h2>
          {availabilities.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-6 text-sm text-muted-foreground">
              Сейчас слотов нет.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {dayNames.map((name, index) => {
                const slots = sortedGroupedByDay[index] ?? [];
                if (slots.length === 0) return null;
                return (
                  <div key={index}>
                    <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">{name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm text-foreground">
                          <span>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(slot.id)}
                            disabled={deletingId === slot.id}
                            className="rounded-full border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingId === slot.id ? 'Удаляем…' : 'Удалить'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
