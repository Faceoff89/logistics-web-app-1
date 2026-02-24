import { useAppStore } from '@/store/appStore';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/sections/Dashboard';
import PlanningRail from '@/components/sections/PlanningRail';
import PlanningAuto from '@/components/sections/PlanningAuto';
import FlightsRail from '@/components/sections/FlightsRail';
import EquipmentSection from '@/components/sections/Equipment';
import Requests from '@/components/sections/Requests';
import Accounts from '@/components/sections/Accounts';
import Reports from '@/components/sections/Reports';
import { cn } from '@/lib/utils';

export default function Index() {
  const { currentUser, section, sidebarOpen } = useAppStore();

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
          <div className="animate-fade-in">
            {section === 'dashboard' && <Dashboard />}
            {section === 'planning-rail' && <PlanningRail />}
            {section === 'planning-auto' && <PlanningAuto />}
            {section === 'flights-rail' && <FlightsRail />}
            {section === 'equipment' && <EquipmentSection />}
            {section === 'requests' && <Requests />}
            {section === 'accounts' && <Accounts />}
            {section === 'reports' && <Reports />}
          </div>
        </main>
      </div>
    </div>
  );
}