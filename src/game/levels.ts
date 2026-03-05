/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CandyType, LevelConfig, ObstacleType } from './types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    rows: 8,
    cols: 8,
    targetScore: 1000,
    moves: 20,
    candyTypes: [CandyType.RED, CandyType.BLUE, CandyType.GREEN, CandyType.YELLOW, CandyType.PURPLE],
    objectives: [{ type: 'score', target: 1000 }],
  },
  {
    id: 2,
    rows: 8,
    cols: 8,
    targetScore: 2000,
    moves: 25,
    candyTypes: [CandyType.RED, CandyType.BLUE, CandyType.GREEN, CandyType.YELLOW, CandyType.PURPLE, CandyType.ORANGE],
    objectives: [{ type: 'score', target: 2000 }],
  },
  {
    id: 3,
    rows: 8,
    cols: 8,
    targetScore: 1500,
    moves: 15,
    candyTypes: [CandyType.RED, CandyType.BLUE, CandyType.GREEN, CandyType.YELLOW],
    initialTiles: [
      { row: 3, col: 3, hasJelly: true },
      { row: 3, col: 4, hasJelly: true },
      { row: 4, col: 3, hasJelly: true },
      { row: 4, col: 4, hasJelly: true },
    ],
    objectives: [{ type: 'clear_jelly', target: 4 }],
  }
];
