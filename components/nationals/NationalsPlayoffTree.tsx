import { NationalsPlayoffMatch, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

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

const Matchup = ({ match, onPlayGame, onSimulateGame, userTeamName }: { match: NationalsPlayoffMatch, onPlayGame: (gameId: string) => void, onSimulateGame: (gameId: string) => void, userTeamName: string | undefined }) => {
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
    </div>
  );
};

const BracketView = ({ title, matches, ...props }: { title: string, matches: NationalsPlayoffMatch[] } & Omit<NationalsPlayoffTreeProps, 'playoffSchedule' | 'teams'>) => {
  const rounds: ('Quarter-Final' | 'Semi-Final' | 'Final')[] = ['Quarter-Final', 'Semi-Final', 'Final'];
  const matchupsByRound = rounds.reduce((acc, round) => {
    const roundMatches = matches.filter(m => m.round === round);
    if (roundMatches.length > 0) {
      acc[round] = roundMatches;
    }
    return acc;
  }, {} as Record<'Quarter-Final' | 'Semi-Final' | 'Final', NationalsPlayoffMatch[]>);

  const activeRounds = Object.keys(matchupsByRound);

  return (
    <div className="p-4 border rounded-lg bg-card flex-1">
      <h4 className="text-xl font-bold text-center mb-6">{title}</h4>
      <div className="flex justify-center items-start gap-8 overflow-x-auto p-4">
        {activeRounds.map((round, index) => (
          <React.Fragment key={round}>
            <div className="flex flex-col gap-16 justify-around flex-shrink-0">
              <p className="text-center font-semibold text-muted-foreground -mb-12">{round}</p>
              {matchupsByRound[round as keyof typeof matchupsByRound].map(match => (
                <Matchup key={match.id} match={match} {...props} />
              ))}
            </div>
            {index < activeRounds.length - 1 && (
              <div className="flex-shrink-0 w-16 h-full flex items-center self-center pt-8">
                <div className="w-full border-b-2 border-dashed"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const NationalsPlayoffTree = ({ playoffSchedule, userTeamName, onPlayGame, onSimulateGame }: NationalsPlayoffTreeProps) => {
  const goldMatches = playoffSchedule.filter(m => m.bracket === 'Gold');
  const silverMatches = playoffSchedule.filter(m => m.bracket === 'Silver');
  const goldFinal = goldMatches.find(m => m.round === 'Final');
  const silverFinal = silverMatches.find(m => m.round === 'Final');

  return (
    <div className="flex flex-col items-center p-4 space-y-8">
      <h3 className="text-2xl font-bold">Playoff Brackets</h3>
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {goldMatches.length > 0 && (
          <BracketView title="Gold Bracket" matches={goldMatches} userTeamName={userTeamName} onPlayGame={onPlayGame} onSimulateGame={onSimulateGame} />
        )}
        {silverMatches.length > 0 && (
          <BracketView title="Silver Bracket" matches={silverMatches} userTeamName={userTeamName} onPlayGame={onPlayGame} onSimulateGame={onSimulateGame} />
        )}
      </div>
      {(goldFinal?.winner || silverFinal?.winner) && (
        <div className="flex flex-wrap gap-12 mt-8 text-center justify-center">
          {silverFinal?.winner && (
              <div>
                  <p className="text-muted-foreground">Silver Bracket Winner</p>
                  <h4 className="text-2xl font-bold tracking-tight text-primary/80">{silverFinal.winner}</h4>
              </div>
          )}
          {goldFinal?.winner && (
              <div>
                  <p className="text-muted-foreground">National Champion</p>
                  <h4 className="text-3xl font-extrabold tracking-tight text-primary">{goldFinal.winner}</h4>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NationalsPlayoffTree;