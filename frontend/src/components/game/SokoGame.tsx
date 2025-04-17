import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import levels from './levels';
import './SokoGame.css';

interface Props {
  onGameOver: (score: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type Cell = 'empty' | 'wall' | 'box' | 'target' | 'player' | 'boxOnTarget' | 'playerOnTarget';

const SokoGame: React.FC<Props> = ({ onGameOver }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<{
    grid: Cell[][];
    playerPos: { x: number, y: number };
    boxCount: number;
    boxesOnTarget: number;
  }>({
    grid: [],
    playerPos: { x: 0, y: 0 },
    boxCount: 0,
    boxesOnTarget: 0
  });
  
  // Cell size in pixels
  const CELL_SIZE = 40;
  // Colors
  const COLORS = {
    empty: '#FFFFFF',
    wall: '#333333',
    box: '#8B4513',
    target: '#00FF00',
    player: '#0000FF',
    boxOnTarget: '#FF7F00',
    playerOnTarget: '#00BFFF'
  };

  // Initialize level
  useEffect(() => {
    if (currentLevel < levels.length) {
      initLevel(levels[currentLevel]);
    } else {
      // Game completed
      onGameOver(calculateScore());
    }
  }, [currentLevel]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawGame(ctx);
    
    // Check win condition
    if (gameState.boxesOnTarget === gameState.boxCount && gameState.boxCount > 0) {
      // Level completed
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
      }, 1000);
    }
  }, [gameState]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      let direction: Direction | null = null;
      
      switch (e.key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
        case 'r':
          // Restart level
          initLevel(levels[currentLevel]);
          return;
        default:
          return;
      }
      
      if (direction) {
        movePlayer(direction);
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [gameState, currentLevel]);

  // Initialize level
  const initLevel = (levelData: string[]) => {
    const grid: Cell[][] = [];
    let playerPos = { x: 0, y: 0 };
    let boxCount = 0;
    let boxesOnTarget = 0;
    
    for (let y = 0; y < levelData.length; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < levelData[y].length; x++) {
        const char = levelData[y][x];
        
        switch (char) {
          case '#':
            row.push('wall');
            break;
          case '@':
            row.push('empty');
            playerPos = { x, y };
            break;
          case '+':
            row.push('target');
            playerPos = { x, y };
            break;
          case '$':
            row.push('box');
            boxCount++;
            break;
          case '*':
            row.push('boxOnTarget');
            boxCount++;
            boxesOnTarget++;
            break;
          case '.':
            row.push('target');
            break;
          default:
            row.push('empty');
        }
      }
      grid.push(row);
    }
    
    // Update player position in grid
    if (grid[playerPos.y][playerPos.x] === 'empty') {
      grid[playerPos.y][playerPos.x] = 'player';
    } else if (grid[playerPos.y][playerPos.x] === 'target') {
      grid[playerPos.y][playerPos.x] = 'playerOnTarget';
    }
    
    setGameState({
      grid,
      playerPos,
      boxCount,
      boxesOnTarget
    });
    
    setMoves(0);
    
    // Update canvas size
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = grid[0].length * CELL_SIZE;
      canvas.height = grid.length * CELL_SIZE;
    }
  };

  // Move player
  const movePlayer = (direction: Direction) => {
    const { grid, playerPos } = gameState;
    const newGrid = [...grid.map(row => [...row])];
    
    // Calculate new position
    let newX = playerPos.x;
    let newY = playerPos.y;
    
    switch (direction) {
      case 'up':
        newY--;
        break;
      case 'down':
        newY++;
        break;
      case 'left':
        newX--;
        break;
      case 'right':
        newX++;
        break;
    }
    
    // Check if new position is valid
    if (newY < 0 || newY >= grid.length || newX < 0 || newX >= grid[0].length) {
      return;
    }
    
    // Check what's in the new position
    const targetCell = grid[newY][newX];
    
    // If it's a wall, can't move
    if (targetCell === 'wall') {
      return;
    }
    
    // If it's a box, need to check if we can push it
    if (targetCell === 'box' || targetCell === 'boxOnTarget') {
      // Calculate box's new position
      const boxNewX = newX + (newX - playerPos.x);
      const boxNewY = newY + (newY - playerPos.y);
      
      // Check if box's new position is valid
      if (boxNewY < 0 || boxNewY >= grid.length || boxNewX < 0 || boxNewX >= grid[0].length) {
        return;
      }
      
      const boxTargetCell = grid[boxNewY][boxNewX];
      
      // Box can only be pushed to empty space or target
      if (boxTargetCell !== 'empty' && boxTargetCell !== 'target') {
        return;
      }
      
      // Move the box
      if (boxTargetCell === 'empty') {
        newGrid[boxNewY][boxNewX] = 'box';
      } else {
        newGrid[boxNewY][boxNewX] = 'boxOnTarget';
      }
      
      // Update box counter
      let newBoxesOnTarget = gameState.boxesOnTarget;
      if (boxTargetCell === 'target') {
        newBoxesOnTarget++;
      }
      if (targetCell === 'boxOnTarget') {
        newBoxesOnTarget--;
      }
      
      // Move the player
      if (grid[playerPos.y][playerPos.x] === 'player') {
        newGrid[playerPos.y][playerPos.x] = 'empty';
      } else {
        newGrid[playerPos.y][playerPos.x] = 'target';
      }
      
      if (targetCell === 'box') {
        newGrid[newY][newX] = 'player';
      } else {
        newGrid[newY][newX] = 'playerOnTarget';
      }
      
      setGameState({
        ...gameState,
        grid: newGrid,
        playerPos: { x: newX, y: newY },
        boxesOnTarget: newBoxesOnTarget
      });
      
      setMoves(prev => prev + 1);
    } else {
      // Just move the player
      if (grid[playerPos.y][playerPos.x] === 'player') {
        newGrid[playerPos.y][playerPos.x] = 'empty';
      } else {
        newGrid[playerPos.y][playerPos.x] = 'target';
      }
      
      if (targetCell === 'empty') {
        newGrid[newY][newX] = 'player';
      } else {
        newGrid[newY][newX] = 'playerOnTarget';
      }
      
      setGameState({
        ...gameState,
        grid: newGrid,
        playerPos: { x: newX, y: newY }
      });
      
      setMoves(prev => prev + 1);
    }
  };

  // Draw game
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    const { grid } = gameState;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        
        // Draw cell
        ctx.fillStyle = COLORS[cell];
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw border
        ctx.strokeStyle = '#888';
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw additional visual cues for player and boxes
        if (cell === 'player' || cell === 'playerOnTarget') {
          // Draw player as a circle
          ctx.fillStyle = cell === 'player' ? COLORS.player : COLORS.playerOnTarget;
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (cell === 'box' || cell === 'boxOnTarget') {
          // Draw box with a 3D effect
          ctx.fillStyle = cell === 'box' ? COLORS.box : COLORS.boxOnTarget;
          ctx.fillRect(
            x * CELL_SIZE + 5,
            y * CELL_SIZE + 5,
            CELL_SIZE - 10,
            CELL_SIZE - 10
          );
        } else if (cell === 'target') {
          // Draw target as a circle
          ctx.fillStyle = COLORS.target;
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 6,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  };

  // Calculate score based on moves and levels completed
  const calculateScore = () => {
    const baseScore = currentLevel * 1000;
    const movesPenalty = moves * 10;
    return Math.max(0, baseScore - movesPenalty);
  };

  // Render control buttons for mobile
  const renderControls = () => {
    return (
      <div className="game-controls">
        <div className="control-row">
          <button onClick={() => movePlayer('up')}>↑</button>
        </div>
        <div className="control-row">
          <button onClick={() => movePlayer('left')}>←</button>
          <button onClick={() => movePlayer('right')}>→</button>
        </div>
        <div className="control-row">
          <button onClick={() => movePlayer('down')}>↓</button>
        </div>
      </div>
    );
  };

  return (
    <div className="soko-game">
      <div className="game-info">
        <div>{t('game.level')}: {currentLevel + 1}/{levels.length}</div>
        <div>{t('game.moves')}: {moves}</div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
      />
      
      {renderControls()}
      
      <button 
        className="restart-button"
        onClick={() => initLevel(levels[currentLevel])}
      >
        {t('game.restart')}
      </button>
    </div>
  );
};

export default SokoGame; 