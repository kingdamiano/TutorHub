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

      console.log('Submitting availability body:', JSON.stringify(body), body);

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
    return <div>Загрузка…</div>;
  }

  if (!hasAccess) {
    return <div>Эта страница доступна только репетиторам</div>;
  }

  if (!tutorProfileIri) {
    return (
      <main>
        <h1>Моё расписание</h1>
        <p>Сначала создайте профиль репетитора</p>
        <Link href="/tutor/profile">Перейти к созданию профиля</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Моё расписание</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      <section>
        <h2>Добавить новый слот</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              День недели:{' '}
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                {dayNames.map((name, index) => (
                  <option key={name} value={index}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              Начало:{' '}
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Конец:{' '}
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <button type="submit" disabled={saving}>
              {saving ? 'Сохраняем…' : 'Добавить слот'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2>Существующие слоты</h2>
        {availabilities.length === 0 ? (
          <div>Сейчас слотов нет</div>
        ) : (
          dayNames.map((name, index) => {
            const slots = sortedGroupedByDay[index] ?? [];
            if (slots.length === 0) return null;
            return (
              <div key={index}>
                <h3>{name}</h3>
                <ul>
                  {slots.map((slot) => (
                    <li key={slot.id}>
                      {formatTime(slot.startTime)} — {formatTime(slot.endTime)}{' '}
                      <button
                        type="button"
                        onClick={() => handleDelete(slot.id)}
                        disabled={deletingId === slot.id}
                      >
                        {deletingId === slot.id ? 'Удаляем…' : 'Удалить'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
