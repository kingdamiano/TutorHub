"use client";

import React, { useEffect, useState } from 'react';

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
    <main className="relative min-h-screen bg-[#3D1534] px-4 py-0 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-12 left-1/6 h-96 w-96 rounded-full bg-[#F6E0B6]/20 blur-3xl" />
        <div className="absolute top-[-40px] right-0 h-96 w-96 rounded-full bg-[#3E4B8E]/25 blur-3xl" />
        <div className="absolute bottom-8 left-1/4 h-72 w-72 rounded-full bg-[#CDE7FF]/15 blur-3xl" />
      </div>

      <div className="mx-auto relative z-10 max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-sans text-4xl font-semibold text-white">Модерация репетиторов</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/70">Вы вошли как: {me?.email}</p>
        </div>

        {profiles.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/10 px-6 py-8 text-sm text-[#F6E0B6] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl">
            Нет новых профилей для одобрения.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {profiles.map((p) => {
            const key = p['@id'] ?? `/api/tutor_profiles/${p.id}`;
            const isProcessing = processing.includes(key);

            return (
              <article key={key} className="rounded-[2rem] border border-white/10 bg-white/95 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {p.city ? (
                        <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm text-foreground">
                          {p.city}
                        </span>
                      ) : null}
                      {p.pricePerHour ? (
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-sm text-[wheat]">
                          {p.pricePerHour} ₽/час
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-7 text-foreground">{p.bio || 'Без описания.'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => approve(p)}
                      className="rounded-full bg-[#3E4B8E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f3a6e] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => reject(p)}
                      className="rounded-full border border-border bg-secondary/30 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
