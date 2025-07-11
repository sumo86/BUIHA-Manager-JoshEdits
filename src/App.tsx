import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Lineup from './pages/Lineup';
import Training from './pages/Training';
import Calendar from './pages/Calendar';
import Morale from './pages/Morale';
import Finances from './pages/Finances';
import Facilities from './pages/Facilities';
import Recruitment from './pages/Recruitment';
import PlayerProfile from './pages/PlayerProfile';
import Game from './pages/Game';
import PlayGame from './pages/PlayGame';
import TeamSelection from './pages/TeamSelection';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/team-selection" element={<TeamSelection />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="roster" element={<Roster />} />
          <Route path="player/:playerId" element={<PlayerProfile />} />
          <Route path="lineup" element={<Lineup />} />
          <Route path="training" element={<Training />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="morale" element={<Morale />} />
          <Route path="finances" element={<Finances />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="play" element={<PlayGame />} />
          <Route path="game/:opponentName" element={<Game />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;