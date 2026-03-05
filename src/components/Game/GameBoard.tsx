/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { Candy, GameState, LevelConfig } from '../../game/types';
import { GameEngine } from '../../game/engine';
import { CandySprite } from './CandySprite';
import confetti from 'canvas-confetti';

interface GameBoardProps {
  level: LevelConfig;
  onScoreUpdate: (score: number) => void;
  onMovesUpdate: (moves: number) => void;
  onGameOver: (victory: boolean) => void;
  onBoardUpdate?: (board: (Candy | null)[][]) => void;
  pendingBlockers?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ level, onScoreUpdate, onMovesUpdate, onGameOver, onBoardUpdate, pendingBlockers = 0 }) => {
  const [gameState, setGameState] = useState<GameState>(() => GameEngine.createInitialState(level));
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle incoming blockers
  useEffect(() => {
    if (pendingBlockers > 0) {
      setGameState(prev => {
        const newBoard = prev.board.map(row => [...row]);
        let added = 0;
        // Add blockers to random empty slots or replace candies at the bottom
        for (let i = 0; i < pendingBlockers; i++) {
          const r = Math.floor(Math.random() * level.rows);
          const c = Math.floor(Math.random() * level.cols);
          // In a real game, blockers might be special tiles. Here we just null them to simulate damage.
          newBoard[r][c] = null;
        }
        return { ...prev, board: newBoard, isFalling: true };
      });
    }
  }, [pendingBlockers]);

  // Sync board with parent
  useEffect(() => {
    if (onBoardUpdate) {
      onBoardUpdate(gameState.board);
    }
  }, [gameState.board, onBoardUpdate]);

  const cellSize = Math.min(containerSize.width / level.cols, containerSize.height / level.rows);
  const boardWidth = cellSize * level.cols;
  const boardHeight = cellSize * level.rows;
  const offsetX = (containerSize.width - boardWidth) / 2;
  const offsetY = (containerSize.height - boardHeight) / 2;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync score and moves with parent
  useEffect(() => {
    onScoreUpdate(gameState.score);
  }, [gameState.score, onScoreUpdate]);

  useEffect(() => {
    onMovesUpdate(gameState.movesLeft);
  }, [gameState.movesLeft, onMovesUpdate]);

  // Game Loop for matching and cascading
  useEffect(() => {
    if (gameState.isMatching || gameState.isFalling) {
      const timer = setTimeout(() => {
        processGameStep();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState.isMatching, gameState.isFalling]);

  const processGameStep = () => {
    setGameState(prev => {
      const newBoard = prev.board.map(row => [...row]);
      
      if (prev.isMatching) {
        const matches = GameEngine.findMatches(newBoard);
        if (matches.length > 0) {
          const obstacleResults = GameEngine.handleObstacles(newBoard, prev.tiles, matches);
          const scoreGain = matches.length * 10 + obstacleResults.score;
          
          matches.forEach(({ r, c, type, candyType }) => {
            if (type !== 0 as any) { // SpecialType.NONE
              newBoard[r][c] = {
                id: Math.random().toString(36).substr(2, 9),
                type: candyType,
                special: type,
                row: r,
                col: c,
              };
            } else {
              newBoard[r][c] = null;
            }
          });
          return { ...prev, board: newBoard, isMatching: false, isFalling: true, score: prev.score + scoreGain };
        } else {
          return { ...prev, isMatching: false };
        }
      }

      if (prev.isFalling) {
        let moved = false;
        // Gravity
        for (let c = 0; c < level.cols; c++) {
          for (let r = level.rows - 1; r > 0; r--) {
            if (newBoard[r][c] === null && newBoard[r - 1][c] !== null) {
              newBoard[r][c] = { ...newBoard[r - 1][c]!, row: r, col: c };
              newBoard[r - 1][c] = null;
              moved = true;
            }
          }
        }

        // Spawn new candies at top
        for (let c = 0; c < level.cols; c++) {
          if (newBoard[0][c] === null) {
            newBoard[0][c] = {
              id: Math.random().toString(36).substr(2, 9),
              type: level.candyTypes[Math.floor(Math.random() * level.candyTypes.length)],
              special: 0 as any, // SpecialType.NONE
              row: 0,
              col: c,
              isNew: true,
            };
            moved = true;
          }
        }

        if (!moved) {
          // Check for new matches after falling
          const nextMatches = GameEngine.findMatches(newBoard);
          if (nextMatches.length === 0) {
            // Check if any moves are possible
            if (!GameEngine.hasPossibleMoves(newBoard)) {
              console.log("No moves possible, shuffling...");
              const shuffledBoard = GameEngine.shuffleBoard(newBoard, level.candyTypes);
              return { ...prev, board: shuffledBoard, isFalling: false, isMatching: false };
            }
          }
          return { ...prev, board: newBoard, isFalling: false, isMatching: nextMatches.length > 0 };
        }
        return { ...prev, board: newBoard };
      }

      return prev;
    });
  };

  const handleCandyClick = (row: number, col: number) => {
    if (gameState.isMatching || gameState.isFalling || gameState.isSwapping) return;

    if (!gameState.selectedCandy) {
      setGameState(prev => ({ ...prev, selectedCandy: { row, col } }));
    } else {
      const { row: r1, col: c1 } = gameState.selectedCandy;
      if (GameEngine.checkSwap(r1, c1, row, col)) {
        performSwap(r1, c1, row, col);
      } else {
        setGameState(prev => ({ ...prev, selectedCandy: { row, col } }));
      }
    }
  };

  const performSwap = (r1: number, c1: number, r2: number, c2: number) => {
    setGameState(prev => {
      const newBoard = prev.board.map(row => [...row]);
      const candy1 = newBoard[r1][c1];
      const candy2 = newBoard[r2][c2];

      if (!candy1 || !candy2) return prev;

      newBoard[r1][c1] = { ...candy2, row: r1, col: c1 };
      newBoard[r2][c2] = { ...candy1, row: r2, col: c2 };

      const matches = GameEngine.findMatches(newBoard);
      if (matches.length > 0) {
        return {
          ...prev,
          board: newBoard,
          selectedCandy: null,
          isMatching: true,
          movesLeft: prev.movesLeft - 1,
        };
      } else {
        // Swap back if no match (simplified: just don't swap)
        return { ...prev, selectedCandy: null };
      }
    });
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <Stage width={containerSize.width} height={containerSize.height}>
        <Layer x={offsetX} y={offsetY}>
          {/* Grid Background */}
          {gameState.tiles.map((row, r) =>
            row.map((tile, c) => (
              <Rect
                key={`tile-${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={tile.hasJelly ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.1)'}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={1}
                cornerRadius={8}
              />
            ))
          )}

          {/* Candies */}
          {gameState.board.map((row, r) =>
            row.map((candy, c) => (
              candy && (
                <Group
                  key={candy.id}
                  onClick={() => handleCandyClick(r, c)}
                  onTap={() => handleCandyClick(r, c)}
                >
                  <CandySprite
                    type={candy.type}
                    special={candy.special}
                    x={c * cellSize}
                    y={r * cellSize}
                    size={cellSize}
                    isSelected={gameState.selectedCandy?.row === r && gameState.selectedCandy?.col === c}
                  />
                </Group>
              )
            ))
          )}
        </Layer>
      </Stage>
    </div>
  );
};
