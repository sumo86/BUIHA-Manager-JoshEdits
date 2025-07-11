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
  LogOut,
  Play,
  Home, // Added Home
  Banknote, // Added Banknote
  Dumbbell, // Added Dumbbell
  Smile // Added Smile for Morale
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define SidebarLink component
interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const SidebarLink = ({ to, icon: Icon, children }: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

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
          <nav className="flex-1 p-4 space-y-2">
            <SidebarLink to="/" icon={Home}>Dashboard</SidebarLink>
            <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</p>
            <SidebarLink to="/roster" icon={Users}>Roster</SidebarLink>
            <SidebarLink to="/lineup" icon={ClipboardList}>Lines & Tactics</SidebarLink>
            <SidebarLink to="/training" icon={Dumbbell}>Training</SidebarLink>
            <SidebarLink to="/calendar" icon={Calendar}>Calendar</SidebarLink>
            <SidebarLink to="/morale" icon={Smile}>Morale</SidebarLink>
            <SidebarLink to="/play" icon={Swords}>Friendly Match</SidebarLink>
            <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Club</p>
            <SidebarLink to="/finances" icon={Banknote}>Finances</SidebarLink>
            <SidebarLink to="/facilities" icon={Building}>Facilities</SidebarLink>
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