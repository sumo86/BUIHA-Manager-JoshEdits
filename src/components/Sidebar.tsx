import { NavLink, useLocation } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Home, Trophy, Users, BarChart2, Briefcase, DollarSign, Heart, Building, ClipboardList, BookOpen, Calendar, Dumbbell, GraduationCap, Globe, LogOut, Save } from "lucide-react";
import { ExitGameDialog } from "./ExitGameDialog";

const navLinks = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/season-overview", label: "Season", icon: Calendar },
  { to: "/standings", label: "Standings", icon: BarChart2 },
  { to: "/roster", label: "Roster", icon: Users },
  { to: "/lineup", label: "Lineup", icon: ClipboardList },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/recruitment", label: "Recruitment", icon: Globe },
  { to: "/finances", label: "Finances", icon: DollarSign },
  { to: "/morale", label: "Morale", icon: Heart },
  { to: "/facilities", label: "Facilities", icon: Building },
  { to: "/history", label: "History", icon: BookOpen },
  { to: "/alumni", label: "Alumni", icon: GraduationCap },
  { to: "/nationals", label: "Nationals", icon: Trophy },
];

const Sidebar = () => {
  const { userTeam, saveGame, exitToMainMenu, isManagingOrg, managedOrganization } = useTeam();
  const location = useLocation();

  if (!userTeam) return null;

  const getNavLinkClass = (path: string) => {
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      location.pathname === path && "bg-muted text-primary"
    );
  };

  return (
    <aside className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <img src={userTeam.logo} alt={userTeam.name} className="h-6 w-6 object-contain" />
            <span>{isManagingOrg ? managedOrganization : userTeam.name}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={getNavLinkClass(link.to)}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 space-y-2 border-t">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={saveGame}>
            <Save className="h-4 w-4" />
            Save Game
          </Button>
          <ExitGameDialog onConfirm={exitToMainMenu}>
            <Button variant="destructive" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Exit to Main Menu
            </Button>
          </ExitGameDialog>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;