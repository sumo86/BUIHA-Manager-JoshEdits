import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from "react-router-dom";
import NotFound from "./pages/NotFound"; // Keep this one
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import Recruitment from "./pages/Recruitment";
import Finances from "./pages/Finances";
import Facilities from "./pages/Facilities";
import PlayerProfile from "./pages/PlayerProfile";
import Lineup from "./pages/Lineup";
import { TeamProvider, useTeam } from "./context/TeamContext";
import BuihaOverview from "./pages/BuihaOverview";
import Game from "./pages/Game";
import PlayGame from "./pages/PlayGame";
import MoralePage from "./pages/Morale"; // Correct import for MoralePage
import SeasonOverview from "./pages/SeasonOverview"; // Added missing import
import Calendar from "./pages/Calendar"; // Added missing import
import Training from "./pages/Training"; // Added missing import
import TeamSelection from "./pages/TeamSelection"; // Added missing import
import TeamHistory from "./pages/TeamHistory";
import NationalsPage from "./pages/Nationals";
import AlumniPage from "./pages/Alumni";
import NationalsGame from "./pages/NationalsGame";
import UpgradesPage from "./pages/Upgrades";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/season-overview" element={<SeasonOverview />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/player/:playerId" element={<PlayerProfile />} />
      <Route path="/recruitment" element={<Recruitment />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/morale" element={<MoralePage />} />
      <Route path="/upgrades" element={<UpgradesPage />} />
      <Route path="/lineup" element={<Lineup />} />
      <Route path="/training" element={<Training />} />
      <Route path="/history" element={<TeamHistory />} />
      <Route path="/alumni" element={<AlumniPage />} />
      <Route path="/nationals" element={<NationalsPage />} />
      <Route path="/buiha-overview" element={<BuihaOverview />} />
      <Route path="/play-game" element={<PlayGame />} />
      <Route path="/game/:opponentName" element={<Game />} />
      <Route path="/game/nationals/play/:division/:gameId" element={<NationalsGame />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

const AppContent = () => {
  const { userTeam } = useTeam();

  if (!userTeam) {
    return <TeamSelection />;
  }

  return <RouterProvider router={router} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TeamProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </TeamProvider>
  </QueryClientProvider>
);

export default App;