'use client';

import { usePathname } from 'next/navigation';
import PageBlobs from './PageBlobs';

export default function PageBackground() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }

  return <PageBlobs />;
}
