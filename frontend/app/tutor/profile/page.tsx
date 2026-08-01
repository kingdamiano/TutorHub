"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import BackgroundBlobs from '../../../components/BackgroundBlobs';

type Subject = { '@id'?: string; id?: number; name?: string };

type FormSnapshot = {
  name: string;
  photo: string;
  bio: string;
  city: string;
  pricePerHour: string;
  selectedSubjects: string[];
};

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie || '';
  const pairs = cookieString.split(';').map((p) => p.trim());
  const match = pairs.find((p) => p.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function getAuthHeaders(tokenValue: string | null | undefined) {
  return {
    ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
    Accept: 'application/ld+json',
  };
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
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<FormSnapshot | null>(null);

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
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
        if (meRes.status === 401 || meRes.status === 403) {
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
          setToken(null);
          setMessage('Срок действия сессии истёк. Пожалуйста, войдите снова.');
          return;
        }
        if (!meRes.ok) throw new Error(`Failed to fetch /api/me: ${meRes.status}`);
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
                const normalizedTutorProfile = {
                  ...tpJson,
                  isApproved: tpJson.isApproved ?? false,
                };
                const subjIris: string[] = (tpJson.subjects ?? []).map((s: any) => (typeof s === 'string' ? s : s['@id']));
                const nextSnapshot: FormSnapshot = {
                  name: tpJson.name ?? '',
                  photo: tpJson.photo ?? '',
                  bio: tpJson.bio ?? '',
                  city: tpJson.city ?? '',
                  pricePerHour: tpJson.pricePerHour ?? '',
                  selectedSubjects: subjIris.filter(Boolean),
                };
                setTutorProfile(normalizedTutorProfile);
                applySnapshotToForm(nextSnapshot);
                setEditSnapshot(nextSnapshot);
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

  const getCurrentFormSnapshot = (): FormSnapshot => ({
    name,
    photo,
    bio,
    city,
    pricePerHour,
    selectedSubjects,
  });

  const applySnapshotToForm = (snapshot: FormSnapshot) => {
    setName(snapshot.name);
    setPhoto(snapshot.photo);
    setBio(snapshot.bio);
    setCity(snapshot.city);
    setPricePerHour(snapshot.pricePerHour);
    setSelectedSubjects(snapshot.selectedSubjects);
  };

  const startEditing = () => {
    setEditSnapshot(getCurrentFormSnapshot());
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (editSnapshot) {
      applySnapshotToForm(editSnapshot);
    }
    setIsEditing(false);
  };

  const isValidPhotoUrl = useMemo(() => {
    if (!photo) return false;
    try {
      new URL(photo);
      return true;
    } catch {
      return false;
    }
  }, [photo]);

  if (!token) {
    return (
      <main className="mx-auto flex max-w-[76rem] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          <h1 className="font-sans text-3xl font-semibold text-foreground">Мой профиль репетитора</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Войдите, чтобы редактировать профиль.{' '}
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
      <main className="mx-auto flex max-w-[76rem] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Загрузка…
        </div>
      </main>
    );
  }

  if (!me?.roles?.includes('ROLE_TUTOR')) {
    return (
      <main className="mx-auto flex max-w-[76rem] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]">
          Эта страница доступна только репетиторам
        </div>
      </main>
    );
  }

  const handleSubjectToggle = (iri: string) => {
    setSelectedSubjects((prev) => (prev.includes(iri) ? prev.filter((p) => p !== iri) : [...prev, iri]));
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const authToken = token ?? getCookieValue('token');
    if (!authToken) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        user: `/api/users/${me.id}`,
        name: name || null,
        photo: photo || null,
        bio: bio || null,
        city: city || null,
        pricePerHour: pricePerHour || null,
        subjects: selectedSubjects,
        isApproved: false,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
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
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${me.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            if (userRes.ok) {
              const userJson = await userRes.json();
              const tp = userJson.tutorProfile ?? null;
              const iri = typeof tp === 'string' ? tp : tp && tp['@id'] ? tp['@id'] : null;
              if (iri) {
                const tpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, { headers: getAuthHeaders(authToken) });
                const tpText = await tpRes.text();
                if (tpRes.ok) {
                  const tpJson = JSON.parse(tpText);
                  const subjIris: string[] = (tpJson.subjects ?? []).map((s: any) => (typeof s === 'string' ? s : s['@id']));
                  const nextSnapshot: FormSnapshot = {
                    name: tpJson.name ?? '',
                    photo: tpJson.photo ?? '',
                    bio: tpJson.bio ?? '',
                    city: tpJson.city ?? '',
                    pricePerHour: tpJson.pricePerHour ?? '',
                    selectedSubjects: subjIris.filter(Boolean),
                  };
                  setTutorProfile(tpJson);
                  applySnapshotToForm(nextSnapshot);
                  setEditSnapshot(nextSnapshot);
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
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${iri}`, { headers: getAuthHeaders(authToken) });
        const verifyText = await verifyRes.text();
        console.log('VERIFY GET', iri, 'status=', verifyRes.status, 'body=', verifyText);
        if (verifyRes.ok) {
          const verified = JSON.parse(verifyText);
          const savedSnapshot: FormSnapshot = {
            name: verified.name ?? name,
            photo: verified.photo ?? photo,
            bio: verified.bio ?? bio,
            city: verified.city ?? city,
            pricePerHour: verified.pricePerHour ?? pricePerHour,
            selectedSubjects: Array.isArray(verified.subjects) ? verified.subjects.map((s: any) => (typeof s === 'string' ? s : s['@id'])).filter(Boolean) : selectedSubjects,
          };
          setTutorProfile(verified);
          applySnapshotToForm(savedSnapshot);
          setEditSnapshot(savedSnapshot);
          setIsEditing(false);
          if (verified.isApproved) {
            setMessage('Профиль создан успешно.');
          } else {
            setMessage('Профиль создан успешно и отправлен на модерацию. Как только администратор его одобрит, он появится в публичном каталоге.');
          }
        } else if (verifyRes.status === 403) {
          console.warn('Verification returned 403 for an unapproved profile. Treating creation as successful for the owner.', verifyRes.status, verifyText);
          const savedSnapshot: FormSnapshot = {
            name: created.name ?? name,
            photo: created.photo ?? photo,
            bio: created.bio ?? bio,
            city: created.city ?? city,
            pricePerHour: created.pricePerHour ?? pricePerHour,
            selectedSubjects: Array.isArray(created.subjects) ? created.subjects.map((s: any) => (typeof s === 'string' ? s : s['@id'])).filter(Boolean) : selectedSubjects,
          };
          setTutorProfile(created);
          applySnapshotToForm(savedSnapshot);
          setEditSnapshot(savedSnapshot);
          setIsEditing(false);
          setMessage('Профиль создан успешно и отправлен на модерацию. Как только администратор его одобрит, он появится в публичном каталоге.');
        } else {
          throw new Error(`Creation reported success but verification failed: status=${verifyRes.status} body=${verifyText}`);
        }
      } else {
        // fallback: fetch collection and check for profile with current user
        const coll = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tutor_profiles`, { headers: getAuthHeaders(authToken) });
        const collText = await coll.text();
        console.log('VERIFY COLLECTION status=', coll.status, 'body=', collText);
        if (!coll.ok) {
          if (coll.status === 403) {
            const savedSnapshot: FormSnapshot = {
              name: created.name ?? name,
              photo: created.photo ?? photo,
              bio: created.bio ?? bio,
              city: created.city ?? city,
              pricePerHour: created.pricePerHour ?? pricePerHour,
              selectedSubjects: Array.isArray(created.subjects) ? created.subjects.map((s: any) => (typeof s === 'string' ? s : s['@id'])).filter(Boolean) : selectedSubjects,
            };
            setTutorProfile(created);
            applySnapshotToForm(savedSnapshot);
            setEditSnapshot(savedSnapshot);
            setIsEditing(false);
            setMessage('Профиль создан успешно и отправлен на модерацию. Как только администратор его одобрит, он появится в публичном каталоге.');
            return;
          }
          throw new Error(`Created but unable to verify in collection: status=${coll.status} body=${collText}`);
        }
        const collJson = JSON.parse(collText);
        const items = collJson['hydra:member'] ?? collJson ?? [];
        const my = items.find((it: any) => {
          const u = it.user;
          if (typeof u === 'string') return u === `/api/users/${me.id}`;
          return u && (u['@id'] === `/api/users/${me.id}` || u.id === me.id);
        });
        if (!my) throw new Error('Profile not found in collection after creation');
        const savedSnapshot: FormSnapshot = {
          name: my.name ?? name,
          photo: my.photo ?? photo,
          bio: my.bio ?? bio,
          city: my.city ?? city,
          pricePerHour: my.pricePerHour ?? pricePerHour,
          selectedSubjects: Array.isArray(my.subjects) ? my.subjects.map((s: any) => (typeof s === 'string' ? s : s['@id'])).filter(Boolean) : selectedSubjects,
        };
        setTutorProfile(my);
        applySnapshotToForm(savedSnapshot);
        setEditSnapshot(savedSnapshot);
        setIsEditing(false);
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
        name: name || null,
        photo: photo || null,
        bio: bio || null,
        city: city || null,
        pricePerHour: pricePerHour || null,
        subjects: selectedSubjects,
      };

      const wasApproved = Boolean(tutorProfile?.isApproved);
      console.log('wasApproved (from tutorProfile state):', wasApproved);
      console.log('tutorProfile full object:', tutorProfile);

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
      console.log('updated response from server:', updated);
      const updatedIsApproved = Boolean(updated?.isApproved);
      console.log('updatedIsApproved:', updatedIsApproved);
      const savedSnapshot: FormSnapshot = {
        name: updated?.name ?? name,
        photo: updated?.photo ?? photo,
        bio: updated?.bio ?? bio,
        city: updated?.city ?? city,
        pricePerHour: updated?.pricePerHour ?? pricePerHour,
        selectedSubjects: Array.isArray(updated?.subjects) ? updated.subjects.map((s: any) => (typeof s === 'string' ? s : s['@id'])).filter(Boolean) : selectedSubjects,
      };
      setTutorProfile({
        ...updated,
        isApproved: updated?.isApproved ?? false,
      });
      applySnapshotToForm(savedSnapshot);
      setEditSnapshot(savedSnapshot);
      setIsEditing(false);

      if (wasApproved && updatedIsApproved) {
        setMessage('Профиль обновлён успешно.');
      } else {
        setMessage('Профиль обновлён и отправлен на модерацию. Как только администратор его одобрит, он появится в публичном каталоге.');
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  const renderPageShell = (content: React.ReactNode) => (
    <main className="relative bg-[#3D1534] px-4 py-0 sm:px-6 lg:px-8">
      <BackgroundBlobs className="absolute inset-0 pointer-events-none" />
      <div className="mx-auto relative z-10 max-w-[76rem] px-4 py-8 sm:px-6 lg:px-8">
        {content}
      </div>
    </main>
  );

  return renderPageShell(
    <section className="rounded-[2rem] border border-border bg-[#FFF4EB] p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] sm:p-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-3xl font-semibold text-[#3D1534]">Мой профиль репетитора</h1>
        <p className="text-sm leading-6 text-[#3D1534]/80">
          Заполните информацию о себе, городе, стоимости и предметах, чтобы другие ученики могли вас найти.
        </p>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl border border-[#F6E0B6]/40 bg-[#F6E0B6]/20 px-4 py-3 text-sm text-[#3D1534] shadow-sm">
          {message}
          {tutorProfile?.isApproved && tutorProfile.id && (
            <Link href={`/tutors/${tutorProfile.id}`} className="ml-1 font-medium text-[#0B3D91] underline decoration-[#0B3D91]/40 underline-offset-4 transition hover:text-[#072b5f]">
              Просмотреть профиль
            </Link>
          )}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={tutorProfile ? handleUpdate : handleCreate} className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#3D1534]">Редактирование профиля</h2>
              <p className="text-sm text-[#3D1534]/70">Изменяйте данные и нажмите «Сохранить».</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Ссылка на фото</label>
            <input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="https://example.com/photo.jpg"
            />
            {isValidPhotoUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white/90 shadow-sm">
                <img src={photo} alt="Превью фото" className="h-52 w-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Расскажите о своём опыте и подходе к обучению"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Город</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Например, Москва"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Цена за час</label>
              <input
                type="number"
                step="1"
                min="1"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="3000"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Предметы</label>
            {subjects.length === 0 && <div className="text-sm text-muted-foreground">Загрузка предметов…</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.map((s) => {
                const iri = s['@id'] ?? `/api/subjects/${s.id}`;
                const active = selectedSubjects.includes(iri);
                return (
                  <label
                    key={iri}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-[#3D1534] hover:bg-[#F6E0B6] hover:text-[#3D1534]'}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      onChange={() => handleSubjectToggle(iri)}
                    />
                    {s.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {tutorProfile ? 'Сохранить' : 'Создать профиль'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-[#3D1534] transition hover:bg-[#F6E0B6]"
            >
              Отменить
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#F6E0B6]/50 bg-white/70 p-4">
            <div>
              <p className="font-sans text-sm font-medium text-[#3D1534]">Просмотр профиля</p>
              <p className="mt-1 text-sm text-[#3D1534]/75">Сейчас вы видите опубликованную информацию о себе. Нажмите кнопку, чтобы внести изменения.</p>
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-full border border-[#F6E0B6] bg-[#F6E0B6]/40 px-4 py-2 text-sm font-medium text-[#3D1534] transition hover:bg-[#F6E0B6]"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[#F6E0B6]/50 bg-white/80 p-5 shadow-sm">
              <p className="font-sans text-sm font-medium text-[#3D1534]">Имя</p>
              <p className="mt-2 text-lg font-semibold text-[#3D1534]">{name || 'Пока не указано'}</p>

              <p className="mt-5 font-sans text-sm font-medium text-[#3D1534]">Bio</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#3D1534]/80">{bio || 'Пока нет описания.'}</p>
            </div>

            <div className="rounded-2xl border border-[#F6E0B6]/50 bg-white/80 p-5 shadow-sm">
              <p className="font-sans text-sm font-medium text-[#3D1534]">Фото</p>
              {isValidPhotoUrl ? (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-white/90 shadow-sm">
                  <img src={photo} alt="Фото репетитора" className="h-52 w-full object-cover" />
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#3D1534]/70">Фото ещё не добавлено.</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#F6E0B6]/50 bg-white/80 p-5 shadow-sm">
              <p className="font-sans text-sm font-medium text-[#3D1534]">Город</p>
              <p className="mt-2 text-base font-semibold text-[#3D1534]">{city || 'Пока не указан'}</p>
            </div>
            <div className="rounded-2xl border border-[#F6E0B6]/50 bg-white/80 p-5 shadow-sm">
              <p className="font-sans text-sm font-medium text-[#3D1534]">Цена за час</p>
              <p className="mt-2 text-base font-semibold text-[#3D1534]">{pricePerHour ? `${pricePerHour} ₽/ч` : 'Пока не указана'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F6E0B6]/50 bg-white/80 p-5 shadow-sm">
            <p className="font-sans text-sm font-medium text-[#3D1534]">Предметы</p>
            {selectedSubjects.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSubjects.map((subjectIri) => {
                  const subject = subjects.find((item) => (item['@id'] ?? `/api/subjects/${item.id}`) === subjectIri);
                  return (
                    <span key={subjectIri} className="rounded-full border border-border bg-[#F6F6FF] px-3 py-1 text-sm font-medium text-[#0B3D91]">
                      {subject?.name ?? subjectIri}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#3D1534]/70">Предметы ещё не выбраны.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
