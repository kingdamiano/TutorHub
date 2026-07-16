'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieString = document.cookie;
  const pairs = cookieString.split(';').map((part) => part.trim());
  const match = pairs.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = getCookieValue('token');
    const email = getCookieValue('userEmail');

    if (token && email) {
      setUserEmail(email);
      // fetch /api/me to determine roles
      (async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return;
          const j = await res.json();
          if (j.roles && Array.isArray(j.roles) && j.roles.includes('ROLE_TUTOR')) setIsTutor(true);
        } catch (e) {
          // ignore
        }
      })();
    } else {
      setUserEmail(null);
    }

    setIsLoaded(true);
  }, [pathname]);

  function handleLogout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    setUserEmail(null);
    router.push('/');
  }

  if (!isLoaded) {
    return <div>Загрузка...</div>;
  }

  if (userEmail) {
    return (
      <div>
        Вы вошли как: {userEmail} <Link href="/dashboard">Личный кабинет</Link>{' '}
        {isTutor && (<> | <Link href="/tutor/profile">Мой профиль репетитора</Link></>)}{' '}
        <button type="button" onClick={handleLogout}>Выйти</button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login">Войти</Link> | <Link href="/register">Регистрация</Link>
    </div>
  );
}
