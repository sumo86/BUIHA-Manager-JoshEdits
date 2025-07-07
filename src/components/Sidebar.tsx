import { NavLink } from "react-router-dom";
import { BarChart3, Landmark, LayoutDashboard, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "./made-with-dyad";

const Sidebar = () => {
  const navItems = [
    { to: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { to: "/standings", icon: <BarChart3 className="h-5 w-5" />, label: "Standings" },
    { to: "/roster", icon: <Users className="h-5 w-5" />, label: "Roster" },
    { to: "/recruitment", icon: <UserPlus className="h-5 w-5" />, label: "Recruitment" },
    { to: "/finances", icon: <Landmark className="h-5 w-5" />, label: "Finances" },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground p-4 flex flex-col justify-between">
      <div>
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold">BUIHA Sim</h1>
        </div>
        <nav className="mt-8">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <MadeWithDyad />
    </aside>
  );
};

export default Sidebar;