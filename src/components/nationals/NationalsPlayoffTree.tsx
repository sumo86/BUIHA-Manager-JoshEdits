import { NationalsPlayoffMatch, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NationalsPlayoffTreeProps {
  playoffSchedule: NationalsPlayoffMatch[];
  teams: Team[];
  userTeamName: string | undefined;
  onPlayGame: (gameId: string) => void;
  onSimulateGame: (gameId: string) => void;
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

const Matchup = ({ match, children, onPlayGame, onSimulateGame, userTeamName }: { match: NationalsPlayoffMatch, children?: React.ReactNode, onPlayGame: (gameId: string) => void, onSimulateGame: (gameId: string) => void, userTeamName: string | undefined }) => {
  const isUserGame = userTeamName && (
    (typeof match.homeTeam === 'string' && match.homeTeam === userTeamName) ||
    (typeof match.awayTeam === 'string' && match.awayTeam === userTeamName)
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="space-y-2 p-3 border rounded-lg bg-background w-64">
        <TeamBox team={match.homeTeam} score={match.result?.homeScore} isWinner={match.winner === match.homeTeam} />
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <TeamBox team={match.awayTeam} score={match.result?.awayScore} isWinner={match.winner === match.awayTeam} />
        {match.status === 'scheduled' && isUserGame && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="w-full" onClick={() => onPlayGame(match.id)}>Play Game</Button>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => onSimulateGame(match.id)}>Auto-Sim</Button>
          </div>
        )}
      </div>
      {children && <div className="flex justify-center w-full mt-4">{children}</div>}
    </div>
  );
};

const NationalsPlayoffTree = ({ playoffSchedule, userTeamName, onPlayGame, onSimulateGame }: NationalsPlayoffTreeProps) => {
  const semiFinals = playoffSchedule.filter(m => m.round === 'Semi-Final');
  const final = playoffSchedule.find(m => m.round === 'Final');

  return (
    <div className="flex flex-col items-center p-4 space-y-8">
      <h3 className="text-2xl font-bold">Playoff Bracket</h3>
      <div className="flex items-center">
        {/* Semi-Finals Column */}
        <div className="flex flex-col gap-16">
          {semiFinals.map(match => (
            <Matchup key={match.id} match={match} onPlayGame={onPlayGame} onSimulateGame={onSimulateGame} userTeamName={userTeamName} />
          ))}
        </div>

        {/* Connecting Lines and Final Column */}
        {final && (
          <>
            <div className="flex flex-col items-center h-full mx-8">
                <div className="w-px bg-border h-1/4"></div>
                <div className="h-1/2 w-8 border-y border-r rounded-r-md"></div>
                <div className="w-px bg-border h-1/4"></div>
            </div>
            <div className="flex items-center">
              <Matchup match={final} onPlayGame={onPlayGame} onSimulateGame={onSimulateGame} userTeamName={userTeamName} />
            </div>
          </>
        )}
      </div>
      {final?.winner && (
        <div className="mt-8 text-center">
            <p className="text-muted-foreground">Tournament Winner</p>
            <h4 className="text-3xl font-extrabold tracking-tight text-primary">{final.winner}</h4>
        </div>
      )}
    </div>
  );
};

export default NationalsPlayoffTree;