/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MainMenu } from './components/UI/MainMenu';
import { GameBoard } from './components/Game/GameBoard';
import { MainHUD } from './components/UI/MainHUD';
import { GameOverModal } from './components/UI/GameOverModal';
import { LEVELS } from './game/levels';
import { LevelMap } from './components/UI/LevelMap';
import { sounds } from './game/sounds';
import { motion, AnimatePresence } from 'motion/react';

import { AuthScreen } from './components/Auth/AuthScreen';
import { UserProfile, auth, getUserProfile } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { MultiplayerLobby } from './components/Multiplayer/MultiplayerLobby';
import { MultiplayerGame } from './components/Multiplayer/MultiplayerGame';
import { socketService } from './services/socketService';

type View = 'AUTH' | 'MENU' | 'GAME' | 'MAP' | 'MULTIPLAYER_LOBBY' | 'MULTIPLAYER_GAME';

export default function App() {
  const [view, setView] = useState<View>('AUTH');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          setUnlockedLevelIndex(profile.level - 1);
          setView('MENU');
        } else {
          setView('AUTH');
        }
      } else {
        setView('AUTH');
      }
    });
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setUnlockedLevelIndex(profile.level - 1);
    setView('MENU');
  };

  const handleMatchFound = (data: any) => {
    setMatchData(data);
    setView('MULTIPLAYER_GAME');
  };

  const handleMultiplayerGameOver = (result: any) => {
    // Update user profile with trophies/coins
    if (userProfile) {
      const trophyGain = result.victory ? 25 : -10;
      const coinGain = result.victory ? 50 : 10;
      const newProfile = {
        ...userProfile,
        trophies: Math.max(0, userProfile.trophies + trophyGain),
        coins: userProfile.coins + coinGain
      };
      setUserProfile(newProfile);
      // Sync to Firestore
      // syncUserProfile(userProfile.uid, newProfile);
    }
    setView('MULTIPLAYER_LOBBY');
  };

  const currentLevel = LEVELS[currentLevelIndex];

  const handleGameOver = useCallback((isVictory: boolean) => {
    setVictory(isVictory);
    setIsGameOver(true);
    if (isVictory) {
      sounds.play('victory');
      if (currentLevelIndex === unlockedLevelIndex) {
        setUnlockedLevelIndex(prev => Math.min(prev + 1, LEVELS.length - 1));
      }
    }
  }, [currentLevelIndex, unlockedLevelIndex]);

  useEffect(() => {
    if (moves <= 0 && view === 'GAME' && !isGameOver) {
      handleGameOver(score >= currentLevel.targetScore);
    }
  }, [moves, score, view, isGameOver, currentLevel.targetScore, handleGameOver]);

  const startGame = (levelIndex?: number) => {
    const index = levelIndex !== undefined ? levelIndex : currentLevelIndex;
    setCurrentLevelIndex(index);
    setScore(0);
    setMoves(LEVELS[index].moves);
    setIsGameOver(false);
    setVictory(false);
    setView('GAME');
    sounds.play('pop');
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    sounds.play('match');
  };

  const handleMovesUpdate = (remainingMoves: number) => {
    setMoves(remainingMoves);
  };

  const nextLevel = () => {
    const nextIndex = (currentLevelIndex + 1) % LEVELS.length;
    startGame(nextIndex);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#FF99CC] via-[#CC99FF] to-[#99CCFF] overflow-hidden font-sans select-none touch-none">
      <AnimatePresence mode="wait">
        {view === 'AUTH' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <AuthScreen onAuthSuccess={handleAuthSuccess} />
          </motion.div>
        )}

        {view === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MainMenu 
              userProfile={userProfile} 
              onStart={() => setView('MAP')} 
              onMultiplayer={() => setView('MULTIPLAYER_LOBBY')}
            />
          </motion.div>
        )}

        {view === 'MAP' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="h-full"
          >
            <LevelMap 
              currentLevelIndex={unlockedLevelIndex} 
              onSelectLevel={startGame} 
              onBack={() => setView('MENU')} 
            />
          </motion.div>
        )}

        {view === 'MULTIPLAYER_LOBBY' && (
          <motion.div
            key="mp_lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="h-full"
          >
            <MultiplayerLobby 
              userProfile={userProfile!} 
              onMatchFound={handleMatchFound} 
              onBack={() => setView('MENU')} 
            />
          </motion.div>
        )}

        {view === 'MULTIPLAYER_GAME' && (
          <motion.div
            key="mp_game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MultiplayerGame 
              userProfile={userProfile!} 
              matchData={matchData} 
              onGameOver={handleMultiplayerGameOver} 
            />
          </motion.div>
        )}

        {view === 'GAME' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="h-full flex flex-col"
          >
            <MainHUD 
              level={currentLevel.id} 
              score={score} 
              targetScore={currentLevel.targetScore} 
              moves={moves} 
            />
            
            <div className="flex-1 relative">
              <GameBoard 
                level={currentLevel}
                onScoreUpdate={handleScoreUpdate}
                onMovesUpdate={handleMovesUpdate}
                onGameOver={handleGameOver}
              />
            </div>

            {/* Power-ups Bar */}
            <div className="p-4 bg-black/20 backdrop-blur-md flex justify-around items-center border-t border-white/10">
              <PowerUpButton icon="🔨" label="Hammer" />
              <PowerUpButton icon="🔀" label="Shuffle" />
              <PowerUpButton icon="💣" label="Bomb" />
              <PowerUpButton icon="➕" label="Moves" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isGameOver && (
        <GameOverModal
          victory={victory}
          score={score}
          level={currentLevel.id}
          onRestart={startGame}
          onHome={() => setView('MENU')}
          onNext={victory && currentLevelIndex < LEVELS.length - 1 ? nextLevel : undefined}
        />
      )}
    </div>
  );
}

const PowerUpButton: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center gap-1"
  >
    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/30">
      {icon}
    </div>
    <span className="text-[10px] text-white font-bold uppercase tracking-tighter">{label}</span>
  </motion.button>
);
