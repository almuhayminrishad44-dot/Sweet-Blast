/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Trophy, Swords, Loader2, ChevronLeft } from 'lucide-react';
import { socketService } from '../../services/socketService';
import { UserProfile } from '../../services/firebase';

interface MultiplayerLobbyProps {
  userProfile: UserProfile;
  onMatchFound: (matchData: any) => void;
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ userProfile, onMatchFound, onBack }) => {
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("waiting_for_opponent", () => {
      setStatus("Searching for a worthy opponent...");
    });

    socket.on("match_found", (data) => {
      onMatchFound(data);
    });

    return () => {
      socket.off("waiting_for_opponent");
      socket.off("match_found");
    };
  }, [onMatchFound]);

  const startMatchmaking = () => {
    setSearching(true);
    const socket = socketService.getSocket();
    socket?.emit("join_matchmaking", {
      name: userProfile.displayName,
      level: userProfile.level
    });
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl text-white">
          <ChevronLeft />
        </button>
        <h2 className="text-3xl font-black text-white italic">ARENA</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {!searching ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(236,72,153,0.5)]">
              <Swords className="text-white w-16 h-16" />
            </div>
            
            <div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Battle Mode</h3>
              <p className="text-white/60 font-bold">1v1 Real-time Match-3 Duel</p>
            </div>

            <div className="flex gap-4 justify-center">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <Trophy className="text-yellow-400 w-6 h-6 mx-auto mb-1" />
                <p className="text-white font-black text-xl">{userProfile.trophies}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase">Trophies</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <Users className="text-blue-400 w-6 h-6 mx-auto mb-1" />
                <p className="text-white font-black text-xl">#{userProfile.level}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase">Rank</p>
              </div>
            </div>

            <button
              onClick={startMatchmaking}
              className="w-full max-w-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest text-xl shadow-2xl shadow-pink-500/30 hover:scale-105 transition-all"
            >
              Find Match
            </button>
          </motion.div>
        ) : (
          <div className="text-center space-y-6">
            <Loader2 className="w-20 h-20 text-pink-500 animate-spin mx-auto" />
            <p className="text-xl font-black text-white animate-pulse">{status}</p>
            <button
              onClick={() => setSearching(false)}
              className="text-white/40 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white/5 rounded-3xl p-6 border border-white/10">
        <h4 className="text-white/40 font-black uppercase tracking-widest text-xs mb-4">Live Tournaments</h4>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="text-yellow-500 w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Sugar Rush Cup</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">Starts in 14m</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white/10 rounded-xl text-white text-xs font-black uppercase">Join</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
