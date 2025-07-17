import React from 'react';
import { GameState, Team, GameDate } from '@/types';
import { Button } from '@/components/ui/button';

interface GameControlsProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  userTeam: Team;
  opponentTeam: Team;
  onGameEnd: () => void;
  gameDate: GameDate;
}

const GameControls: React.FC<GameControlsProps> = ({ onGameEnd, gameState }) => {
  return (
    <div className="p-4 flex justify-center">
      {gameState.isGameOver && (
        <Button onClick={onGameEnd}>Finish Game</Button>
      )}
    </div>
  );
};

export default GameControls;