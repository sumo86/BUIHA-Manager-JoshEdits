import { NavLink } from "react-router-dom";
import { Home, Users, BarChart, Shield, DollarSign, ClipboardList, Globe, Gamepad2, Building, TrendingUp, CalendarDays, Trophy, ChevronsUpDown } from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/season-overview", icon: Trophy, label: "Season Overview" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/standings", icon: BarChart, label: "Standings" },
  { to: "/roster", icon: Users, label: "Roster" },
  { to: "/lineup", icon: ClipboardList, label: "Lineup" },
  { to: "/training", icon: TrendingUp, label: "Training" },
  { to: "/buiha-overview", icon: Globe, label: "BUIHA Overview" },
  { to: "/play-game", icon: Gamepad2, label: "Play a Game" },
  { to: "/recruitment", icon: Shield, label: "Recruitment" },
  { to: "/finances", icon: DollarSign, label: "Finances" },
  { to: "/facilities", icon: Building, label: "Facilities" },
];

const TeamSwitcher = () => {
    const { userTeam, managedTeams, setActiveTeam, managedOrganization } = useTeam();

    if (!managedOrganization || managedTeams.length <= 1) {
        return null;
    }

    return (
        <div className="mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center gap-2 truncate">
                            {userTeam?.logo && <img src={userTeam.logo} alt={userTeam.name} className="h-5 w-5 object-contain" />}
                            <span className="truncate font-semibold">{userTeam?.name}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    {managedTeams.map((team) => (
                        <DropdownMenuItem key={team.name} onSelect={() => setActiveTeam(team.name)}>
                            <div className="flex items-center gap-2">
                                {team.logo && <img src={team.logo} alt={team.name} className="h-5 w-5 object-contain" />}
                                <span>{team.name}</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

const Sidebar = () => {
  return (
    <aside className="w-64 bg-card border-r p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Ice Hockey Sim</h1>
      <TeamSwitcher />
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;