/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Play, ShoppingBag, Trophy, Calendar, Swords, LogOut, Settings } from 'lucide-react';
import { UserProfile, auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

interface MainMenuProps {
  userProfile: UserProfile | null;
  onStart: () => void;
  onMultiplayer: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ userProfile, onStart, onMultiplayer }) => {
  return (
    <div className="flex flex-col h-full p-8 relative overflow-hidden bg-gradient-to-b from-pink-400 to-purple-600">
      {/* User Profile Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 pr-6 rounded-full border border-white/20">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center font-black text-white border-2 border-white shadow-lg">
            {userProfile?.displayName[0] || 'U'}
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">{userProfile?.displayName || 'Guest'}</p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-tighter">Level {userProfile?.level || 1}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-white/10 rounded-full text-white border border-white/10"><Settings className="w-5 h-5" /></button>
          <button onClick={() => signOut(auth)} className="p-2 bg-white/10 rounded-full text-white border border-white/10"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12 relative z-10"
        >
          <h1 className="text-7xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)] italic leading-[0.85]">
            SWEET<br/>
            <span className="text-pink-300">BLAST</span>
          </h1>
          <p className="text-white/80 font-bold tracking-[0.3em] uppercase text-[10px] mt-4">The Ultimate Candy Duel</p>
        </motion.div>

        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <MenuButton 
            icon={<Play className="fill-white" />} 
            label="Single Player" 
            color="bg-gradient-to-r from-pink-500 to-pink-600"
            onClick={onStart}
            primary
          />
          <MenuButton 
            icon={<Swords className="text-white" />} 
            label="Arena 1v1" 
            color="bg-gradient-to-r from-indigo-600 to-indigo-700"
            onClick={onMultiplayer}
            primary
          />
          <div className="grid grid-cols-2 gap-4">
            <MenuButton icon={<Calendar />} label="Events" color="bg-orange-500" onClick={() => {}} />
            <MenuButton icon={<ShoppingBag />} label="Shop" color="bg-purple-500" onClick={() => {}} />
          </div>
          <MenuButton icon={<Trophy />} label="Leaderboard" color="bg-blue-500" onClick={() => {}} />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-8 flex justify-around bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 relative z-10">
        <StatItem icon="🪙" value={userProfile?.coins || 0} label="Coins" />
        <StatItem icon="💎" value={userProfile?.gems || 0} label="Gems" />
        <StatItem icon="🏆" value={userProfile?.trophies || 0} label="Trophies" />
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label }: { icon: string; value: number; label: string }) => (
  <div className="text-center">
    <div className="flex items-center gap-1 justify-center">
      <span className="text-lg">{icon}</span>
      <span className="text-white font-black">{value.toLocaleString()}</span>
    </div>
    <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">{label}</p>
  </div>
);

const MenuButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  color: string; 
  onClick: () => void;
  primary?: boolean;
}> = ({ icon, label, color, onClick, primary }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`${color} ${primary ? 'py-6' : 'py-4'} rounded-2xl shadow-xl border-b-4 border-black/20 flex items-center justify-center gap-3 text-white font-black uppercase tracking-wider transition-all active:border-b-0 active:translate-y-1`}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);
