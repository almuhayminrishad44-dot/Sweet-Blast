/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Star, Lock } from 'lucide-react';
import { LEVELS } from '../../game/levels';

interface LevelMapProps {
  currentLevelIndex: number;
  onSelectLevel: (index: number) => void;
  onBack: () => void;
}

export const LevelMap: React.FC<LevelMapProps> = ({ currentLevelIndex, onSelectLevel, onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center gap-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <button onClick={onBack} className="p-2 bg-white/20 rounded-xl text-white">
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-black text-white italic">WORLD MAP</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Path Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-white/20 -translate-x-1/2 rounded-full" />

        <div className="flex flex-col-reverse gap-16 relative z-10">
          {LEVELS.map((level, index) => {
            const isUnlocked = index <= currentLevelIndex;
            const isCurrent = index === currentLevelIndex;

            return (
              <motion.div
                key={level.id}
                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} justify-center`}
              >
                <div className="text-center">
                  <motion.button
                    whileHover={isUnlocked ? { scale: 1.1 } : {}}
                    whileTap={isUnlocked ? { scale: 0.9 } : {}}
                    onClick={() => isUnlocked && onSelectLevel(index)}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-xl transition-all ${
                      isCurrent 
                        ? 'bg-yellow-400 border-white scale-110 ring-4 ring-yellow-400/50' 
                        : isUnlocked 
                          ? 'bg-pink-500 border-white/50' 
                          : 'bg-slate-700 border-slate-800 opacity-50'
                    }`}
                  >
                    {isUnlocked ? (
                      <span className="text-2xl font-black text-white">{level.id}</span>
                    ) : (
                      <Lock className="text-white/40" />
                    )}
                  </motion.button>
                  
                  {isUnlocked && (
                    <div className="flex justify-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <Star className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                </div>

                <div className={`w-32 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                  <p className={`font-black uppercase tracking-widest text-xs ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                    Level {level.id}
                  </p>
                  <p className={`text-[10px] font-bold ${isUnlocked ? 'text-white/60' : 'text-white/20'}`}>
                    {isUnlocked ? 'Sugar Valley' : 'Locked'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
