"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie || '';
  const pairs = cookieString.split(';').map((p) => p.trim());
  const match = pairs.find((p) => p.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = getCookieValue('token');
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { headers: { Authorization: `Bearer ${t}` } });
        if (!meRes.ok) throw new Error('Failed to fetch /api/me');
        const meJson = await meRes.json();
        setMe(meJson);
        if (!meJson.roles || !meJson.roles.includes('ROLE_ADMIN')) {
          setError('Доступ только для администраторов');
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles?isApproved=false&rejected=false`, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/ld+json' } });
        if (!res.ok) throw new Error('Failed to fetch tutor profiles');
        const json = await res.json();
        const items = json['hydra:member'] ?? json ?? [];
        setProfiles(items);
      } catch (e: any) {
        setError(e.message ?? 'Error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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

  async function approve(profile: any) {
    if (!token) return;
    const iri = profile['@id'] ?? `/api/tutor_profiles/${profile.id}`;
    setProcessing((s) => [...s, iri]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles/${profile.id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json', Accept: 'application/ld+json' },
        body: JSON.stringify({ isApproved: true }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      // remove from list
      setProfiles((p) => p.filter((x) => (x['@id'] ?? `/api/tutor_profiles/${x.id}`) !== iri));
    } catch (e: any) {
      alert(e.message ?? 'Error');
    } finally {
      setProcessing((s) => s.filter((x) => x !== iri));
    }
  }

  async function reject(profile: any) {
    if (!token) return;
    const iri = profile['@id'] ?? `/api/tutor_profiles/${profile.id}`;
    setProcessing((s) => [...s, iri]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles/${profile.id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json', Accept: 'application/ld+json' },
        body: JSON.stringify({ rejected: true }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      // remove from list (processed)
      setProfiles((p) => p.filter((x) => (x['@id'] ?? `/api/tutor_profiles/${x.id}`) !== iri));
    } catch (e: any) {
      alert(e.message ?? 'Error');
    } finally {
      setProcessing((s) => s.filter((x) => x !== iri));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Модерация репетиторов</h1>
        <p className="text-sm leading-6 text-muted-foreground">Вы вошли как: {me?.email}</p>
      </div>

      {profiles.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-8 text-sm text-muted-foreground">
          Нет новых профилей для одобрения.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {profiles.map((p) => {
          const key = p['@id'] ?? `/api/tutor_profiles/${p.id}`;
          const isProcessing = processing.includes(key);

          return (
            <article key={key} className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {p.city ? (
                      <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm text-foreground">
                        {p.city}
                      </span>
                    ) : null}
                    {p.pricePerHour ? (
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
                        {p.pricePerHour} ₽/час
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{p.bio || 'Без описания.'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => approve(p)}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => reject(p)}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Отклонить
                  </button>
                  <Link href={`/tutors/${p.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                    Посмотреть
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
