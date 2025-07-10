import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "./ui/button";
import { useTeam } from "@/context/TeamContext";
import { Calendar, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const location = useLocation();
  const { currentDate, advanceWeek } = useTeam();
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
          <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span>{currentDate.month} {currentDate.year}, Week {currentDate.week}</span>
          </div>
          {showHeaderButton && (
            <Button onClick={advanceWeek}>
              Advance Week
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;