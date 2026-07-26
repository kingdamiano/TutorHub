'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TutorCard from './TutorCard';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type TutorProfile = {
  '@id'?: string;
  id?: number | string;
  city?: string | null;
  bio?: string | null;
  pricePerHour?: string | number | null;
  subjects?: Array<any> | null;
  user?: string | { id?: number | string; email?: string } | null;
};

type TutorCarouselProps = {
  tutors: Array<TutorProfile> | null;
};

export default function TutorCarousel({ tutors }: TutorCarouselProps) {
  if (!tutors || tutors.length === 0) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-8 text-center text-sm text-white/80">
        Репетиторов не найдено.
      </div>
    );
  }

  const carouselItems = [...tutors, ...tutors];

  return (
    <div className="space-y-6">
      <div className="relative">
        <button
          type="button"
          className="custom-prev absolute left-2 top-[40%] z-20 -translate-y-1/2 inline-flex rounded-full border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-xl transition hover:bg-[#F6E0B6] hover:text-[#3D1534] sm:left-4 sm:p-3"
          aria-label="Предыдущий репетитор"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <button
          type="button"
          className="custom-next absolute right-2 top-[40%] z-20 -translate-y-1/2 inline-flex rounded-full border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-xl transition hover:bg-[#F6E0B6] hover:text-[#3D1534] sm:right-4 sm:p-3"
          aria-label="Следующий репетитор"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="rounded-[1.5rem] px-10 py-2 sm:px-14 lg:px-16">
          <Swiper
            modules={[Navigation, Pagination]}
            loop={true}
            centeredSlides={true}
            slidesPerView={3}
            slidesPerGroup={1}
            spaceBetween={28}
            navigation={{ prevEl: '.custom-prev', nextEl: '.custom-next' }}
            pagination={{ clickable: true }}
            className="pb-10"
          >
            {carouselItems.map((tutor, index) => (
              <SwiperSlide key={`${tutor.id ?? tutor['@id'] ?? 'tutor'}-${index}`}>
                {({ isActive }) => (
                  <div className="h-full w-full px-1 sm:px-2 lg:px-3">
                    <div className="h-full">
                      <TutorCard tutor={tutor} isActive={isActive} />
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
