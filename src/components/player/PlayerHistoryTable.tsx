import { PlayerSeasonStats, Team, CurrentSeasonStats } from "@/types";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PlayerHistoryTableProps {
  history: PlayerSeasonStats[];
  isSkater: boolean;
  teams: Team[];
  currentStats?: CurrentSeasonStats;
  currentSeason?: string;
  currentTeamName?: string;
  currentLeagueName?: string;
}

export const PlayerHistoryTable = ({ history, isSkater, teams, currentStats, currentSeason, currentTeamName, currentLeagueName }: PlayerHistoryTableProps) => {
  if ((!history || history.length === 0) && (!currentStats || currentStats.gamesPlayed === 0)) {
    return <p className="text-muted-foreground">No history available for this player.</p>;
  }

  const findTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    return team?.logo;
  };

  if (isSkater) {
    const careerTotals = history.reduce(
      (acc, season) => {
        acc.gamesPlayed += season.gamesPlayed || 0;
        acc.goals += season.goals || 0;
        acc.assists += season.assists || 0;
        acc.points += season.points || 0;
        acc.penaltyMinutes += season.penaltyMinutes || 0;
        return acc;
      },
      { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0 }
    );

    if (currentStats) {
        careerTotals.gamesPlayed += currentStats.gamesPlayed || 0;
        careerTotals.goals += currentStats.goals || 0;
        careerTotals.assists += currentStats.assists || 0;
        careerTotals.points += currentStats.points || 0;
        careerTotals.penaltyMinutes += currentStats.penaltyMinutes || 0;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>League</TableHead>
            <TableHead className="text-right">GP</TableHead>
            <TableHead className="text-right">G</TableHead>
            <TableHead className="text-right">A</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">PIM</TableHead>
            <TableHead>Captaincy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentStats && currentStats.gamesPlayed > 0 && (
            <TableRow className="bg-primary/10 font-semibold">
              <TableCell>{currentSeason}*</TableCell>
              <TableCell className="flex items-center gap-2">
                {findTeamLogo(currentTeamName!) && <img src={findTeamLogo(currentTeamName!)} alt={currentTeamName} className="h-5 w-5 object-contain" />}
                {currentTeamName}
              </TableCell>
              <TableCell>{currentLeagueName}</TableCell>
              <TableCell className="text-right">{currentStats.gamesPlayed}</TableCell>
              <TableCell className="text-right">{currentStats.goals}</TableCell>
              <TableCell className="text-right">{currentStats.assists}</TableCell>
              <TableCell className="text-right">{currentStats.points}</TableCell>
              <TableCell className="text-right">{currentStats.penaltyMinutes}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          )}
          {history.map((season, index) => (
            <TableRow key={index}>
              <TableCell>{season.season}</TableCell>
              <TableCell className="flex items-center gap-2">
                {findTeamLogo(season.team) && <img src={findTeamLogo(season.team)} alt={season.team} className="h-5 w-5 object-contain" />}
                {season.team}
              </TableCell>
              <TableCell>{season.league}</TableCell>
              <TableCell className="text-right">{season.gamesPlayed}</TableCell>
              <TableCell className="text-right">{season.goals}</TableCell>
              <TableCell className="text-right">{season.assists}</TableCell>
              <TableCell className="text-right">{season.points}</TableCell>
              <TableCell className="text-right">{season.penaltyMinutes}</TableCell>
              <TableCell>
                {season.captaincy === 'C' && <span className="font-bold text-yellow-700">C</span>}
                {season.captaincy === 'A' && <span className="font-medium text-yellow-500">A</span>}
              </TableCell>
            </TableRow>
          )).reverse()}
        </TableBody>
        <TableFooter>
          <TableRow className="font-bold">
            <TableCell colSpan={3}>Career Totals</TableCell>
            <TableCell className="text-right">{careerTotals.gamesPlayed}</TableCell>
            <TableCell className="text-right">{careerTotals.goals}</TableCell>
            <TableCell className="text-right">{careerTotals.assists}</TableCell>
            <TableCell className="text-right">{careerTotals.points}</TableCell>
            <TableCell className="text-right">{careerTotals.penaltyMinutes}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  } else {
    // Goalie Table
    const careerTotals = history.reduce(
      (acc, season) => {
        const gp = season.gamesPlayed || 0;
        acc.gamesPlayed += gp;
        acc.shutouts += season.shutouts || 0;
        acc.gaaSum += (season.goalsAgainstAverage || 0) * gp;
        acc.svSum += (season.savePercentage || 0) * gp;
        return acc;
      },
      { gamesPlayed: 0, shutouts: 0, gaaSum: 0, svSum: 0 }
    );

    if (currentStats) {
        const gp = currentStats.gamesPlayed || 0;
        careerTotals.gamesPlayed += gp;
        careerTotals.shutouts += currentStats.shutouts || 0;
        careerTotals.gaaSum += (currentStats.goalsAgainstAverage || 0) * gp;
        careerTotals.svSum += (currentStats.savePercentage || 0) * gp;
    }

    const careerGAA = careerTotals.gamesPlayed > 0 ? (careerTotals.gaaSum / careerTotals.gamesPlayed).toFixed(2) : '0.00';
    const careerSV = careerTotals.gamesPlayed > 0 ? (careerTotals.svSum / careerTotals.gamesPlayed).toFixed(3) : '.000';

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>League</TableHead>
            <TableHead className="text-right">GP</TableHead>
            <TableHead className="text-right">GAA</TableHead>
            <TableHead className="text-right">SV%</TableHead>
            <TableHead className="text-right">SO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentStats && currentStats.gamesPlayed > 0 && (
             <TableRow className="bg-primary/10 font-semibold">
                <TableCell>{currentSeason}*</TableCell>
                <TableCell className="flex items-center gap-2">
                    {findTeamLogo(currentTeamName!) && <img src={findTeamLogo(currentTeamName!)} alt={currentTeamName} className="h-5 w-5 object-contain" />}
                    {currentTeamName}
                </TableCell>
                <TableCell>{currentLeagueName}</TableCell>
                <TableCell className="text-right">{currentStats.gamesPlayed}</TableCell>
                <TableCell className="text-right">{currentStats.goalsAgainstAverage?.toFixed(2)}</TableCell>
                <TableCell className="text-right">{currentStats.savePercentage?.toFixed(3)}</TableCell>
                <TableCell className="text-right">{currentStats.shutouts}</TableCell>
            </TableRow>
          )}
          {history.map((season, index) => (
            <TableRow key={index}>
              <TableCell>{season.season}</TableCell>
              <TableCell className="flex items-center gap-2">
                {findTeamLogo(season.team) && <img src={findTeamLogo(season.team)} alt={season.team} className="h-5 w-5 object-contain" />}
                {season.team}
              </TableCell>
              <TableCell>{season.league}</TableCell>
              <TableCell className="text-right">{season.gamesPlayed}</TableCell>
              <TableCell className="text-right">{season.goalsAgainstAverage?.toFixed(2)}</TableCell>
              <TableCell className="text-right">{season.savePercentage?.toFixed(3)}</TableCell>
              <TableCell className="text-right">{season.shutouts}</TableCell>
            </TableRow>
          )).reverse()}
        </TableBody>
        <TableFooter>
          <TableRow className="font-bold">
            <TableCell colSpan={3}>Career Totals</TableCell>
            <TableCell className="text-right">{careerTotals.gamesPlayed}</TableCell>
            <TableCell className="text-right">{careerGAA}</TableCell>
            <TableCell className="text-right">{careerSV}</TableCell>
            <TableCell className="text-right">{careerTotals.shutouts}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  }
};