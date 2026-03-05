/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameBoard } from '../Game/GameBoard';
import { LEVELS } from '../../game/levels';
import { socketService } from '../../services/socketService';
import { UserProfile } from '../../services/firebase';
import { Trophy, Timer, Swords, Zap, MessageSquare, Send, RefreshCw, LogOut } from 'lucide-react';

interface MultiplayerGameProps {
  userProfile: UserProfile;
  matchData: any;
  onGameOver: (result: any) => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ userProfile, matchData, onGameOver }) => {
  const [localScore, setLocalScore] = useState(0);
  const [localMoves, setLocalMoves] = useState(30);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentMoves, setOpponentMoves] = useState(30);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [rematchOffered, setRematchOffered] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [pendingBlockers, setPendingBlockers] = useState(0);

  const opponent = matchData.players.find((p: any) => p.id !== socketService.getSocket()?.id);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    if (opponent?.isBot) {
      const botInterval = setInterval(() => {
        if (isFinished) return clearInterval(botInterval);
        setOpponentScore(prev => prev + Math.floor(Math.random() * 150) + 50);
        setOpponentMoves(prev => Math.max(0, prev - 1));
      }, 3000);
      return () => clearInterval(botInterval);
    }

    socket.on("opponent_update", (data) => {
      setOpponentScore(data.score);
      setOpponentMoves(data.movesLeft);
    });

    socket.on("receive_chat", (data) => {
      setMessages(prev => [...prev, data]);
      if (!showChat) setShowChat(true);
    });

    socket.on("rematch_offered", () => {
      setRematchOffered(true);
    });

    socket.on("rematch_start", (data) => {
      setLocalScore(0);
      setLocalMoves(30);
      setOpponentScore(0);
      setOpponentMoves(30);
      setTimeLeft(120);
      setIsFinished(false);
      setRematchOffered(false);
    });

    socket.on("opponent_left", () => {
      setOpponentLeft(true);
    });

    socket.on("opponent_disconnected", () => {
      setOpponentDisconnected(true);
    });

    socket.on("receive_blockers", (data) => {
      setPendingBlockers(prev => prev + data.intensity);
      // Visual shake effect
      const gameArea = document.getElementById('game-area');
      if (gameArea) {
        gameArea.classList.add('animate-shake');
        setTimeout(() => gameArea.classList.remove('animate-shake'), 500);
      }
      setTimeout(() => setPendingBlockers(0), 100);
    });

    socket.on("opponent_finished", (data) => {
      setOpponentScore(data.score);
      // Handle opponent finish
    });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      socket.off("opponent_update");
      socket.off("receive_blockers");
      socket.off("opponent_finished");
      clearInterval(timer);
    };
  }, []);

  const handleScoreUpdate = (score: number) => {
    setLocalScore(score);
    socketService.getSocket()?.emit("game_update", {
      roomID: matchData.roomID,
      score,
      movesLeft: localMoves
    });

    // Send combo attack if score jump is high
    if (score - localScore > 500) {
      socketService.getSocket()?.emit("combo_attack", {
        roomID: matchData.roomID,
        intensity: 1
      });
    }
  };

  const handleMovesUpdate = (moves: number) => {
    setLocalMoves(moves);
    if (moves <= 0 && !isFinished) {
      handleGameEnd();
    }
  };

  const handleGameEnd = () => {
    if (isFinished) return;
    setIsFinished(true);
    socketService.getSocket()?.emit("game_over", {
      roomID: matchData.roomID,
      score: localScore
    });
    
    // Wait a bit for final scores to sync
    setTimeout(() => {
      onGameOver({
        localScore,
        opponentScore,
        victory: localScore > opponentScore
      });
    }, 2000);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const socket = socketService.getSocket();
    socket?.emit("chat_message", {
      roomID: matchData.roomID,
      message: chatInput,
      senderName: userProfile.displayName
    });
    setMessages(prev => [...prev, { message: chatInput, senderName: 'You', timestamp: Date.now() }]);
    setChatInput('');
  };

  const handleRematchRequest = () => {
    socketService.getSocket()?.emit("rematch_request", { roomID: matchData.roomID });
  };

  const handleRematchAccept = () => {
    socketService.getSocket()?.emit("rematch_accept", { roomID: matchData.roomID });
  };

  const handleLeave = () => {
    socketService.getSocket()?.emit("leave_room", { roomID: matchData.roomID });
    onGameOver({ exit: true });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden relative">
      {/* Top Bar: Comparison */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-black text-white">
              {userProfile.displayName[0]}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase">You</p>
              <p className="text-sm font-black text-white">{localScore.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full border border-white/20">
              <Timer className="w-4 h-4 text-pink-500" />
              <span className="text-lg font-black text-white font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase">{opponent?.name || 'Opponent'}</p>
              <p className="text-sm font-black text-white">{opponentScore.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-black text-white">
              {(opponent?.name || 'O')[0]}
            </div>
          </div>
        </div>

        {/* Score Comparison Bar */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
          <motion.div 
            className="h-full bg-blue-500"
            animate={{ width: `${(localScore / (localScore + opponentScore + 1)) * 100}%` }}
          />
          <motion.div 
            className="h-full bg-red-500"
            animate={{ width: `${(opponentScore / (localScore + opponentScore + 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative">
        <GameBoard 
          level={LEVELS[0]} // Use a standard level for multiplayer
          onScoreUpdate={handleScoreUpdate}
          onMovesUpdate={handleMovesUpdate}
          onGameOver={() => {}}
          onBoardUpdate={(board) => {
            socketService.getSocket()?.emit("game_update", {
              roomID: matchData.roomID,
              score: localScore,
              movesLeft: localMoves,
              board
            });
          }}
          pendingBlockers={pendingBlockers}
        />
        
        {/* Opponent Mini-status Overlay */}
        <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 pointer-events-none">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase">Opponent Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${showChat ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl">🔨</div>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase">Moves Left</p>
          <p className="text-2xl font-black text-white">{localMoves}</p>
        </div>

        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Swords className="text-white w-6 h-6" />
        </div>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-20 left-4 right-4 h-80 bg-black/90 backdrop-blur-xl rounded-3xl border border-white/20 z-40 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-black uppercase text-xs tracking-widest">Battle Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderName === 'You' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[8px] font-bold text-white/40 uppercase mb-1">{msg.senderName}</span>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${msg.senderName === 'You' ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white/5 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button onClick={sendChat} className="bg-pink-500 p-2 rounded-xl text-white">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="space-y-6 w-full max-w-sm"
            >
              <h2 className="text-6xl font-black text-white italic">
                {localScore > opponentScore ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              
              <div className="bg-white/5 rounded-[32px] p-8 border border-white/10">
                <div className="flex gap-8 justify-center mb-8">
                  <div>
                    <p className="text-white/40 font-bold uppercase text-[10px] mb-1">Your Score</p>
                    <p className="text-4xl font-black text-white">{localScore.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-12 bg-white/20 self-center" />
                  <div>
                    <p className="text-white/40 font-bold uppercase text-[10px] mb-1">Opponent</p>
                    <p className="text-4xl font-black text-white">{opponentScore.toLocaleString()}</p>
                  </div>
                </div>

                {opponentDisconnected ? (
                  <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/50 mb-6">
                    <p className="text-red-200 text-xs font-bold uppercase">Opponent Disconnected</p>
                  </div>
                ) : opponentLeft ? (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/20 mb-6">
                    <p className="text-white/60 text-xs font-bold uppercase">Opponent has left</p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  {!rematchOffered ? (
                    <button 
                      onClick={handleRematchRequest}
                      className="bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Rematch
                    </button>
                  ) : (
                    <button 
                      onClick={handleRematchAccept}
                      className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 animate-bounce"
                    >
                      Accept!
                    </button>
                  )}
                  <button 
                    onClick={handleLeave}
                    className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Quit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
