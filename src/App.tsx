import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import Recruitment from "./pages/Recruitment";
import Finances from "./pages/Finances";
import Facilities from "./pages/Facilities";
import PlayerProfile from "./pages/PlayerProfile";
import Lineup from "./pages/Lineup";
import { TeamProvider } from "./context/TeamContext";
import BuihaOverview from "./pages/BuihaOverview";
import PlayGame from "./pages/PlayGame";
import Game from "./pages/Game";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/player/:playerId" element={<PlayerProfile />} />
      <Route path="/recruitment" element={<Recruitment />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/facilities" element={<Facilities />} />
      <Route path="/lineup" element={<Lineup />} />
      <Route path="/buiha-overview" element={<BuihaOverview />} />
      <Route path="/play-game" element={<PlayGame />} />
      <Route path="/game/:opponentName" element={<Game />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TeamProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </TeamProvider>
  </QueryClientProvider>
);

export default App;