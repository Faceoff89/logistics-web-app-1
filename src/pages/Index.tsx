import { useEffect, useState, Component, ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/sections/Dashboard';
import PlanningRail from '@/components/sections/PlanningRail';
import PlanningAuto from '@/components/sections/PlanningAuto';
import PlanningArrival from '@/components/sections/PlanningArrival';
import FlightsRail from '@/components/sections/FlightsRail';
import RailApproaches from '@/components/sections/RailApproaches';
import EquipmentSection from '@/components/sections/Equipment';
import Requests from '@/components/sections/Requests';
import Accounts from '@/components/sections/Accounts';
import Reports from '@/components/sections/Reports';
import Database from '@/components/sections/Database';
import { cn } from '@/lib/utils';

class SectionErrorBoundary extends Component<{ children: ReactNode; section: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; section: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromProps(_: unknown, state: { hasError: boolean }) {
    return state;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { section: string }) {
    if (prevProps.section !== this.props.section && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <p className="text-sm">Не удалось загрузить раздел. Попробуйте обновить страницу.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Index() {
  const { currentUser, section, sidebarOpen, restoreSession } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className={cn(
        'flex-1 flex flex-col min-w-0 transition-all duration-300',
        sidebarOpen ? 'lg:ml-60' : 'lg:ml-16',
      )}>
        <TopBar />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <SectionErrorBoundary section={section}>
            <div className="animate-fade-in">
              {section === 'dashboard' && <Dashboard />}
              {section === 'planning-rail' && <PlanningRail />}
              {section === 'planning-auto' && <PlanningAuto />}
              {section === 'planning-arrival' && <PlanningArrival />}
              {section === 'flights-rail' && <FlightsRail />}
              {section === 'rail-approaches' && <RailApproaches />}
              {section === 'equipment' && <EquipmentSection />}
              {section === 'requests' && <Requests />}
              {section === 'accounts' && <Accounts />}
              {section === 'reports' && <Reports />}
              {section === 'database' && <Database />}
            </div>
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
}