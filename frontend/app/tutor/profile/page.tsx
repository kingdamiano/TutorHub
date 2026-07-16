"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Subject = { '@id'?: string; id?: number; name?: string };

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie || '';
  const pairs = cookieString.split(';').map((p) => p.trim());
  const match = pairs.find((p) => p.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function TutorProfilePage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [tutorProfile, setTutorProfile] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

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

        // fetch user and subjects in parallel
        const [userRes, subjectsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${meJson.id}`, { headers: { Authorization: `Bearer ${t}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects`, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/ld+json' } }),
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u);
          // determine tutorProfile IRI
          const tp = u.tutorProfile ?? null;
          if (tp) {
            // if it's an object or IRI
            const iri = typeof tp === 'string' ? tp : tp['@id'] ?? null;
            if (iri) {
              const tpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/ld+json' } });
              if (tpRes.ok) {
                const tpJson = await tpRes.json();
                setTutorProfile(tpJson);
                setBio(tpJson.bio ?? '');
                setCity(tpJson.city ?? '');
                setPricePerHour(tpJson.pricePerHour ?? '');
                // subjects may be IRIs array or objects
                const subjIris: string[] = (tpJson.subjects ?? []).map((s: any) => (typeof s === 'string' ? s : s['@id']));
                setSelectedSubjects(subjIris.filter(Boolean));
              }
            }
          }
        }

        if (subjectsRes.ok) {
          const subjectsJson = await subjectsRes.json();
          const items = subjectsJson['hydra:member'] ?? subjectsJson ?? [];
          setSubjects(items as Subject[]);
        }
      } catch (e: any) {
        setMessage(e.message ?? 'Error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (!token) {
    return (
      <main>
        <h1>Мой профиль репетитора</h1>
        <p>Войдите, чтобы редактировать профиль. <Link href="/login">Войти</Link></p>
      </main>
    );
  }

  if (loading) return <div>Загрузка…</div>;

  if (!me?.roles?.includes('ROLE_TUTOR')) {
    return <div>Эта страница доступна только репетиторам</div>;
  }

  const handleSubjectToggle = (iri: string) => {
    setSelectedSubjects((prev) => (prev.includes(iri) ? prev.filter((p) => p !== iri) : [...prev, iri]));
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        user: `/api/users/${me.id}`,
        bio: bio || null,
        city: city || null,
        pricePerHour: pricePerHour || null,
        subjects: selectedSubjects,
        isApproved: false,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/ld+json',
          Accept: 'application/ld+json',
        },
        body: JSON.stringify(body),
      });

      // log full response status and body for debugging BEFORE checking res.ok
      const text = await res.text();
      console.log('POST /api/tutor_profiles status=', res.status);
      console.log('POST /api/tutor_profiles body=', text);

      if (!res.ok) {
        // If creation failed due to UNIQUE constraint on tutor_profile.user_id,
        // attempt to load the existing profile and switch to edit mode.
        if (text && text.toLowerCase().includes('unique constraint failed') && text.toLowerCase().includes('tutor_profile.user_id')) {
          console.warn('Creation failed with unique constraint; attempting to load existing tutor profile');
          try {
            // re-fetch user to get tutorProfile IRI
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${me.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (userRes.ok) {
              const userJson = await userRes.json();
              const tp = userJson.tutorProfile ?? null;
              const iri = typeof tp === 'string' ? tp : tp && tp['@id'] ? tp['@id'] : null;
              if (iri) {
                const tpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' } });
                const tpText = await tpRes.text();
                if (tpRes.ok) {
                  const tpJson = JSON.parse(tpText);
                  setTutorProfile(tpJson);
                  setBio(tpJson.bio ?? '');
                  setCity(tpJson.city ?? '');
                  setPricePerHour(tpJson.pricePerHour ?? '');
                  const subjIris: string[] = (tpJson.subjects ?? []).map((s: any) => (typeof s === 'string' ? s : s['@id']));
                  setSelectedSubjects(subjIris.filter(Boolean));
                  setMessage('Профиль уже существует — загружен для редактирования.');
                  return;
                }
              }
            }
          } catch (e) {
            console.error('Error while trying to load existing profile after unique constraint', e);
          }
        }

        // ensure we throw so UI doesn't show success for other errors
        throw new Error(`Failed to create profile: status=${res.status} body=${text}`);
      }

      // try to parse JSON (server may return JSON-LD)
      let created: any = null;
      try {
        created = JSON.parse(text);
      } catch (err) {
        // if parsing fails, still treat as error
        throw new Error(`Failed to parse creation response as JSON. Status=${res.status} body=${text}`);
      }

      // verify resource exists by fetching returned @id (if present)
      const iri = created['@id'] ?? (created.id ? `/api/tutor_profiles/${created.id}` : null);
      if (iri) {
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' } });
        const verifyText = await verifyRes.text();
        console.log('VERIFY GET', iri, 'status=', verifyRes.status, 'body=', verifyText);
        if (!verifyRes.ok) {
          throw new Error(`Creation reported success but verification failed: status=${verifyRes.status} body=${verifyText}`);
        }
        const verified = JSON.parse(verifyText);
        setTutorProfile(verified);
        setMessage('Профиль создан успешно.');
      } else {
        // fallback: fetch collection and check for profile with current user
        const coll = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' } });
        const collText = await coll.text();
        console.log('VERIFY COLLECTION status=', coll.status, 'body=', collText);
        if (!coll.ok) throw new Error(`Created but unable to verify in collection: status=${coll.status} body=${collText}`);
        const collJson = JSON.parse(collText);
        const items = collJson['hydra:member'] ?? collJson ?? [];
        const my = items.find((it: any) => {
          const u = it.user;
          if (typeof u === 'string') return u === `/api/users/${me.id}`;
          return u && (u['@id'] === `/api/users/${me.id}` || u.id === me.id);
        });
        if (!my) throw new Error('Profile not found in collection after creation');
        setTutorProfile(my);
        setMessage('Профиль создан успешно.');
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tutorProfile) return;
    setSaving(true);
    setMessage(null);
    try {
      const id = tutorProfile.id ?? tutorProfile['@id']?.split('/').pop();
      const iri = tutorProfile['@id'] ?? `/api/tutor_profiles/${id}`;
      const body: any = {
        bio: bio || null,
        city: city || null,
        pricePerHour: pricePerHour || null,
        subjects: selectedSubjects,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/merge-patch+json',
          Accept: 'application/ld+json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to update profile: ${res.status} ${txt}`);
      }

      const updated = await res.json();
      setTutorProfile(updated);
      setMessage('Профиль обновлён успешно.');
    } catch (e: any) {
      setMessage(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>Мой профиль репетитора</h1>
      {message && <div>{message} {tutorProfile && tutorProfile.id && <Link href={`/tutors/${tutorProfile.id}`}>Просмотреть профиль</Link>}</div>}

      <form onSubmit={tutorProfile ? handleUpdate : handleCreate}>
        <div>
          <label>Bio</label>
          <br />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} cols={60} />
        </div>

        <div>
          <label>City</label>
          <br />
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <label>Price per hour</label>
          <br />
          <input type="number" step="0.01" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} />
        </div>

        <div>
          <label>Subjects</label>
          <br />
          {subjects.length === 0 && <div>Загрузка предметов…</div>}
          {subjects.map((s) => (
            <div key={s['@id'] ?? s.id}>
              <label>
                <input type="checkbox" checked={selectedSubjects.includes(s['@id'] ?? `/api/subjects/${s.id}`)} onChange={() => handleSubjectToggle(s['@id'] ?? `/api/subjects/${s.id}`)} /> {s.name}
              </label>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving}>{tutorProfile ? 'Сохранить' : 'Создать профиль'}</button>
        </div>
      </form>
    </main>
  );
}
