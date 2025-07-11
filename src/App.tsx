import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { TeamProvider } from "./context/TeamContext";
import Layout from "./components/Layout"; // Changed to default import
import TeamSelection from "./pages/TeamSelection";
import Dashboard from "./pages/Dashboard";
import Roster from "./pages/Roster";
import PlayerProfile from "./pages/PlayerProfile";
import Finances from "./pages/Finances";
import Facilities from "./pages/Facilities";
import Lineup from "./pages/Lineup";
import Training from "./pages/Training";
import Schedule from "./pages/Calendar";
import PlayGame from "./pages/PlayGame";
import Morale from "./pages/Morale";

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/team-selection" element={<TeamSelection />} />
          <Route path="/play/:gameId" element={<PlayGame />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="player/:playerId" element={<PlayerProfile />} />
            <Route path="finances" element={<Finances />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="lineup" element={<Lineup />} />
            <Route path="training" element={<Training />} />
            <Route path="morale" element={<Morale />} />
            <Route path="schedule" element={<Schedule />} />
          </Route>
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;