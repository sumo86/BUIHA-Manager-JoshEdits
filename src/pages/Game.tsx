import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { GameState } from '@/types';
import { simulatePeriod } from '@/lib/gameEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy } from 'lucide-react';

const Game = () => {
  const { opponentName } = useParams<{ opponentName: string }>();
  const { teams, userTeam } = useTeam();

  const opponentTeam = useMemo(() => {
    return teams.find(t => t.name === decodeURIComponent(opponentName || ''));
  }, [teams, opponentName]);

  const [gameState, setGameState] = useState<GameState>({
    userScore: 0,
    opponentScore: 0,
    period: 0,
    gameLog: [],
    isGameOver: false,
  });

  const handleSimulatePeriod = () => {
    if (!opponentTeam || gameState.isGameOver) return;

    const currentPeriod = gameState.period + 1;
    const { events, userScoreChange, opponentScoreChange } = simulatePeriod(currentPeriod, userTeam, opponentTeam);

    setGameState(prev => ({
      ...prev,
      period: currentPeriod,
      userScore: prev.userScore + userScoreChange,
      opponentScore: prev.opponentScore + opponentScoreChange,
      gameLog: [...prev.gameLog, ...events],
      isGameOver: currentPeriod === 3,
    }));
  };

  if (!opponentTeam) {
    return <div>Opponent not found.</div>;
  }

  const getPeriodText = () => {
    if (gameState.isGameOver) return "Final";
    if (gameState.period === 0) return "Pre-Game";
    return `Period ${gameState.period}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight">
            <div className="flex justify-around items-center">
              <span className="w-1/3 text-right">{userTeam.name}</span>
              <span className="w-1/3 text-center">{gameState.userScore} - {gameState.opponentScore}</span>
              <span className="w-1/3 text-left">{opponentTeam.name}</span>
            </div>
          </CardTitle>
          <p className="text-xl text-muted-foreground">{getPeriodText()}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            {gameState.gameLog.length === 0 && <p className="text-muted-foreground">The game is about to begin...</p>}
            {gameState.gameLog.map((event, index) => (
              <div key={index} className="mb-2">
                <p>
                  <span className="font-bold text-muted-foreground">[{event.time} P{event.period}]</span> {event.description}
                </p>
                {index < gameState.gameLog.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {gameState.isGameOver ? (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>Game Over!</AlertTitle>
          <AlertDescription>
            The final score is {userTeam.name} {gameState.userScore} - {opponentTeam.name} {gameState.opponentScore}.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={handleSimulatePeriod}>
            {gameState.period === 0 ? 'Start Game' : `Simulate Period ${gameState.period + 1}`}
          </Button>
          <Button size="lg" variant="outline" disabled>Adjust Tactics</Button>
        </div>
      )}
    </div>
  );
};

export default Game;