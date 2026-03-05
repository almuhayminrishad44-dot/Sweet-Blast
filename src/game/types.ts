/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CandyType {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  PURPLE = 'PURPLE',
  ORANGE = 'ORANGE',
}

export enum SpecialType {
  NONE = 'NONE',
  STRIPED_H = 'STRIPED_H',
  STRIPED_V = 'STRIPED_V',
  WRAPPED = 'WRAPPED',
  COLOR_BOMB = 'COLOR_BOMB',
}

export enum ObstacleType {
  NONE = 'NONE',
  ICE = 'ICE',
  CHOCOLATE = 'CHOCOLATE',
  LOCK = 'LOCK',
}

export interface Candy {
  id: string;
  type: CandyType;
  special: SpecialType;
  row: number;
  col: number;
  isNew?: boolean;
}

export interface Tile {
  row: number;
  col: number;
  hasJelly: boolean;
  obstacle: ObstacleType;
  obstacleHealth: number;
}

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  targetScore: number;
  moves: number;
  candyTypes: CandyType[];
  initialTiles?: Partial<Tile>[];
  objectives: {
    type: 'score' | 'collect' | 'clear_jelly' | 'clear_obstacle';
    target: number;
    candyType?: CandyType;
    obstacleType?: ObstacleType;
  }[];
}

export interface GameState {
  board: (Candy | null)[][];
  tiles: Tile[][];
  score: number;
  movesLeft: number;
  isSwapping: boolean;
  isMatching: boolean;
  isFalling: boolean;
  selectedCandy: { row: number; col: number } | null;
  level: LevelConfig;
}
