import { Team, GameEvent, GameState } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import { Progress } from '@/components/ui/progress'; // Import Progress component

interface GameSummaryProps {
  userTeam: Team;
  opponentTeam: Team;
  gameState: GameState; // Added gameState prop
}

const parseGoal = (description: string) => {
    const goalMatch = description.match(/GOAL! (.*?) scores/);
    const assistMatch = description.match(/Assists: (.*)/);
    const scorer = goalMatch ? goalMatch[1] : 'Unknown';
    const assists = assistMatch ? assistMatch[1] : 'Unassisted';
    return { scorer, assists };
};

const parsePenalty = (description: string) => {
    const match = description.match(/PENALTY! (.*?) gets (.*) for (.*)\./);
    if (!match) return null;
    return {
        player: match[1],
        details: `${match[2]} for ${match[3]}`,
    };
};

export const GameSummary = ({ userTeam, opponentTeam, gameState }: GameSummaryProps) => {
    const { goals, penalties } = useMemo(() => {
        const goals: (GameEvent & { score: { user: number, opp: number } })[] = [];
        const penalties: GameEvent[] = [];
        let userScore = 0;
        let opponentScore = 0;

        [...gameState.gameLog].reverse().forEach(event => {
            if (event.description.startsWith('GOAL!')) {
                if (event.team === userTeam.name) userScore++;
                else opponentScore++;
                goals.unshift({ ...event, score: { user: userScore, opp: opponentScore } });
            }
        });

        gameState.gameLog.forEach(event => {
            if (event.description.startsWith('PENALTY!')) {
                penalties.push(event);
            }
        });

        return { goals, penalties };
    }, [gameState.gameLog, userTeam.name]);

    const renderPeriodRows = (items: GameEvent[], period: number, type: 'goal' | 'penalty') => {
        const periodItems = items.filter(item => item.period === period);
        if (periodItems.length === 0) return null;

        return (
            <>
                <TableRow>
                    <TableCell colSpan={type === 'goal' ? 5 : 3} className="font-bold bg-muted/50">
                        {period === 1 ? '1st' : period === 2 ? '2nd' : '3rd'} Period {type === 'goal' ? 'Scores' : 'Penalties'}
                    </TableCell>
                </TableRow>
                {periodItems.map((item, index) => {
                    if (type === 'goal') {
                        const { scorer, assists } = parseGoal(item.description);
                        const goal = item as (GameEvent & { score: { user: number, opp: number } });
                        return (
                            <TableRow key={index}>
                                <TableCell>{item.time}</TableCell>
                                <TableCell>{item.team}</TableCell>
                                <TableCell>
                                    <p className="font-semibold">{scorer}</p>
                                    <p className="text-xs text-muted-foreground">{assists}</p>
                                </TableCell>
                                <TableCell className="text-center">{goal.score.user}</TableCell>
                                <TableCell className="text-center">{goal.score.opp}</TableCell>
                            </TableRow>
                        );
                    } else {
                        const penaltyInfo = parsePenalty(item.description);
                        return (
                            <TableRow key={index}>
                                <TableCell>{item.time}</TableCell>
                                <TableCell>{item.team}</TableCell>
                                <TableCell>
                                    <p className="font-semibold">{penaltyInfo?.player}</p>
                                    <p className="text-xs text-muted-foreground">{penaltyInfo?.details}</p>
                                </TableCell>
                            </TableRow>
                        );
                    }
                })}
            </>
        );
    };

    const totalTime = 3 * 20 * 60; // 3 periods * 20 minutes * 60 seconds
    const timeElapsed = (gameState.period - 1) * 20 * 60 + gameState.time;
    const progress = (timeElapsed / totalTime) * 100;

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {userTeam.name} vs {opponentTeam.name}
                    </CardTitle>
                    <p className="text-lg text-muted-foreground">
                        Period {gameState.period} - {Math.floor((1200 - gameState.time) / 60).toString().padStart(2, '0')}:{(1200 - gameState.time) % 60 < 0 ? '00' : (1200 - gameState.time) % 60..toString().padStart(2, '0')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around items-center text-4xl font-bold mb-4">
                        <span>{gameState.userScore}</span>
                        <span>-</span>
                        <span>{gameState.opponentScore}</span>
                    </div>
                    <div className="flex justify-around items-center text-lg mb-4">
                        <span>Shots: {gameState.userShots}</span>
                        <span>Shots: {gameState.opponentShots}</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    {gameState.isGameOver && (
                        <p className="text-xl font-semibold mt-4">Game Over!</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Scoring Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Time</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-center w-[50px]">{userTeam.name.substring(0, 3).toUpperCase()}</TableHead>
                                <TableHead className="text-center w-[50px]">{opponentTeam.name.substring(0, 3).toUpperCase()}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderPeriodRows(goals, 1, 'goal')}
                            {renderPeriodRows(goals, 2, 'goal')}
                            {renderPeriodRows(goals, 3, 'goal')}
                            {goals.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No goals scored yet.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Penalty Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Time</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderPeriodRows(penalties, 1, 'penalty')}
                            {renderPeriodRows(penalties, 2, 'penalty')}
                            {renderPeriodRows(penalties, 3, 'penalty')}
                            {penalties.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No penalties yet.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};