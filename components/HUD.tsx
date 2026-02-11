
import React from 'react';
import { GameState, Level } from '../types';
import { LEVEL_CONFIGS } from '../constants';

interface HUDProps {
  gameState: GameState;
  stagnationTime: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

const HUD: React.FC<HUDProps> = ({ gameState, stagnationTime, isMuted, onToggleMute }) => {
  const goal = LEVEL_CONFIGS[gameState.currentLevel].distanceGoal;
  const progress = Math.min((gameState.distanceTraveled / goal) * 100, 100);
  const showStagnationWarning = stagnationTime > 3;

  return (
    <div className="fixed top-0 left-0 w-full p-6 flex flex-col items-center pointer-events-none select-none">
      <div className="w-full max-w-2xl bg-black/50 border-4 border-white p-4 flex flex-col gap-2 relative pointer-events-auto">
        {/* Mute Toggle */}
        <button 
          onClick={onToggleMute}
          className="absolute -right-16 top-0 bg-black/50 border-4 border-white p-2 hover:bg-white hover:text-black transition-colors"
          title={isMuted ? "取消静音" : "静音"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <div className="flex justify-between text-white text-[10px] md:text-sm">
          <span>关卡 {gameState.currentLevel}</span>
          <span>{Math.floor(gameState.speed * 200)} 公里/小时</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-800 border-2 border-white overflow-hidden">
          <div 
            className="h-full bg-yellow-400" 
            style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
          />
        </div>
        
        <div className="flex justify-between text-white text-[10px]">
          <span>{Math.floor(gameState.distanceTraveled)}米</span>
          <span>目标: {goal}米</span>
        </div>
      </div>

      {showStagnationWarning && (
        <div className="mt-8 animate-pulse text-red-500 text-xl font-bold bg-black/80 px-4 py-2 border-2 border-red-500">
          警告：别停下！还剩 {(5 - stagnationTime).toFixed(1)}秒
        </div>
      )}
    </div>
  );
};

export default HUD;
