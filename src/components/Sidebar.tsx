import { NavLink } from "react-router-dom";
import { Home, Users, BarChart, Shield, DollarSign, ClipboardList, Globe, Gamepad2 } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/standings", icon: BarChart, label: "Standings" },
  { to: "/roster", icon: Users, label: "Roster" },
  { to: "/lineup", icon: ClipboardList, label: "Lineup" },
  { to: "/buiha-overview", icon: Globe, label: "BUIHA Overview" },
  { to: "/play-game", icon: Gamepad2, label: "Play a Game" },
  { to: "/recruitment", icon: Shield, label: "Recruitment" },
  { to: "/finances", icon: DollarSign, label: "Finances" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-card border-r p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Ice Hockey Sim</h1>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;