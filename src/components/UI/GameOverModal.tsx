/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Home, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  victory: boolean;
  score: number;
  level: number;
  onRestart: () => void;
  onHome: () => void;
  onNext?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ victory, score, level, onRestart, onHome, onNext }) => {
  React.useEffect(() => {
    if (victory) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [victory]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          className="bg-white rounded-[50px] w-full max-w-sm overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.2)] border-8 border-white relative"
        >
          {/* Animated Background Rays */}
          {victory && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: 'conic-gradient(from 0deg, transparent, #FFD700, transparent, #FFD700, transparent)' }}
            />
          )}

          <div className={`${victory ? 'bg-gradient-to-b from-yellow-400 to-orange-500' : 'bg-gradient-to-b from-slate-400 to-slate-600'} p-10 text-center relative`}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black text-white italic drop-shadow-md">
              {victory ? 'SWEET VICTORY!' : 'OUT OF MOVES'}
            </h2>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm mt-1">
              Level {level}
            </p>
          </motion.div>
          
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            {victory ? <Trophy className="text-yellow-500 w-10 h-10" /> : <span className="text-4xl">😢</span>}
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 text-center">
          <div className="mb-8">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Final Score</p>
            <p className="text-5xl font-black text-slate-800">{score.toLocaleString()}</p>
          </div>

          <div className="flex flex-col gap-3">
            {victory && onNext && (
              <button
                onClick={onNext}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2"
              >
                Next Level <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onRestart}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Try Again <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onHome}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              Main Menu <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
