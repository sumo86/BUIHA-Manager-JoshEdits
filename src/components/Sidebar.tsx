import { NavLink } from "react-router-dom";
import { Home, Users, BarChart, Shield, DollarSign, ClipboardList, Globe, Gamepad2, Building, TrendingUp, CalendarDays, Trophy } from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOrganizationName } from "@/data/teams";

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

const Sidebar = () => {
  const { userTeam, userOrganizationTeams, setActiveTeam } = useTeam();

  return (
    <aside className="w-64 bg-card border-r p-4 flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Ice Hockey Sim</h1>
        {userTeam && <p className="text-sm text-muted-foreground">{getOrganizationName(userTeam.name)}</p>}
      </div>
      
      {userOrganizationTeams.length > 1 && userTeam && (
        <div className="mb-4">
          <Select value={userTeam.name} onValueChange={(teamName) => setActiveTeam(teamName)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {userOrganizationTeams.map(team => (
                <SelectItem key={team.name} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="flex flex-col space-y-2 flex-grow overflow-y-auto">
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