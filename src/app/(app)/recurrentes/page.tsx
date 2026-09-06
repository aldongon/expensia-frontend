import { Suspense } from 'react';

import { RecurrentesPageContent } from '@/components/recurring/recurrentes-page-content';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';

export default function RecurrentesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton scope="tus gastos recurrentes" />}>
      <RecurrentesPageContent />
    </Suspense>
  );
}
