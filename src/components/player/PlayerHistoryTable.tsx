import { PlayerSeasonStats } from "@/types";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayerHistoryTableProps {
  history: PlayerSeasonStats[];
}

export const PlayerHistoryTable = ({ history }: PlayerHistoryTableProps) => {
  if (!history || history.length === 0) {
    return <p className="text-muted-foreground">No history available for this player.</p>;
  }

  const careerTotals = history.reduce(
    (acc, season) => {
      acc.gamesPlayed += season.gamesPlayed;
      acc.goals += season.goals;
      acc.assists += season.assists;
      acc.points += season.points;
      acc.penaltyMinutes += season.penaltyMinutes;
      return acc;
    },
    { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0 }
  );

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
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((season, index) => (
          <TableRow key={index}>
            <TableCell>{season.season}</TableCell>
            <TableCell>{season.team}</TableCell>
            <TableCell>{season.league}</TableCell>
            <TableCell className="text-right">{season.gamesPlayed}</TableCell>
            <TableCell className="text-right">{season.goals}</TableCell>
            <TableCell className="text-right">{season.assists}</TableCell>
            <TableCell className="text-right">{season.points}</TableCell>
            <TableCell className="text-right">{season.penaltyMinutes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="font-bold">
          <TableCell colSpan={3}>Career Totals</TableCell>
          <TableCell className="text-right">{careerTotals.gamesPlayed}</TableCell>
          <TableCell className="text-right">{careerTotals.goals}</TableCell>
          <TableCell className="text-right">{careerTotals.assists}</TableCell>
          <TableCell className="text-right">{careerTotals.points}</TableCell>
          <TableCell className="text-right">{careerTotals.penaltyMinutes}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};