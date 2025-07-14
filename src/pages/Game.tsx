import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { Team, GameState, NationalsPlayoffMatch, Instruction, TacticsSelection } from '@/types';
import { simulateTick, simulateFullGame } from '@/lib/gameEngine';
import { GameSummary } from '@/components/game/GameSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RosterDisplay } from '@/components/game/RosterDisplay';
import { TacticsManager } from '@/components/game/TacticsManager';
import { InstructionsManager } from '@/components/game/InstructionsManager';

const Game = () => {
  const { opponentName, division, gameId } = useParams();
  const navigate = useNavigate();
  const { teams, userTeam, processGameResults, nationalsData, currentDate } = useTeam();
  
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isNationalsGame, setIsNationalsGame] = useState(false);

  useEffect(() => {
    if (!userTeam) {
      navigate('/');
      return;
    }

    let opp: Team | undefined;
    let nationalsMatch: NationalsPlayoffMatch | undefined;

    if (division && gameId) {
      // Nationals Game
      setIsNationalsGame(true);
      const tournament = nationalsData[currentDate.year]?.[division];
      if (tournament) {
        const match = tournament.playoffSchedule.find(m => m.id === gameId) || tournament.groupStageSchedule.find(m => m.id === gameId);
        if (match) {
          const oppTeamName = match.homeTeam === userTeam.name ? match.awayTeam : match.homeTeam;
          if (typeof oppTeamName === 'string') {
            opp = teams.find(t => t.name === oppTeamName);
          }
        }
      }
    } else if (opponentName) {
      // Regular Season or Friendly Game
      setIsNationalsGame(false);
      opp = teams.find(t => t.name === opponentName);
    }

    if (opp) {
      setOpponentTeam(opp);
      const initialGameState = simulateFullGame(userTeam, opp, isNationalsGame);
      setGameState(initialGameState);
    } else {
      toast.error("Opponent not found.");
      navigate('/play-game');
    }
  }, [opponentName, division, gameId, teams, userTeam, navigate, nationalsData, currentDate, isNationalsGame]);

  const handleSimulateToEnd = () => {
    if (!gameState || !userTeam || !opponentTeam) return;
    setGameState(simulateFullGame(userTeam, opponentTeam, isNationalsGame));
  };

  const handleFinishGame = () => {
    if (!userTeam || !opponentTeam || !gameState) return;
    processGameResults(userTeam, opponentTeam, gameState, isNationalsGame, division, gameId);
    navigate('/dashboard');
  };

  // Placeholder for tactic changes - actual implementation would update userTeam.tactics
  const handleTacticChange = useCallback((category: string, tactic: string) => {
    console.log(`Tactic changed: ${category} to ${tactic}`);
    // In a real scenario, you'd update the userTeam's tactics here
    // For example: updateUserTeam({ ...userTeam, tactics: { ...userTeam.tactics, [category]: tactic } });
  }, []);

  // Placeholder for instructions - actual implementation would affect player morale/performance
  const handleGiveInstruction = useCallback((target: string, instruction: Instruction) => {
    console.log(`Instruction given: ${instruction} to ${target}`);
    // In a real scenario, you'd apply this instruction to the player/group
  }, []);

  if (!userTeam || !opponentTeam || !gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <GameSummary 
        userTeam={userTeam} 
        opponentTeam={opponentTeam} 
        gameLog={gameState.gameLog} 
      />

      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={handleSimulateToEnd} disabled={gameState.isGameOver}>
          Simulate to End
        </Button>
        {gameState.isGameOver && (
          <Button onClick={handleFinishGame}>Finish Game</Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <RosterDisplay players={userTeam.roster} title="Your Roster" />
        
        <Card>
          <CardHeader><CardTitle>Game Log</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {gameState.gameLog.map((event, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-bold">[{event.period} {event.time}]</span> {event.description}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <RosterDisplay players={opponentTeam.roster} title={`${opponentTeam.name} Roster`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <TacticsManager 
          currentTactics={userTeam.tactics} 
          onTacticChange={handleTacticChange} 
          roster={userTeam.roster} 
        />
        <InstructionsManager 
          roster={userTeam.roster} 
          lineup={userTeam.lineup} 
          onGiveInstruction={handleGiveInstruction} 
        />
      </div>
    </div>
  );
};

export default Game;