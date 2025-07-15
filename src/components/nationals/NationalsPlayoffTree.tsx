import { NationalsPlayoffMatch, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NationalsPlayoffTreeProps {
  playoffSchedule: NationalsPlayoffMatch[];
  teams: Team[];
  userTeamName: string | undefined;
  onPlayGame: (gameId: string) => void;
  onSimulateGame: (gameId: string) => void;
  onSimulateSingleGame: (gameId: string) => void;
  bracket: 'Gold' | 'Silver';
}

const TeamBox = ({ team, score, isWinner }: { team: string | { winnerOf: string }, score?: number, isWinner?: boolean }) => {
  const teamName = typeof team === 'string' ? team : `Winner of ${team.winnerOf.substring(0, 4)}...`;
  return (
    <div className={cn("flex items-center justify-between p-2 border rounded-md bg-muted/50", isWinner && "font-bold border-primary")}>
      <span>{teamName}</span>
      {score !== undefined && <span className="font-bold">{score}</span>}
    </div>
  );
};

const Matchup = ({ match, onPlayGame, onSimulateGame, onSimulateSingleGame, userTeamName }: { match: NationalsPlayoffMatch, onPlayGame: (gameId: string) => void, onSimulateGame: (gameId: string) => void, onSimulateSingleGame: (gameId: string) => void, userTeamName: string | undefined }) => {
  const isUserGame = userTeamName && (
    (typeof match.homeTeam === 'string' && match.homeTeam === userTeamName) ||
    (typeof match.awayTeam === 'string' && match.awayTeam === userTeamName)
  );

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="space-y-2 p-3 border rounded-lg bg-background w-64 z-10">
        <TeamBox team={match.homeTeam} score={match.result?.homeScore} isWinner={match.winner === match.homeTeam} />
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <TeamBox team={match.awayTeam} score={match.result?.awayScore} isWinner={match.winner === match.awayTeam} />
        {match.status === 'scheduled' && isUserGame && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="w-full" onClick={() => onPlayGame(match.id)}>Play Game</Button>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => onSimulateGame(match.id)}>Auto-Sim</Button>
          </div>
        )}
        {match.status === 'scheduled' && !isUserGame && typeof match.homeTeam === 'string' && typeof match.awayTeam === 'string' && (
            <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => onSimulateSingleGame(match.id)}>Simulate Game</Button>
            </div>
        )}
      </div>
    </div>
  );
};

const NationalsPlayoffTree = ({ playoffSchedule, userTeamName, onPlayGame, onSimulateGame, onSimulateSingleGame, bracket }: NationalsPlayoffTreeProps) => {
  if (playoffSchedule.length === 0) {
    return (
        <div className="text-center py-10">
            <h3 className="text-2xl font-bold">{bracket} Bracket</h3>
            <p className="text-muted-foreground mt-2">No teams qualified for this bracket.</p>
        </div>
    )
  }

  const rounds = playoffSchedule.reduce((acc, match) => {
      const round = match.round;
      if (!acc[round]) {
          acc[round] = [];
      }
      acc[round].push(match);
      return acc;
  }, {} as Record<string, NationalsPlayoffMatch[]>);

  const roundOrder: ('Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final')[] = ['Preliminary', 'Quarter-Final', 'Semi-Final', 'Final'];
  const orderedRounds = roundOrder.filter(r => rounds[r]);
  const finalMatch = playoffSchedule.find(m => m.round === 'Final');

  return (
    <div className="p-4">
        <h3 className="text-2xl font-bold text-center mb-8">{bracket} Playoff Bracket</h3>
        <div className="flex justify-center items-start space-x-12 overflow-x-auto pb-8">
            {orderedRounds.map((roundName) => (
                <div key={roundName} className="flex flex-col items-center flex-shrink-0">
                    <h4 className="text-lg font-semibold mb-6 capitalize">{roundName.replace('-', ' ')}</h4>
                    <div className="flex flex-col gap-16">
                        {rounds[roundName].map(match => (
                            <Matchup 
                                key={match.id} 
                                match={match} 
                                onPlayGame={onPlayGame} 
                                onSimulateGame={onSimulateGame} 
                                onSimulateSingleGame={onSimulateSingleGame} 
                                userTeamName={userTeamName} 
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
        {finalMatch?.winner && (
            <div className="mt-8 text-center">
                <p className="text-muted-foreground">{bracket} Bracket Winner</p>
                <h4 className="text-3xl font-extrabold tracking-tight text-primary">{finalMatch.winner}</h4>
            </div>
        )}
    </div>
  );
};

export default NationalsPlayoffTree;