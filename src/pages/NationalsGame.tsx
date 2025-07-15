import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { GameState, Team, Lineup, NationalsPlayoffMatch, ScheduleEntry } from '@/types';
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
import { toast } from 'sonner';
import { aiMakeAdjustments } from '@/lib/aiManager';

const formatClockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const NationalsGame = () => {
    const { userTeam: contextUserTeam, teams, updateTeam, processGameResults, nationalsData, currentDate } = useTeam();
    const { division, gameId } = useParams<{ division: string; gameId: string }>();
    const navigate = useNavigate();

    const gameData = useMemo(() => {
        if (!division || !gameId || !nationalsData[currentDate.year]) return null;
        const tournament = nationalsData[currentDate.year][division];
        if (!tournament) return null;
        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        return allGames.find(g => g.id === gameId) || null;
    }, [division, gameId, nationalsData, currentDate.year]);

    const homeTeam = useMemo(() => teams.find(t => t.name === gameData?.homeTeam), [teams, gameData]);
    const awayTeam = useMemo(() => teams.find(t => t.name === gameData?.awayTeam), [teams, gameData]);

    const isUserPlaying = useMemo(() => {
        if (!contextUserTeam || !homeTeam || !awayTeam) return false;
        return homeTeam.name === contextUserTeam.name || awayTeam.name === contextUserTeam.name;
    }, [contextUserTeam, homeTeam, awayTeam]);

    const userTeamForGame = useMemo(() => {
        if (!isUserPlaying || !contextUserTeam) return null;
        return homeTeam?.name === contextUserTeam.name ? homeTeam : awayTeam;
    }, [isUserPlaying, contextUserTeam, homeTeam, awayTeam]);

    const opponentTeamForGame = useMemo(() => {
        if (!isUserPlaying || !contextUserTeam) return null;
        return homeTeam?.name === contextUserTeam.name ? awayTeam : homeTeam;
    }, [isUserPlaying, contextUserTeam, homeTeam, awayTeam]);

    const [gameUserTeam, setGameUserTeam] = useState<Team | null>(userTeamForGame);
    const [gameOpponentTeam, setGameOpponentTeam] = useState<Team | null>(opponentTeamForGame);
    const [gameProcessed, setGameProcessed] = useState(false);

    useEffect(() => {
        if (!gameData || !homeTeam || !awayTeam) {
            toast.error("Game not found", { description: "Could not load the details for this Nationals game." });
            navigate('/nationals');
        } else if (!isUserPlaying) {
            toast.error("Cannot play game", { description: "You can only play games your team is involved in." });
            navigate('/nationals');
        }
    }, [gameData, homeTeam, awayTeam, isUserPlaying, navigate]);

    const [gameState, setGameState] = useState<GameState>({
        userScore: 0,
        opponentScore: 0,
        userShots: 0,
        opponentShots: 0,
        period: 1,
        time: 0,
        gameLog: [],
        isGameOver: false,
        isPaused: true,
        injuries: [],
        possessionHolder: null,
        powerPlayState: { isActive: false, teamOnPowerPlay: null, timeLeft: 0 },
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const blocker = useBlocker(!gameState.isGameOver);

    useEffect(() => {
        if (!gameState.isPaused && !gameState.isGameOver && gameUserTeam && gameOpponentTeam) {
            intervalRef.current = setInterval(() => {
                setGameState(prev => simulateTick(prev, gameUserTeam, gameOpponentTeam, true));
            }, 50);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [gameState.isPaused, gameState.isGameOver, gameUserTeam, gameOpponentTeam]);

    useEffect(() => {
        if (gameState.isGameOver && !gameProcessed && gameUserTeam && gameOpponentTeam && division && gameId && homeTeam && awayTeam) {
            processGameResults(gameUserTeam, gameOpponentTeam, gameState, true, division, gameId, { homeTeamName: homeTeam.name, awayTeamName: awayTeam.name });
            setGameProcessed(true);
            toast.success("Game finished and stats have been updated.");
        }
    }, [gameState.isGameOver, gameProcessed, processGameResults, gameUserTeam, gameOpponentTeam, gameState, division, gameId, homeTeam, awayTeam]);

    const handlePlayPause = () => {
        if (gameState.isGameOver) return;
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    };

    const handleNextPeriod = () => {
        if (gameOpponentTeam && gameUserTeam) {
            const scoreDifference = gameState.opponentScore - gameState.userScore;
            const updatedOpponentTeam = aiMakeAdjustments(gameOpponentTeam, gameUserTeam, scoreDifference);
            if (JSON.stringify(updatedOpponentTeam.tactics) !== JSON.stringify(gameOpponentTeam.tactics)) {
                setGameOpponentTeam(updatedOpponentTeam);
                toast.info(`${gameOpponentTeam.name} has made some tactical adjustments.`);
            }
        }
        setGameState(prev => ({
            ...prev,
            period: prev.period + 1,
            time: 0,
            isPaused: true,
            gameLog: [{ time: "00:00", period: prev.period + 1, description: `Start of Period ${prev.period + 1}`, team: "System" }, ...prev.gameLog],
            possessionHolder: null,
        }));
    };

    const handleSaveChanges = () => {
        if (gameUserTeam) updateTeam(gameUserTeam);
    };

    const handleAbandonGame = () => {
        if (!gameUserTeam || !gameOpponentTeam || !division || !gameId || !homeTeam || !awayTeam) return;
        const abandonedGameState: GameState = {
            ...gameState,
            userScore: 0,
            opponentScore: 5,
            isGameOver: true,
        };
        processGameResults(gameUserTeam, gameOpponentTeam, abandonedGameState, true, division, gameId, { homeTeamName: homeTeam.name, awayTeamName: awayTeam.name });
        setGameProcessed(true);
        toast.error("Game Abandoned", { description: "The match has been forfeited with a 5-0 loss." });
        blocker.proceed?.();
        navigate('/nationals', { replace: true });
    };

    if (!gameUserTeam || !gameOpponentTeam || !homeTeam || !awayTeam) return <div>Loading game...</div>;

    const getPeriodText = () => gameState.isGameOver ? "Final" : `Period ${gameState.period}`;
    const isEndOfPeriod = gameState.time >= 1200;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-4xl font-bold tracking-tight">
                        <div className="flex justify-around items-center">
                            <span className="w-1/3 text-right flex justify-end items-center gap-4">
                                {homeTeam.name}
                                {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} className="h-10 w-10 object-contain" />}
                            </span>
                            <span className="w-1/3 text-center">{homeTeam.name === gameUserTeam.name ? gameState.userScore : gameState.opponentScore} - {awayTeam.name === gameUserTeam.name ? gameState.userScore : gameState.opponentScore}</span>
                            <span className="w-1/3 text-left flex items-center gap-4">
                                {awayTeam.logo && <img src={awayTeam.logo} alt={awayTeam.name} className="h-10 w-10 object-contain" />}
                                {awayTeam.name}
                            </span>
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
                                {gameState.gameLog.map((event, index) => (
                                    <div key={index} className="mb-2">
                                        <p><span className="font-bold text-muted-foreground">[{event.time} P{event.period}]</span> {event.description}</p>
                                        {index < gameState.gameLog.length - 1 && <Separator className="my-2" />}
                                    </div>
                                ))}
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="summary"><GameSummary gameLog={gameState.gameLog} userTeam={gameUserTeam} opponentTeam={gameOpponentTeam} /></TabsContent>
                        <TabsContent value="my-roster"><RosterDisplay players={gameUserTeam.roster} /></TabsContent>
                        <TabsContent value="opp-roster"><RosterDisplay players={gameOpponentTeam.roster} /></TabsContent>
                        <TabsContent value="my-lines"><LineupDisplay lineup={gameUserTeam.lineup} roster={gameUserTeam.roster} /></TabsContent>
                        <TabsContent value="opp-lines"><LineupDisplay lineup={gameOpponentTeam.lineup} roster={gameOpponentTeam.roster} /></TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            {gameState.isGameOver ? (
                <Alert>
                    <Trophy className="h-4 w-4" />
                    <AlertTitle>Game Over!</AlertTitle>
                    <AlertDescription>The game has finished. You can view the results on the Nationals page.</AlertDescription>
                </Alert>
            ) : (
                <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={handlePlayPause} disabled={isEndOfPeriod}>
                        {gameState.isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                        {gameState.isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    {isEndOfPeriod && gameState.period < 3 && (
                        <Button size="lg" onClick={handleNextPeriod}>Start Period {gameState.period + 1}</Button>
                    )}
                    {gameState.isPaused && (
                        <Dialog>
                            <DialogTrigger asChild><Button size="lg" variant="secondary"><Settings className="mr-2 h-5 w-5" />Manage Team</Button></DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader><DialogTitle>Team Management</DialogTitle></DialogHeader>
                                <Tabs defaultValue="tactics" className="mt-4">
                                    <TabsList>
                                        <TabsTrigger value="tactics">Tactics</TabsTrigger>
                                        <TabsTrigger value="lines">Lines</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="tactics" className="mt-4"><TacticsManager currentTactics={gameUserTeam.tactics} onTacticChange={(cat, tac) => setGameUserTeam(p => p ? { ...p, tactics: { ...p.tactics, [cat]: tac } } : p)} roster={gameUserTeam.roster} /></TabsContent>
                                    <TabsContent value="lines" className="mt-4"><LineupManager lineup={gameUserTeam.lineup} roster={gameUserTeam.roster} onLineupChange={(newLineup) => setGameUserTeam(p => p ? { ...p, lineup: newLineup } : p)} onRoleChange={(pId, nRole) => setGameUserTeam(p => p ? { ...p, roster: p.roster.map(player => player.id === pId ? { ...player, role: nRole } : player) } : p)} /></TabsContent>
                                </Tabs>
                                <DialogFooter><DialogClose asChild><Button onClick={handleSaveChanges}>Save and Close</Button></DialogClose></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            )}

            {blocker.state === "blocked" && (
                <AlertDialog open onOpenChange={(open) => { if (!open) blocker.reset?.(); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                            <AlertDialogDescription>The current game will be abandoned and the result will be a 5-0 loss. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => blocker.reset?.()}>Stay</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAbandonGame}>Abandon Game</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
};

export default NationalsGame;