import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "./ui/button";
import { useTeam } from "@/context/TeamContext";
import { Calendar, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveGameDialog } from "./dialogs/SaveGameDialog";
import { ExitGameDialog } from "./dialogs/ExitGameDialog";

const Layout = () => {
  const location = useLocation();
  const { 
    currentDate, 
    advanceWeek, 
    managedOrganization, 
    managedTeams, 
    userTeam, 
    setActiveTeam,
    isManagingOrg // Keep this for context, but not directly used in the condition below
  } = useTeam();
  const isMobile = useIsMobile();

  const showHeaderButton = !location.pathname.startsWith("/game/");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>{currentDate.month} {currentDate.year}, Week {currentDate.week}</span>
            </div>
            {managedOrganization && ( // Simplified condition: only check for managedOrganization
              <div className="flex items-center gap-2 flex-shrink min-w-0">
                <span className="text-sm font-medium text-muted-foreground hidden md:inline">{managedOrganization}:</span>
                {userTeam && ( // Ensure userTeam exists before trying to access its properties
                  <Select value={userTeam.name} onValueChange={setActiveTeam}>
                    <SelectTrigger className="w-[180px] md:w-[220px] h-9">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {managedTeams.map(team => (
                        <SelectItem key={team.name} value={team.name}>
                          <div className="flex items-center gap-2">
                            {team.logo && <img src={team.logo} alt={team.name} className="h-5 w-5 object-contain" />}
                            <span className="truncate">{team.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showHeaderButton && (
              <Button onClick={advanceWeek}>
                Advance Week
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <SaveGameDialog />
            <ExitGameDialog />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;