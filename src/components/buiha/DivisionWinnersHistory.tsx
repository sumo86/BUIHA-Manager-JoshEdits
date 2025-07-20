import { TeamSeasonHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface DivisionWinnersHistoryProps {
  standings: TeamSeasonHistory[];
}

const DivisionWinnersHistory = ({ standings }: DivisionWinnersHistoryProps) => {
  if (!standings || standings.length === 0) {
    return null; // Don't render anything if there's no data
  }

  const standingsByDivision: { [division: string]: TeamSeasonHistory[] } = standings.reduce((acc, team) => {
    const division = team.leagueDivision;
    if (!acc[division]) {
      acc[division] = [];
    }
    acc[division].push(team);
    return acc;
  }, {} as { [division: string]: TeamSeasonHistory[] });

  const winners = Object.entries(standingsByDivision).map(([division, divisionStandings]) => {
    const sortedStandings = [...divisionStandings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
      return b.goalsFor - a.goalsFor;
    });
    return { division, winner: sortedStandings[0] };
  });

  return (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">League Champions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {winners.map(({ division, winner }) => (
            <Card key={division}>
            <CardHeader>
                <CardTitle className="text-lg">{division}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                    <p className="font-semibold text-base">{winner.teamName}</p>
                    <p className="text-sm text-muted-foreground">{winner.wins}W - {winner.losses}L - {winner.draws}D ({winner.points} pts)</p>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
};

export default DivisionWinnersHistory;