import React from 'react';
import { GameState, Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameBoardProps {
  gameState: GameState;
  userTeam: Team;
  opponentTeam: Team;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, userTeam, opponentTeam }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around items-center text-2xl font-bold">
          <div>{userTeam.name}: {gameState.userScore}</div>
          <div>vs</div>
          <div>{opponentTeam.name}: {gameState.opponentScore}</div>
        </div>
        <div className="text-center mt-4">
          <p>Period: {gameState.period}</p>
          <p>Time: {gameState.time}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameBoard;