import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Full-page modal overlay for route-based "modal" pages (session forms).
 * Closing navigates back — the underlying page (background location) is
 * still mounted, so back/close just drops the overlay route.
 */
export function Modal({ children, maxWidthClassName = 'max-w-2xl' }: {
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg-deep/80 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div
        className={`min-h-full w-full ${maxWidthClassName} bg-bg md:min-h-0 md:rounded-2xl md:border md:border-border md:shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
}
