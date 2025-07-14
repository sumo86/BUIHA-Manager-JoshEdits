import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import Layout from './components/Layout';
import TeamSelection from './pages/TeamSelection';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Lineup from './pages/Lineup';
import PlayGame from './pages/PlayGame';
import Game from './pages/Game';
import Training from './pages/Training';
import Finances from './pages/Finances';
import Facilities from './pages/Facilities';
import Recruitment from './pages/Recruitment';
import Morale from './pages/Morale';
import Standings from './pages/Standings';
import TeamHistory from './pages/TeamHistory';
import BuihaOverview from './pages/BuihaOverview';
import PlayerProfile from './pages/PlayerProfile';
import Calendar from './pages/Calendar';
import Nationals from './pages/Nationals';
import Alumni from './pages/Alumni';
import SeasonOverview from './pages/SeasonOverview';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TeamSelection />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/lineup" element={<Lineup />} />
            <Route path="/play" element={<PlayGame />} />
            <Route path="/game/:opponentName" element={<Game />} />
            <Route path="/game/nationals/:division/:gameId" element={<Game />} />
            <Route path="/training" element={<Training />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/morale" element={<Morale />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/history" element={<TeamHistory />} />
            <Route path="/buiha" element={<BuihaOverview />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/nationals" element={<Nationals />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/season-overview" element={<SeasonOverview />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </TeamProvider>
  );
}

export default App;