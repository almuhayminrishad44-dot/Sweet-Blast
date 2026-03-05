/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candy, CandyType, GameState, LevelConfig, ObstacleType, SpecialType, Tile } from './types';

export class GameEngine {
  static createInitialState(level: LevelConfig): GameState {
    const board: (Candy | null)[][] = Array(level.rows).fill(null).map(() => Array(level.cols).fill(null));
    const tiles: Tile[][] = Array(level.rows).fill(null).map((_, r) => 
      Array(level.cols).fill(null).map((_, c) => ({
        row: r,
        col: c,
        hasJelly: false,
        obstacle: ObstacleType.NONE,
        obstacleHealth: 0,
      }))
    );

    // Apply level-specific tile modifications
    level.initialTiles?.forEach(t => {
      if (tiles[t.row!]?.[t.col!]) {
        Object.assign(tiles[t.row!]![t.col!]!, t);
      }
    });

    // Fill board with random candies, avoiding initial matches
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        let type: CandyType;
        do {
          type = level.candyTypes[Math.floor(Math.random() * level.candyTypes.length)];
        } while (
          (c >= 2 && board[r][c - 1]?.type === type && board[r][c - 2]?.type === type) ||
          (r >= 2 && board[r - 1][c]?.type === type && board[r - 2][c]?.type === type)
        );
        
        board[r][c] = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          special: SpecialType.NONE,
          row: r,
          col: c,
        };
      }
    }

    return {
      board,
      tiles,
      score: 0,
      movesLeft: level.moves,
      isSwapping: false,
      isMatching: false,
      isFalling: false,
      selectedCandy: null,
      level,
    };
  }

  static findMatches(board: (Candy | null)[][]): { r: number; c: number; type: SpecialType; candyType: CandyType }[] {
    const rows = board.length;
    const cols = board[0].length;
    const matchedCells = new Map<string, { r: number; c: number; candyType: CandyType }>();
    const specialCreations: { r: number; c: number; type: SpecialType; candyType: CandyType }[] = [];

    // Horizontal matches
    for (let r = 0; r < rows; r++) {
      let matchLen = 1;
      for (let c = 0; c < cols; c++) {
        let isMatch = false;
        if (c < cols - 1 && board[r][c]?.type && board[r][c]?.type === board[r][c + 1]?.type) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            isMatch = true;
          }
        }

        if (isMatch) {
          let specialType = SpecialType.NONE;
          if (matchLen === 4) specialType = SpecialType.STRIPED_H;
          if (matchLen >= 5) specialType = SpecialType.COLOR_BOMB;

          const candyType = board[r][c - matchLen + 1]!.type;
          for (let i = 0; i < matchLen; i++) {
            matchedCells.set(`${r},${c - i}`, { r, c: c - i, candyType });
          }
          
          if (specialType !== SpecialType.NONE) {
            specialCreations.push({ r, c: c - Math.floor(matchLen / 2), type: specialType, candyType });
          }
          matchLen = 1;
        } else if (c < cols - 1 && board[r][c]?.type !== board[r][c + 1]?.type) {
          matchLen = 1;
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < cols; c++) {
      let matchLen = 1;
      for (let r = 0; r < rows; r++) {
        let isMatch = false;
        if (r < rows - 1 && board[r][c]?.type && board[r][c]?.type === board[r + 1][c]?.type) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            isMatch = true;
          }
        }

        if (isMatch) {
          let specialType = SpecialType.NONE;
          if (matchLen === 4) specialType = SpecialType.STRIPED_V;
          if (matchLen >= 5) specialType = SpecialType.COLOR_BOMB;

          const candyType = board[r - matchLen + 1][c]!.type;
          for (let i = 0; i < matchLen; i++) {
            matchedCells.set(`${r - i},${c}`, { r: r - i, c, candyType });
          }

          if (specialType !== SpecialType.NONE) {
            specialCreations.push({ r: r - Math.floor(matchLen / 2), c, type: specialType, candyType });
          }
          matchLen = 1;
        } else if (r < rows - 1 && board[r][c]?.type !== board[r + 1][c]?.type) {
          matchLen = 1;
        }
      }
    }

    // Convert matched cells to the expected format
    const results: any[] = Array.from(matchedCells.values()).map(cell => ({ ...cell, type: SpecialType.NONE }));
    
    // Add special creations (these will replace one of the matched candies)
    specialCreations.forEach(sc => {
      const existing = results.find(r => r.r === sc.r && r.c === sc.c);
      if (existing) {
        existing.type = sc.type;
      }
    });

    return results;
  }

  static handleObstacles(board: (Candy | null)[][], tiles: Tile[][], matches: { r: number; c: number }[]): { score: number } {
    let score = 0;
    matches.forEach(({ r, c }) => {
      // Check neighbors for obstacles
      const neighbors = [
        { r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }
      ];

      neighbors.forEach(n => {
        if (tiles[n.r]?.[n.c]) {
          const tile = tiles[n.r][n.c];
          if (tile.obstacle === ObstacleType.ICE || tile.obstacle === ObstacleType.CHOCOLATE) {
            tile.obstacleHealth--;
            if (tile.obstacleHealth <= 0) {
              tile.obstacle = ObstacleType.NONE;
              score += 50;
            }
          }
        }
      });

      // Check current tile for jelly
      if (tiles[r]?.[c]?.hasJelly) {
        tiles[r][c].hasJelly = false;
        score += 100;
      }
    });
    return { score };
  }

  static shuffleBoard(board: (Candy | null)[][], candyTypes: CandyType[]): (Candy | null)[][] {
    const candies = board.flat().filter(c => c !== null) as Candy[];
    const rows = board.length;
    const cols = board[0].length;
    
    // Shuffle the array of candies
    for (let i = candies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candies[i], candies[j]] = [candies[j], candies[i]];
    }

    const newBoard: (Candy | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] !== null) {
          const candy = candies[index++];
          newBoard[r][c] = { ...candy, row: r, col: c };
        }
      }
    }
    return newBoard;
  }

  static hasPossibleMoves(board: (Candy | null)[][]): boolean {
    const rows = board.length;
    const cols = board[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Try swapping with right neighbor
        if (c < cols - 1) {
          const tempBoard = board.map(row => [...row]);
          [tempBoard[r][c], tempBoard[r][c + 1]] = [tempBoard[r][c + 1], tempBoard[r][c]];
          if (this.findMatches(tempBoard).length > 0) return true;
        }
        // Try swapping with bottom neighbor
        if (r < rows - 1) {
          const tempBoard = board.map(row => [...row]);
          [tempBoard[r][c], tempBoard[r + 1][c]] = [tempBoard[r + 1][c], tempBoard[r][c]];
          if (this.findMatches(tempBoard).length > 0) return true;
        }
      }
    }
    return false;
  }

  static checkSwap(r1: number, c1: number, r2: number, c2: number): boolean {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }
}
