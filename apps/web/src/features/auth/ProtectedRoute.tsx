import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useCurrentUser } from './auth.queries';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();

  if (currentUser.isPending) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-[var(--color-canvas)] text-[var(--color-text)]"
        id="main-content"
      >
        <div className="flex items-center gap-3 text-sm font-medium">
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          Загружаем рабочее пространство
        </div>
      </main>
    );
  }

  if (!currentUser.data) {
    return <Navigate replace to="/login" />;
  }

  return children;
}
