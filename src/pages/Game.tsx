import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useBlocker } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { GameState, Team, Lineup } from '@/types';
import { simulateTick } from '@/lib/gameEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Pause, Play, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterDisplay } from '@/components/game/RosterDisplay';
import { LineupDisplay } from '@/components/game/LineupDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { TacticsManager } from '@/components/game/TacticsManager';
import { LineupManager } from '@/components/game/LineupManager';
import { InstructionsManager } from '@/components/game/InstructionsManager';
import { GameSummary } from '@/components/game/GameSummary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const formatClockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const Game = () => {
  const { opponentName } = useParams<{ opponentName: string }>();
  const { teams, userTeam, updateTeam } = useTeam();
  const opponentTeam = useMemo(() => teams.find(t => t.name === decodeURIComponent(opponentName || '')), [teams, opponentName]);

  const [gameUserTeam, setGameUserTeam] = useState<Team>(() => JSON.parse(JSON.stringify(userTeam)));

  const [gameState, setGameState] = useState<GameState>({
    userScore: 0,
    opponentScore: 0,
    period: 1,
    time: 0,
    gameLog: [],
    isGameOver: false,
    isPaused: true,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blocker = useBlocker(!gameState.isGameOver);

  useEffect(() => {
    if (!gameState.isPaused && !gameState.isGameOver) {
      intervalRef.current = setInterval(() => {
        if (!opponentTeam) return;
        setGameState(prev => simulateTick(prev, gameUserTeam, opponentTeam));
      }, 37.5);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState.isPaused, gameState.isGameOver, opponentTeam, gameUserTeam]);

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
    }));
  };

  const handleTacticChange = (category: string, tactic: string) => {
    const newTactics = { ...gameUserTeam.tactics, [category]: tactic };
    setGameUserTeam(prev => ({ ...prev, tactics: newTactics }));
  };

  const handleLineupChange = (newLineup: Lineup) => {
    setGameUserTeam(prev => ({ ...prev, lineup: newLineup }));
  };
  
  const handleRoleChange = (playerId: string, newRole: string) => {
    setGameUserTeam(prev => ({
        ...prev,
        roster: prev.roster.map(p => 
            p.id === playerId ? { ...p, role: newRole } : p
        )
    }));
  };

  const handleGiveInstruction = (target: string, instruction: string) => {
    const targetName = gameUserTeam.roster.find(p => p.id === target)?.name || target;
    const newLogEntry = {
      time: formatClockTime(1200 - gameState.time),
      period: gameState.period,
      description: `Instruction to ${targetName}: ${instruction}`
    };
    setGameState(prev => ({
      ...prev,
      gameLog: [newLogEntry, ...prev.gameLog],
    }));
  };

  const handleSaveChanges = () => {
    updateTeam(gameUserTeam);
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="log">Game Log</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
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
            <TabsContent value="summary">
              <ScrollArea className="h-[450px] w-full">
                <GameSummary gameLog={gameState.gameLog} userTeam={gameUserTeam} opponentTeam={opponentTeam} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-roster"><RosterDisplay players={gameUserTeam.roster} /></TabsContent>
            <TabsContent value="opp-roster"><RosterDisplay players={opponentTeam.roster} /></TabsContent>
            <TabsContent value="my-lines"><LineupDisplay lineup={gameUserTeam.lineup} roster={gameUserTeam.roster} /></TabsContent>
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
          {gameState.isPaused && !isEndOfPeriod && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary">
                  <Settings className="mr-2 h-5 w-5" />
                  Manage Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Team Management</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="tactics" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="tactics">Tactics</TabsTrigger>
                    <TabsTrigger value="lines">Lines</TabsTrigger>
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tactics" className="mt-4">
                    <TacticsManager currentTactics={gameUserTeam.tactics} onTacticChange={handleTacticChange} roster={gameUserTeam.roster} />
                  </TabsContent>
                  <TabsContent value="lines" className="mt-4">
                    <LineupManager 
                      lineup={gameUserTeam.lineup} 
                      roster={gameUserTeam.roster} 
                      onLineupChange={handleLineupChange}
                      onRoleChange={handleRoleChange}
                    />
                  </TabsContent>
                  <TabsContent value="instructions" className="mt-4">
                    <InstructionsManager 
                      roster={gameUserTeam.roster} 
                      lineup={gameUserTeam.lineup}
                      onGiveInstruction={handleGiveInstruction} 
                    />
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button onClick={handleSaveChanges}>Save and Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isEndOfPeriod && gameState.period < 3 && (
            <Button size="lg" onClick={handleNextPeriod}>Start Period {gameState.period + 1}</Button>
          )}
        </div>
      )}

      {blocker.state === "blocked" && (
        <AlertDialog open onOpenChange={(open) => { if (!open) blocker.reset?.(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
              <AlertDialogDescription>
                The current game will be abandoned and the result will be a loss. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => blocker.reset?.()}>
                Stay
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => blocker.proceed?.()}>
                Abandon Game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Game;