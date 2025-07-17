import React, { useState, useEffect } from 'react';
import { useTeam } from '@/context/TeamContext';
import { GameState, GameEvent, GameDate, ScheduleEntry, Team, PlayerSeasonStats } from '@/types';
import GameBoard from '@/components/game/GameBoard'; // Corrected import path
import GameControls from '@/components/game/GameControls'; // Corrected import path
import { simulateFullGame } from '@/lib/gameEngine';
import { isRivalryGame } from '@/lib/rivalries';
import { toast } from 'sonner';

const Game = () => {
    const { userTeam, teams, gameForCurrentWeek, markGameAsCompleted, currentDate, processGameResults } = useTeam();
    const [gameState, setGameState] = useState<GameState>({
        userScore: 0,
        opponentScore: 0,
        userShots: 0,
        opponentShots: 0,
        period: 1,
        time: 0,
        gameLog: [],
        isGameOver: false,
        isPaused: false,
        injuries: [],
        possessionHolder: null,
        powerPlayState: { isActive: false, teamOnPowerPlay: null, timeLeft: 0 },
        userTeamStats: { playerStats: {} },
        opponentTeamStats: { playerStats: {} },
    });

    const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);

    useEffect(() => {
        if (!userTeam || !gameForCurrentWeek) {
            setOpponentTeam(null);
            return;
        }
        const opponent = gameForCurrentWeek.opponent;
        const foundOpponentTeam = teams.find(t => t.name === opponent); // Find opponent team from all teams
        setOpponentTeam(foundOpponentTeam || null);
    }, [userTeam, gameForCurrentWeek, teams]); // Added 'teams' to dependency array

    useEffect(() => {
        if (!userTeam || !opponentTeam || !gameForCurrentWeek) {
            return;
        }
        // Initial simulation to get the full game state
        const initialGameState = simulateFullGame(userTeam, opponentTeam, true); // Pass true for isBigGame if applicable
        setGameState({
            userScore: initialGameState.userScore,
            opponentScore: initialGameState.opponentScore,
            userShots: initialGameState.userShots,
            opponentShots: initialGameState.opponentShots,
            period: initialGameState.period,
            time: initialGameState.time,
            gameLog: initialGameState.gameLog,
            isGameOver: initialGameState.isGameOver,
            isPaused: initialGameState.isPaused,
            injuries: initialGameState.injuries,
            possessionHolder: initialGameState.possessionHolder,
            powerPlayState: initialGameState.powerPlayState,
            userTeamStats: initialGameState.userTeamStats,
            opponentTeamStats: initialGameState.opponentTeamStats,
        });
    }, [userTeam, opponentTeam, gameForCurrentWeek, currentDate]); // Removed gameState from dependencies to prevent infinite loop

    const handleGameEnd = () => {
        if (!userTeam || !opponentTeam || !gameForCurrentWeek) return;
        markGameAsCompleted(gameForCurrentWeek.id, gameState.userScore, gameState.opponentScore);
        processGameResults(userTeam, opponentTeam, gameState);
    };

    if (!userTeam || !opponentTeam || !gameForCurrentWeek) {
        return <div>Loading game...</div>;
    }

    return (
        <div className="flex flex-col h-screen">
            <GameBoard gameState={gameState} userTeam={userTeam} opponentTeam={opponentTeam} />
            <GameControls
                gameState={gameState}
                setGameState={setGameState}
                userTeam={userTeam}
                opponentTeam={opponentTeam}
                onGameEnd={handleGameEnd}
                gameDate={currentDate}
            />
        </div>
    );
};

export default Game;