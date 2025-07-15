import { Link } from 'react-router-dom';
import { Home, Users, DollarSign, Building, Calendar, Trophy, BarChart, BookOpen, GraduationCap, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeam } from '@/context/TeamContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

const Sidebar = () => {
  const { userTeam, managedTeams, isManagingOrg, selectTeam, selectOrganization, setActiveTeam } = useTeam();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Season Overview', icon: Calendar, path: '/season-overview' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Standings', icon: BarChart, path: '/standings' },
    { name: 'Roster', icon: Users, path: '/roster' },
    { name: 'Lineup', icon: Settings, path: '/lineup' },
    { name: 'Training', icon: BookOpen, path: '/training' },
    { name: 'Morale', icon: Users, path: '/morale' },
    { name: 'Recruitment', icon: GraduationCap, path: '/recruitment' },
    { name: 'Finances', icon: DollarSign, path: '/finances' },
    { name: 'Facilities', icon: Building, path: '/facilities' },
    { name: 'Nationals', icon: Trophy, path: '/nationals' },
    { name: 'Team History', icon: BookOpen, path: '/history' },
    { name: 'Alumni', icon: GraduationCap, path: '/alumni' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        BUIHA Manager
      </div>
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {userTeam && (
          <div className="mb-4">
            {isManagingOrg ? (
              <Collapsible open={isOrgMenuOpen} onOpenChange={setIsOrgMenuOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md">
                  <span>{userTeam.organization}</span>
                  {isOrgMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 mt-1 space-y-1">
                  {managedTeams.map(team => (
                    <Button
                      key={team.id}
                      variant="ghost"
                      className={`w-full justify-start text-left ${userTeam.name === team.name ? 'bg-gray-700' : ''}`}
                      onClick={() => setActiveTeam(team.name)}
                    >
                      {team.name}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left text-blue-300 hover:text-blue-100"
                    onClick={() => selectOrganization(null)}
                  >
                    Exit Organization View
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="text-lg font-semibold mb-2">
                {userTeam.name}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-blue-300 hover:text-blue-100 mt-2"
                  onClick={() => selectTeam(null)}
                >
                  Change Team
                </Button>
              </div>
            )}
          </div>
        )}

        {navItems.map((item) => (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className="w-full justify-start text-left text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Link to={item.path}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-sm text-gray-500">
        © 2024 BUIHA Manager
      </div>
    </div>
  );
};

export default Sidebar;