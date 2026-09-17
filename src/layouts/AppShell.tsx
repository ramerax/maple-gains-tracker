import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';
import { useProfile } from '@/context/ProfileContext';
import { useOpenSessionPolling } from '@/hooks/useOpenSessionPolling';

export function AppShell() {
  const { activeProfileId } = useProfile();
  const openSession = useOpenSessionPolling(activeProfileId);

  return (
    <div className="flex h-full bg-bg">
      <div className="hidden md:flex">
        <Sidebar openSession={openSession} />
      </div>

      <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet context={{ openSession } satisfies AppShellContext} />
      </div>

      <div className="md:hidden">
        <MobileTabBar openSession={openSession} />
      </div>
    </div>
  );
}

export interface AppShellContext {
  openSession: ReturnType<typeof useOpenSessionPolling>;
}
