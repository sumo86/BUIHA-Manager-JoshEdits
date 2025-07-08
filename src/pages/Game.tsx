import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { GameState, CoachingDecision } from '@/types';
import { simulateTick } from '@/lib/gameEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Pause, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterDisplay } from '@/components/game/RosterDisplay';
import { LineupDisplay } from '@/components/game/LineupDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const formatClockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const Game = () => {
  const { opponentName } = useParams<{ opponentName: string }>();
  const { teams, userTeam } = useTeam();
  const opponentTeam = useMemo(() => teams.find(t => t.name === decodeURIComponent(opponentName || '')), [teams, opponentName]);

  const [gameState, setGameState] = useState<GameState>({
    userScore: 0,
    opponentScore: 0,
    period: 1,
    time: 0,
    gameLog: [],
    isGameOver: false,
    isPaused: true,
    currentDecision: null,
    lastDecisionTime: -Infinity, // Initialize to a very low number
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameState.isPaused && !gameState.isGameOver) {
      intervalRef.current = setInterval(() => {
        if (!opponentTeam) return;
        setGameState(prev => simulateTick(prev, userTeam, opponentTeam));
      }, 37.5); // 1 game second every 37.5ms -> ~1 game minute every 2.25 seconds, period ~45 seconds
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState.isPaused, gameState.isGameOver, opponentTeam, userTeam]);

  const handlePauseResume = () => {
    if (gameState.isGameOver) return;
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleNextPeriod = () => {
    setGameState(prev => ({
      ...prev,
      period: prev.period + 1,
      time: 0,
      isPaused: true,
      gameLog: [{ time: "00:00", period: prev.period + 1, description: `Start of Period ${prev.period + 1}` }, ...prev.gameLog],
      lastDecisionTime: -Infinity, // Reset cooldown for new period
    }));
  };

  const handleDecision = (decision: CoachingDecision, optionIndex: number) => {
    // In a real scenario, the option.effect would be processed here.
    // For now, we just log it and resume the game.
    const newLogEntry = {
      time: formatClockTime(1200 - gameState.time),
      period: gameState.period,
      description: `Coach decision: ${decision.options[optionIndex].text}`
    };
    setGameState(prev => ({
      ...prev,
      currentDecision: null,
      isPaused: false,
      gameLog: [newLogEntry, ...prev.gameLog],
      lastDecisionTime: prev.time, // Update last decision time
    }));
  };

  if (!opponentTeam) return <div>Opponent not found.</div>;

  const getPeriodText = () => {
    if (gameState.isGameOver) return "Final";
    return `Period ${gameState.period}`;
  };

  const isEndOfPeriod = gameState.time >= 1200;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-4xl font-bold tracking-tight">
            <div className="flex justify-around items-center">
              <span className="w-1/3 text-right">{userTeam.name}</span>
              <span className="w-1/3 text-center">{gameState.userScore} - {gameState.opponentScore}</span>
              <span className="w-1/3 text-left">{opponentTeam.name}</span>
            </div>
          </CardTitle>
          <div className="flex justify-center items-center gap-4">
            <p className="text-xl text-muted-foreground">{getPeriodText()}</p>
            <p className="text-2xl font-mono font-bold">{formatClockTime(1200 - gameState.time)}</p>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="log">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="log">Game Log</TabsTrigger>
          <TabsTrigger value="my-roster">Your Roster</TabsTrigger>
          <TabsTrigger value="opp-roster">Opponent Roster</TabsTrigger>
          <TabsTrigger value="my-lines">Your Lines</TabsTrigger>
          <TabsTrigger value="opp-lines">Opponent Lines</TabsTrigger>
        </TabsList>
        <Card className="mt-2">
          <CardContent className="p-4">
            <TabsContent value="log">
              <ScrollArea className="h-[450px] w-full p-4">
                {gameState.gameLog.length === 0 && <p className="text-muted-foreground text-center">The game is about to begin...</p>}
                {gameState.gameLog.map((event, index) => (
                  <div key={index} className="mb-2">
                    <p><span className="font-bold text-muted-foreground">[{event.time} P{event.period}]</span> {event.description}</p>
                    {index < gameState.gameLog.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-roster"><RosterDisplay players={userTeam.roster} /></TabsContent>
            <TabsContent value="opp-roster"><RosterDisplay players={opponentTeam.roster} /></TabsContent>
            <TabsContent value="my-lines"><LineupDisplay lineup={userTeam.lineup} roster={userTeam.roster} /></TabsContent>
            <TabsContent value="opp-lines"><LineupDisplay lineup={opponentTeam.lineup} roster={opponentTeam.roster} /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {gameState.isGameOver ? (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>Game Over!</AlertTitle>
          <AlertDescription>The final score is {userTeam.name} {gameState.userScore} - {opponentTeam.name} {gameState.opponentScore}.</AlertDescription>
        </Alert>
      ) : (
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={handlePauseResume} disabled={isEndOfPeriod}>
            {gameState.isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
            {gameState.isPaused ? 'Resume' : 'Pause'}
          </Button>
          {isEndOfPeriod && gameState.period < 3 && (
            <Button size="lg" onClick={handleNextPeriod}>Start Period {gameState.period + 1}</Button>
          )}
        </div>
      )}

      <Dialog open={!!gameState.currentDecision} onOpenChange={() => { /* Prevent closing by clicking outside */ }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coach's Decision</DialogTitle>
            <DialogDescription>{gameState.currentDecision?.prompt}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-y-2">
            {gameState.currentDecision?.options.map((option, index) => (
              <Button key={index} onClick={() => handleDecision(gameState.currentDecision!, index)}>
                {option.text}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Game;