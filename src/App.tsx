import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import PlayerProfile from './pages/PlayerProfile';
import Lineup from './pages/Lineup';
import Training from './pages/Training';
import Finances from './pages/Finances';
import Facilities from './pages/Facilities';
import Recruitment from './pages/Recruitment';
import TeamSelection from './pages/TeamSelection';
import PlayGame from './pages/PlayGame';
import Game from './pages/Game';
import Standings from './pages/Standings';
import Calendar from './pages/Calendar';
import SeasonOverview from './pages/SeasonOverview';
import Morale from './pages/Morale';
import TeamHistory from './pages/TeamHistory';
import BuihaOverview from './pages/BuihaOverview';
import NationalsPage from './pages/Nationals';
import AlumniPage from './pages/Alumni';
import NotFound from './pages/NotFound';

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/team-selection" element={<TeamSelection />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="player/:playerId" element={<PlayerProfile />} />
            <Route path="lineup" element={<Lineup />} />
            <Route path="training" element={<Training />} />
            <Route path="finances" element={<Finances />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="play-game" element={<PlayGame />} />
            <Route path="game/:opponentName" element={<Game />} />
            <Route path="game/nationals/:division/:gameId" element={<Game />} />
            <Route path="standings" element={<Standings />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="season-overview" element={<SeasonOverview />} />
            <Route path="morale" element={<Morale />} />
            <Route path="team-history" element={<TeamHistory />} />
            <Route path="buiha" element={<BuihaOverview />} />
            <Route path="nationals" element={<NationalsPage />} />
            <Route path="alumni" element={<AlumniPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;