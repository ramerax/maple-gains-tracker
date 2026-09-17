import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Navigate to a modal-overlay route (session forms) while keeping the
 * current page as the "background location" — react-router then renders
 * the modal on top instead of unmounting the page underneath.
 */
export function useOpenModal() {
  const navigate = useNavigate();
  const location = useLocation();

  return (path: string) => {
    navigate(path, { state: { backgroundLocation: location } });
  };
}
