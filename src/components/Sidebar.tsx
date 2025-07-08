import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Landmark,
  LayoutDashboard,
  Users,
  Calendar,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "./made-with-dyad";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/standings", icon: Calendar, label: "Standings" },
  { href: "/roster", icon: Users, label: "Roster" },
  { href: "/lineup", icon: ClipboardList, label: "Lineup" },
  { href: "/recruitment", icon: UserPlus, label: "Recruitment" },
  { href: "/finances", icon: Landmark, label: "Finances" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground p-4 flex flex-col justify-between">
      <div>
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold">BUIHA Sim</h1>
        </div>
        <nav className="mt-8">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                    )
                  }
                >
                  <item.icon />
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