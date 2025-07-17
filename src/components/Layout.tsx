import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "./ui/button";
import { useTeam } from "@/context/TeamContext";
import { Calendar, ArrowRight, Save, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

const Layout = () => {
  const location = useLocation();
  const { 
    currentDate, 
    advanceWeek, 
    managedOrganization, 
    managedTeams, 
    userTeam, 
    setActiveTeam,
    isManagingOrg, // Added isManagingOrg here
    exitToMainMenu,
    saveGame
  } = useTeam();
  const isMobile = useIsMobile();
  const [saveName, setSaveName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const showHeaderButton = !location.pathname.startsWith("/game/");

  const handleSaveGame = () => {
    if (saveName.trim()) {
        saveGame(saveName.trim());
        setIsSaveDialogOpen(false);
        setSaveName("");
    } else {
        toast.error("Please enter a name for your save file.");
    }
  };

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
            {managedOrganization && isManagingOrg && (
              <div className="flex items-center gap-2 flex-shrink min-w-0">
                <span className="text-sm font-medium text-muted-foreground hidden md:inline">{managedOrganization}:</span>
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
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size={isMobile ? "icon" : "default"}>
                        <Save className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                        <span className="hidden md:inline">Save Game</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Save Game</DialogTitle>
                        <DialogDescription>
                            Enter a name for your save file. If a save with the same name exists, it will be overwritten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Save Name
                            </Label>
                            <Input
                                id="name"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                className="col-span-3"
                                placeholder="My Awesome Career"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveGame()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSaveGame}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exitToMainMenu} size={isMobile ? "icon" : "default"}>
                <LogOut className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                <span className="hidden md:inline">Exit to Menu</span>
            </Button>
            {showHeaderButton && (
              <Button onClick={advanceWeek} className="ml-2">
                <span className="hidden md:inline">Advance Week</span>
                <ArrowRight className="ml-0 md:ml-2 h-4 w-4" />
              </Button>
            )}
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