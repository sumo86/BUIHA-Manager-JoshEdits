import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTeam } from '@/context/TeamContext';
import TeamSelection from '@/pages/TeamSelection';

const Layout = () => {
  const { userTeam } = useTeam();

  if (!userTeam) {
    return <TeamSelection />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;