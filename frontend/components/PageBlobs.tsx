'use client';

type PageBlobsVariant = 'default' | 'admin' | 'availability' | 'profile' | 'catalog' | 'tutorPage';

const blobVariants: Record<PageBlobsVariant, string[]> = {
  default: [
    'top-8 left-10 h-[20rem] w-[20rem] rounded-full bg-[#F6E0B6]/28 blur-[5rem]',
    'top-[-48px] right-0 h-[16rem] w-[16rem] rounded-full bg-[#3E4B8E]/32 blur-[4.5rem]',
    'top-24 right-24 h-44 w-44 rounded-full bg-[#CDE7FF]/22 blur-[4rem]',
    'bottom-10 left-[14%] h-72 w-72 rounded-full bg-[#CDE7FF]/26 blur-[4.5rem]',
    'bottom-24 right-28 h-52 w-52 rounded-full bg-[#F6E0B6]/18 blur-[4rem]',
  ],
  admin: [
    'top-20 left-6 h-56 w-56 rounded-full bg-[#F6E0B6]/28 blur-[4rem]',
    'top-6 right-24 h-48 w-48 rounded-full bg-[#3E4B8E]/32 blur-[4rem]',
    'top-40 left-28 h-40 w-40 rounded-full bg-[#CDE7FF]/20 blur-[3.5rem]',
    'bottom-18 right-20 h-56 w-56 rounded-full bg-[#F6E0B6]/18 blur-[4rem]',
    'bottom-6 left-20 h-44 w-44 rounded-full bg-[#3E4B8E]/20 blur-[3.8rem]',
  ],
  availability: [
    'top-4 left-6 h-48 w-48 rounded-full bg-[#F6E0B6]/26 blur-[3.5rem]',
    'top-12 right-12 h-64 w-64 rounded-full bg-[#3E4B8E]/32 blur-[4rem]',
    'top-32 left-28 h-40 w-40 rounded-full bg-[#F6E0B6]/20 blur-[3.5rem]',
    'bottom-10 left-16 h-52 w-52 rounded-full bg-[#CDE7FF]/22 blur-[3.5rem]',
    'bottom-24 right-20 h-40 w-40 rounded-full bg-[#F6E0B6]/18 blur-[3.5rem]',
  ],
  profile: [
    'top-14 left-8 h-48 w-48 rounded-full bg-[#F6E0B6]/26 blur-[4rem]',
    'top-2 right-6 h-52 w-52 rounded-full bg-[#3E4B8E]/28 blur-[4rem]',
    'top-28 right-24 h-36 w-36 rounded-full bg-[#CDE7FF]/20 blur-[3rem]',
    'bottom-20 left-18 h-56 w-56 rounded-full bg-[#CDE7FF]/24 blur-[3.5rem]',
    'bottom-6 right-20 h-42 w-42 rounded-full bg-[#F6E0B6]/20 blur-[3.5rem]',
  ],
  catalog: [
    'top-8 left-16 h-64 w-64 rounded-full bg-[#F6E0B6]/26 blur-[4rem]',
    'top-[-32px] right-8 h-52 w-52 rounded-full bg-[#3E4B8E]/32 blur-[3.5rem]',
    'top-24 right-32 h-44 w-44 rounded-full bg-[#F6E0B6]/20 blur-[3.5rem]',
    'bottom-14 left-12 h-56 w-56 rounded-full bg-[#CDE7FF]/24 blur-[4rem]',
    'bottom-24 right-10 h-48 w-48 rounded-full bg-[#F6E0B6]/20 blur-[3.5rem]',
  ],
  tutorPage: [
    'top-10 left-6 h-56 w-56 rounded-full bg-[#F6E0B6]/24 blur-[3.8rem]',
    'top-16 right-10 h-64 w-64 rounded-full bg-[#3E4B8E]/30 blur-[4.2rem]',
    'top-32 left-28 h-40 w-40 rounded-full bg-[#CDE7FF]/22 blur-[3.5rem]',
    'bottom-12 right-16 h-52 w-52 rounded-full bg-[#CDE7FF]/22 blur-[3.8rem]',
    'bottom-24 left-16 h-44 w-44 rounded-full bg-[#F6E0B6]/18 blur-[3.8rem]',
  ],
};

interface PageBlobsProps {
  variant?: PageBlobsVariant;
}

export default function PageBlobs({ variant = 'default' }: PageBlobsProps) {
  const blobs = blobVariants[variant] ?? blobVariants.default;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,224,182,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(62,75,142,0.2),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(205,231,255,0.14),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(61,21,52,0.24)_0%,rgba(61,21,52,0.9)_100%)]" />
      {blobs.map((blob, index) => (
        <div key={index} className={`absolute ${blob}`} />
      ))}
    </div>
  );
}
