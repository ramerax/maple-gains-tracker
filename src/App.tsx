import { BrowserRouter, Routes, Route, Navigate, useLocation, type Location } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { AppShell } from '@/layouts/AppShell';
import { ROUTES } from '@/routes';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import HistoryPage from '@/pages/HistoryPage';
import StatsPage from '@/pages/StatsPage';
import SessionDetailPage from '@/pages/SessionDetailPage';
import ProfilesPage from '@/pages/ProfilesPage';
import StartSessionPage from '@/pages/StartSessionPage';
import FinishSessionPage from '@/pages/FinishSessionPage';
import AddSessionPage from '@/pages/AddSessionPage';

// Called directly (not as JSX <ModalRoutes/>) so <Routes> sees these as
// direct <Route> children via the Fragment — react-router's route-tree
// walker requires literal Route/Fragment children, not custom components.
function modalRoutes() {
  return (
    <>
      <Route path={ROUTES.sessionNew} element={<AddSessionPage />} />
      <Route path={ROUTES.sessionEditPattern} element={<AddSessionPage />} />
      <Route path={ROUTES.sessionStart} element={<StartSessionPage />} />
      <Route path={ROUTES.sessionStartEdit} element={<StartSessionPage />} />
      <Route path={ROUTES.sessionFinish} element={<FinishSessionPage />} />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <p className="text-sm text-text-muted">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    );
  }

  return (
    <ProfileProvider>
      {/* Main routes render against the background location when a modal is open,
          so the page underneath stays mounted while the modal overlay is shown. */}
      <Routes location={backgroundLocation ?? location}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.history} element={<HistoryPage />} />
          <Route path={ROUTES.stats} element={<StatsPage />} />
          <Route path={ROUTES.sessionDetailPattern} element={<SessionDetailPage />} />
          <Route path={ROUTES.profiles} element={<ProfilesPage />} />
        </Route>
        {!backgroundLocation && modalRoutes()}
        <Route path={ROUTES.login} element={<Navigate to={ROUTES.home} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>

      {backgroundLocation && <Routes>{modalRoutes()}</Routes>}
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
