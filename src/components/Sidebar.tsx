import { NavLink } from "react-router-dom";
import { Home, Users, Trophy, DollarSign, Building, Calendar, ClipboardList, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/context/TeamContext";

export const Sidebar = () => {
  const { userTeam } = useTeam();

  const navItems = [
    { to: "/", icon: Home, text: "Dashboard" },
    { to: "/roster", icon: Users, text: "Roster" },
    { to: "/lineup", icon: ClipboardList, text: "Lineup" },
    { to: "/training", icon: Trophy, text: "Training" },
    { to: "/morale", icon: Heart, text: "Morale" },
    { to: "/schedule", icon: Calendar, text: "Schedule" },
    { to: "/finances", icon: DollarSign, text: "Finances" },
    { to: "/facilities", icon: Building, text: "Facilities" },
  ];

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary truncate">{userTeam?.name || "Team"}</h1>
        <p className="text-sm text-muted-foreground truncate">{userTeam?.leagueDivision || "League"}</p>
      </div>
      <nav className="flex-grow p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span>{item.text}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};