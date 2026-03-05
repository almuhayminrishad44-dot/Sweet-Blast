/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Hash, Target } from 'lucide-react';

interface MainHUDProps {
  level: number;
  score: number;
  targetScore: number;
  moves: number;
}

export const MainHUD: React.FC<MainHUDProps> = ({ level, score, targetScore, moves }) => {
  const progress = Math.min((score / targetScore) * 100, 100);

  return (
    <div className="w-full p-4 flex flex-col gap-4 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500 p-2 rounded-lg shadow-lg">
            <Hash className="text-white w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Level</p>
            <p className="text-xl font-black text-white leading-none">{level}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Moves</p>
          <div className="bg-orange-500 px-4 py-1 rounded-full shadow-lg border-2 border-white/30">
            <p className="text-2xl font-black text-white">{moves}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Score</p>
            <p className="text-xl font-black text-white leading-none">{score.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-500 p-2 rounded-lg shadow-lg">
            <Trophy className="text-white w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/60 font-bold mb-1">
          <span>Progress</span>
          <span>Target: {targetScore.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
