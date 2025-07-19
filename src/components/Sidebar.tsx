import { useTeam } from "@/context/TeamContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  DollarSign,
  Building,
  Calendar,
  BarChart3,
  Trophy,
  UserPlus,
  Swords,
  ChevronDown,
  LogOut,
  Settings,
  Play,
  Smile,
  BookOpen,
  Wrench, // Added for Upgrades
  Swords as NationalsIcon, // Renaming to avoid conflict
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from 'sonner';

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/season-overview", label: "Season Overview", icon: Calendar }, // Added this back
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/lineup", label: "Lineup", icon: ClipboardList },
  { href: "/training", label: "Training", icon: BarChart3 },
  { href: "/recruitment", label: "Recruitment", icon: UserPlus },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/morale", label: "Morale", icon: Smile },
  { href: "/upgrades", label: "Upgrades", icon: Wrench },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/alumni", label: "Alumni", icon: Users },
  { href: "/nationals", label: "Nationals", icon: NationalsIcon },
  { href: "/buiha-overview", label: "BUIHA", icon: Swords },
];

const Sidebar = () => {
  const { userTeam, advanceWeek, selectTeam, gameForCurrentWeek } = useTeam();
  const navigate = useNavigate();

  const handlePlayGame = () => {
    if (gameForCurrentWeek) {
      navigate(`/game/${gameForCurrentWeek.opponent}`);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        {userTeam.logo && <img src={userTeam.logo} alt={userTeam.name} className="h-10 w-10 object-contain" />}
        <h1 className="text-xl font-bold">{userTeam.name}</h1>
      </div>
      <div className="space-y-2 mb-6">
        {gameForCurrentWeek && !gameForCurrentWeek.isNationals && (
          <Button className="w-full justify-start" size="lg" onClick={handlePlayGame}>
            <Play className="mr-2 h-4 w-4" />
            Play Game vs {gameForCurrentWeek.opponent}
          </Button>
        )}
        <Button variant="outline" className="w-full justify-start" onClick={advanceWeek}>
          <Calendar className="mr-2 h-4 w-4" />
          Advance Week
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "text-primary bg-muted"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;