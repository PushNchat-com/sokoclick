import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import SokoGame from '../components/game/SokoGame';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabaseClient } from '../lib/supabase';

const Game: React.FC = () => {
  const { t } = useTranslation();
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Handle game over event from the SokoGame component
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameOver(true);
  };

  // Reset game state to play again
  const handlePlayAgain = () => {
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Helmet>
        <title>{t('game.title')} | SokoClick</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6 text-center">{t('game.title')}</h1>
      
      {gameOver ? (
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('game.gameOver')}</h2>
          <p className="text-xl mb-6">{t('game.yourScore')}: {score}</p>
          <Button 
            onClick={handlePlayAgain}
            className="px-6 py-2"
          >
            {t('game.playAgain')}
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <SokoGame onGameOver={handleGameOver} />
        </div>
      )}
    </div>
  );
};

export default Game; 