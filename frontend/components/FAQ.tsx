'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'Как проходит оплата?',
    answer: 'Оплата производится через защищённую систему платежей. Средства удерживаются после подтверждения урока. Репетитор получает выплату после завершения занятия.',
  },
  {
    question: 'Можно ли отменить урок?',
    answer: 'Да, вы можете отменить урок за 24 часа до начала без штрафов. Отмена менее чем за 24 часа может повлечь удержание 50% от стоимости.',
  },
  {
    question: 'Как выбрать репетитора?',
    answer: 'Просмотрите профили репетиторов, их опыт, отзывы и рейтинги. Вы также можете написать в личное сообщение, чтобы уточнить детали до бронирования первого урока.',
  },
  {
    question: 'Что если урок не подошёл?',
    answer: 'Если вы не удовлетворены уроком, оставьте отзыв. При серьёзных проблемах свяжитесь с нашей поддержкой для обсуждения возможности возврата средств.',
  },
  {
    question: 'Как стать репетитором?',
    answer: 'Нажмите на кнопку "Стать репетитором", заполните анкету, добавьте информацию о себе, опыте и предметах. После модерации вы сможете начать принимать студентов.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-white/10"
            aria-expanded={openIndex === index}
          >
            <span className="font-semibold text-[#FFF4EB]">{faq.question}</span>
            <ChevronDown
              className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-in-out ${openIndex === index ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-white/10 bg-white/8 px-6 py-4 backdrop-blur-xl">
                <p className="text-sm leading-6 text-[#FFF4EB]/90">{faq.answer}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
