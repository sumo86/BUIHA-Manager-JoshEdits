import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { GameState, Team, Lineup, ScheduleEntry, NationalsPlayoffMatch } from '@/types';
import { simulateTick } from '@/lib/gameEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Pause, Play, Settings, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterDisplay } from '@/components/game/RosterDisplay';
import { LineupDisplay } from '@/components/game/LineupDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { TacticsManager } from '@/components/game/TacticsManager';
import { LineupManager } from '@/components/game/LineupManager';
import { InstructionsManager } from '@/components/game/InstructionsManager';
import { GameSummary } from '@/components/game/GameSummary';
import { toast } from 'sonner';

const formatClockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const NationalsGame = () => {
    const { teams, nationalsData, currentDate, processGameResults, userTeam } = useTeam();
    const { division, gameId } = useParams<{ division: string; gameId: string }>();
    const navigate = useNavigate();

    const gameData = useMemo(() => {
        if (!division || !gameId || !nationalsData || !currentDate) return null;
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament) return null;
        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        return allGames.find(g => g.id === gameId);
    }, [nationalsData, division, gameId, currentDate]);

    const homeTeamName = useMemo(() => typeof gameData?.homeTeam === 'string' ? gameData.homeTeam : 'TBD', [gameData]);
    const awayTeamName = useMemo(() => typeof gameData?.awayTeam === 'string' ? gameData.awayTeam : 'TBD', [gameData]);

    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);

    useEffect(() => {
        setHomeTeam(teams.find(t => t.name === homeTeamName) || null);
        setAwayTeam(teams.find(t => t.name === awayTeamName) || null);
    }, [teams, homeTeamName, awayTeamName]);

    const [gameState, setGameState] = useState<GameState>({
        userScore: 0, opponentScore: 0, userShots: 0, opponentShots: 0, period: 1,
        time: 0, gameLog: [], isGameOver: false, isPaused: true, injuries: [],
        possessionHolder: null, powerPlayState: { isActive: false, teamOnPowerPlay: null, timeLeft: 0 },
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!gameState.isPaused && !gameState.isGameOver && homeTeam && awayTeam) {
            intervalRef.current = setInterval(() => {
                setGameState(prev => simulateTick(prev, homeTeam, awayTeam, true));
            }, 50);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [gameState.isPaused, gameState.isGameOver, homeTeam, awayTeam]);

    useEffect(() => {
        if (gameState.isGameOver && homeTeam && awayTeam && gameId && division) {
            processGameResults(homeTeam, awayTeam, gameState, true, division, gameId);
            toast.success("Nationals game finished and results have been processed.");
            navigate('/nationals');
        }
    }, [gameState.isGameOver, homeTeam, awayTeam, gameId, division, processGameResults, navigate]);

    const handlePlayPause = () => {
        if (gameState.isGameOver) return;
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    };

    const handleNextPeriod = () => {
        setGameState(prev => ({
            ...prev, period: prev.period + 1, time: 0, isPaused: true,
            gameLog: [{ time: "00:00", period: prev.period + 1, description: `Start of Period ${prev.period + 1}`, team: "System" }, ...prev.gameLog],
            possessionHolder: null,
        }));
    };

    const isUserPlaying = userTeam && (userTeam.name === homeTeamName || userTeam.name === awayTeamName);

    if (!gameData || !homeTeam || !awayTeam) return <div>Loading game... If this persists, the game may not be ready to play.</div>;

    const getPeriodText = () => gameState.isGameOver ? "Final" : `Period ${gameState.period}`;
    const isEndOfPeriod = gameState.time >= 1200;

    return (
        <div className="space-y-4">
            <Button variant="outline" onClick={() => navigate('/nationals')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Nationals</Button>
            <Card>
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-4xl font-bold tracking-tight">
                        <div className="flex justify-around items-center">
                            <span className="w-1/3 text-right flex justify-end items-center gap-4">
                                {homeTeam.name}
                                {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} className="h-10 w-10 object-contain" />}
                            </span>
                            <span className="w-1/3 text-center">{gameState.userScore} - {gameState.opponentScore}</span>
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
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="log">Game Log</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="home-roster">Home Roster</TabsTrigger>
                    <TabsTrigger value="away-roster">Away Roster</TabsTrigger>
                    <TabsTrigger value="home-lines">Home Lines</TabsTrigger>
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
                        <TabsContent value="summary"><ScrollArea className="h-[450px] w-full"><GameSummary gameLog={gameState.gameLog} userTeam={homeTeam} opponentTeam={awayTeam} /></ScrollArea></TabsContent>
                        <TabsContent value="home-roster"><RosterDisplay players={homeTeam.roster} /></TabsContent>
                        <TabsContent value="away-roster"><RosterDisplay players={awayTeam.roster} /></TabsContent>
                        <TabsContent value="home-lines"><LineupDisplay lineup={homeTeam.lineup} roster={homeTeam.roster} /></TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            {gameState.isGameOver ? (
                <Alert>
                    <Trophy className="h-4 w-4" />
                    <AlertTitle>Game Over!</AlertTitle>
                    <AlertDescription>The final score is {homeTeam.name} {gameState.userScore} - {awayTeam.name} {gameState.opponentScore}.</AlertDescription>
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
                </div>
            )}
        </div>
    );
};

export default NationalsGame;