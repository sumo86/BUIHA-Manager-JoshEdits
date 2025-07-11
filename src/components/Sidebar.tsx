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
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/season-overview", label: "Season Overview", icon: Calendar }, // Added this back
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/lineup", label: "Lineup", icon: ClipboardList },
  { href: "/training", label: "Training", icon: BarChart3 },
  { href: "/recruitment", label: "Recruitment", icon: UserPlus },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/morale", label: "Morale", icon: Smile },
  { href: "/facilities", label: "Facilities", icon: Building },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/buiha-overview", label: "BUIHA", icon: Swords },
];

const Sidebar = () => {
  const { userTeam, advanceWeek, selectTeam, managedOrganization, managedTeams, setActiveTeam, selectOrganization, gameForCurrentWeek } = useTeam();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    selectTeam(null);
    selectOrganization(null);
    navigate('/team-selection');
  };

  const handlePlayGame = () => {
    if (!gameForCurrentWeek || !userTeam) return;
    const opponentName = gameForCurrentWeek.homeTeam === userTeam.name 
        ? gameForCurrentWeek.awayTeam 
        : gameForCurrentWeek.homeTeam;
    navigate(`/game/${opponentName}`);
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold">
            {userTeam?.logo && <img src={userTeam.logo} alt={userTeam.name} className="h-6 w-6 object-contain" />}
            <span className="">{managedOrganization || userTeam?.name}</span>
          </a>
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
          {managedOrganization && (
             <div className="px-4 mt-4">
                <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Your Teams
                </h3>
                <Accordion type="single" collapsible defaultValue={`item-${userTeam?.name}`}>
                    {managedTeams.map(team => (
                        <AccordionItem value={`item-${team.name}`} key={team.name}>
                            <AccordionTrigger 
                                className={cn("text-sm hover:no-underline", userTeam?.name === team.name && "text-primary")}
                                onClick={() => setActiveTeam(team.name)}
                            >
                                {team.name}
                            </AccordionTrigger>
                            <AccordionContent>
                                <Button variant="link" className="w-full justify-start" onClick={() => navigate('/roster')}>Roster</Button>
                                <Button variant="link" className="w-full justify-start" onClick={() => navigate('/lineup')}>Lineup</Button>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
             </div>
          )}
        </ScrollArea>
        <div className="mt-auto p-4 space-y-2">
          {gameForCurrentWeek && (
            <Button className="w-full justify-start" onClick={handlePlayGame}>
                <Play className="mr-2 h-4 w-4" />
                Play Game vs {gameForCurrentWeek.homeTeam === userTeam?.name ? gameForCurrentWeek.awayTeam : gameForCurrentWeek.homeTeam}
            </Button>
          )}
          <Button variant="secondary" className="w-full justify-start" onClick={advanceWeek}>
            <Calendar className="mr-2 h-4 w-4" />
            Advance Week
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Change Team
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;