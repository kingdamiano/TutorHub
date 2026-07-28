"use client";

import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#3D1534] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 justify-items-center">
          <div>
            <h3 className="mb-3 font-semibold text-white/90">Платформа</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">Главная</Link>
              </li>
              <li>
                <Link href="/tutors" className="text-white/60 hover:text-white transition-colors text-sm">Каталог репетиторов</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white/90">Для студентов</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors text-sm">Личный кабинет</Link>
              </li>
              <li>
                <Link href="/register" className="text-white/60 hover:text-white transition-colors text-sm">Регистрация</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white/90">Для репетиторов</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-white/60 hover:text-white transition-colors text-sm">Стать репетитором</Link>
              </li>
              <li>
                <Link href="/tutor/profile" className="text-white/60 hover:text-white transition-colors text-sm">Мой профиль</Link>
              </li>
              <li>
                <Link href="/tutor/availability" className="text-white/60 hover:text-white transition-colors text-sm">Моё расписание</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-secondary/70 text-white shadow-sm">SL</span>
              <span className="font-sans text-base font-semibold tracking-tight text-white">Study Lamp</span>
            </div>

            <p className="text-sm text-white/70">© 2026 Study Lamp</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
