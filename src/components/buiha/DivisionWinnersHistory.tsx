import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

// Define the type for the logs received from BuihaOverview
interface DivisionWinnerLog {
  teamName: string;
  season: string;
  division: string;
}

interface DivisionWinnersHistoryProps {
  standings: DivisionWinnerLog[]; // Changed type here
}

const DivisionWinnersHistory = ({ standings }: DivisionWinnersHistoryProps) => {
  if (!standings || standings.length === 0) {
    return null; // Don't render anything if there's no data
  }

  // The 'standings' prop already contains the winners, no need to re-calculate
  // The previous logic was trying to sort by points/goals which are not in this log type.
  // We just display the provided logs.

  return (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">Division Champions</h3> {/* Changed title for clarity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standings.map((winnerLog, index) => ( // Iterate directly over standings
            <Card key={`${winnerLog.teamName}-${winnerLog.season}-${winnerLog.division}-${index}`}>
            <CardHeader>
                <CardTitle className="text-lg">{winnerLog.division} - {winnerLog.season}</CardTitle> {/* Display season and division */}
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                    <p className="font-semibold text-base">{winnerLog.teamName}</p>
                    {/* Removed points/wins/losses as they are not in this log type */}
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
};

export default DivisionWinnersHistory;