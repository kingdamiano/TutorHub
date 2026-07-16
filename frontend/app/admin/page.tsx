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

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles?isApproved=false`, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/ld+json' } });
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

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  async function approve(profile: any) {
    if (!token) return;
    const iri = profile['@id'] ?? `/api/tutor_profiles/${profile.id}`;
    setProcessing((s) => [...s, iri]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json', Accept: 'application/ld+json' },
        body: JSON.stringify({ isApproved: false }),
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
    <main>
      <h1>Модерация репетиторов</h1>
      <p>Вы вошли как: {me?.email}</p>
      {profiles.length === 0 && <div>Нет новых профилей для одобрения.</div>}
      <ul>
        {profiles.map((p) => (
          <li key={p['@id'] ?? p.id} style={{ marginBottom: 12 }}>
            <div><strong>City:</strong> {p.city}</div>
            <div><strong>Price:</strong> {p.pricePerHour}</div>
            <div><strong>Bio:</strong> {p.bio}</div>
            <div style={{ marginTop: 6 }}>
              <button disabled={processing.includes(p['@id'] ?? `/api/tutor_profiles/${p.id}`)} onClick={() => approve(p)}>Одобрить</button>
              {' '}<Link href={p['@id'] ? p['@id'].replace('/api', '') : `/tutors/${p.id}`}>Посмотреть</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
