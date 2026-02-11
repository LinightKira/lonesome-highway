
import React, { useState, useCallback, useEffect } from 'react';
import { GameStatus, Level, GameState } from './types';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import BGMPlayer from './components/BGMPlayer';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START_SCREEN,
    currentLevel: Level.LEVEL_1,
    distanceTraveled: 0,
    speed: 0,
    failReason: ''
  });
  const [stagnationTime, setStagnationTime] = useState(0);
  const [quote, setQuote] = useState("只有这条路知道你要去往何方。");
  const [isMuted, setIsMuted] = useState(false);

  // 静态文案库 - 精心挑选的忧郁公路主题文案
  const staticQuotes = [
    "只有这条路知道你要去往何方。",
    "夕阳下的公路，无尽的旅程。",
    "孤灯一盏，长路漫漫。",
    "风在耳边，路在脚下。",
    "无人陪伴，只有车与你。",
    "这条路，走多久都不为过。",
    "远方的尽头，是新的开始。",
    "车轮转动，岁月无声。",
    "在这条路上，你不必说一句话。",
    "独自前行，也是一种勇气。"
  ];

  useEffect(() => {
    if (gameState.status === GameStatus.START_SCREEN) {
      // 随机选择一条文案
      const randomQuote = staticQuotes[Math.floor(Math.random() * staticQuotes.length)];
      setQuote(randomQuote);
    }
  }, [gameState.status]);

  const startGame = (level: Level) => {
    setGameState({
      status: GameStatus.PLAYING,
      currentLevel: level,
      distanceTraveled: 0,
      speed: 0,
      failReason: ''
    });
    setStagnationTime(0);
  };

  const handleFail = useCallback((reason: string) => {
    setGameState(prev => ({ ...prev, status: GameStatus.GAME_OVER, failReason: reason }));
  }, []);

  const handleWin = useCallback(() => {
    setGameState(prev => ({ ...prev, status: GameStatus.LEVEL_WON }));
  }, []);

  const updateStats = useCallback((distance: number, speed: number) => {
    setGameState(prev => ({ ...prev, distanceTraveled: distance, speed }));
  }, []);

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0f0f23] text-white select-none">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,126,95,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(0,0,0,0.3)_100%)]"></div>
      </div>

      {/* Visual grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>

      <BGMPlayer isMuted={isMuted} isPlaying={gameState.status === GameStatus.PLAYING} />

      {gameState.status === GameStatus.START_SCREEN && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center">
          {/* Main menu container */}
          <div className="relative p-10 md:p-16 border-4 border-orange-500/60 bg-black/70 backdrop-blur-md shadow-[0_0_60px_rgba(255,126,95,0.3)] max-w-2xl">
            {/* Decorative corners */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-orange-400"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-orange-400"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-orange-400"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-orange-400"></div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-8xl font-bold mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 drop-shadow-[0_0_20px_rgba(255,126,95,0.6)]">
                孤独的公路
              </h1>
              <p className="text-2xl md:text-3xl text-orange-300/90 font-light tracking-[0.3em] font-mono">
                LONELY HIGHWAY
              </p>
            </div>

            {/* Quote section */}
            <div className="max-w-lg mx-auto mb-10 px-6 py-6 border-t border-b border-orange-500/30 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5">
              <p className="italic text-orange-200/90 text-base md:text-lg leading-relaxed">
                "{quote}"
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
              <button
                onClick={() => startGame(Level.LEVEL_1)}
                className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white py-5 px-10 font-bold border-4 border-orange-400/50 hover:from-orange-400 hover:to-orange-500 hover:border-orange-300 hover:shadow-[0_0_30px_rgba(255,126,95,0.5)] hover:scale-[1.02] transition-all duration-200"
              >
                <span className="relative z-10 text-lg md:text-xl">
                  第一关：笔直冲刺
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <button
                onClick={() => startGame(Level.LEVEL_2)}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white py-5 px-10 font-bold border-4 border-gray-700/50 hover:from-gray-800 hover:to-gray-700 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(255,165,0,0.4)] hover:scale-[1.02] transition-all duration-200"
              >
                <span className="relative z-10 text-lg md:text-xl">
                  第二关：蜿蜒山道
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </button>
            </div>

            {/* Controls hint */}
            <div className="mt-8 text-xs md:text-sm text-gray-400 uppercase tracking-[0.25em] space-y-2">
              <p className="font-bold text-orange-400/80">操作说明</p>
              <p>[W/A/D] 或 [方向键] 驾驶</p>
              <p>保持前进速度 • 不要坠落</p>
            </div>
          </div>

          {/* Footer decoration */}
          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-2 border-2 border-orange-500/30 bg-black/40 text-xs text-orange-300/70 uppercase tracking-[0.3em]">
              🎮 Press W/A/D to Drive 🚗
            </div>
          </div>
        </div>
      )}

      {gameState.status === GameStatus.PLAYING && (
        <>
          <GameCanvas 
            status={gameState.status}
            level={gameState.currentLevel}
            onWin={handleWin}
            onFail={handleFail}
            updateStats={updateStats}
            stagnationTime={stagnationTime}
            setStagnationTime={setStagnationTime}
          />
          <HUD 
            gameState={gameState} 
            stagnationTime={stagnationTime} 
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </>
      )}

      {gameState.status === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/80 p-8 text-center backdrop-blur-md animate-in fade-in duration-700">
          <div className="p-10 border-8 border-red-500 bg-black/60 shadow-[0_0_50px_rgba(255,0,0,0.5)]">
            <h2 className="text-6xl font-bold mb-4 text-red-500 drop-shadow-glow">游戏结束</h2>
            <p className="text-xl mb-12 text-white font-bold tracking-[0.3em] uppercase">{gameState.failReason}</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => startGame(gameState.currentLevel)}
                className="bg-white text-black py-5 px-16 text-xl font-bold border-4 border-gray-300 hover:bg-red-500 hover:text-white transition-all active:scale-90"
              >
                重试
              </button>
              <button 
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                className="text-gray-400 hover:text-white underline tracking-widest text-sm"
              >
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState.status === GameStatus.LEVEL_WON && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-orange-500/20 p-8 text-center backdrop-blur-xl animate-in zoom-in duration-500">
          <div className="p-12 bg-black/80 border-8 border-yellow-400 shadow-[0_0_100px_rgba(255,200,0,0.3)]">
            <h2 className="text-6xl font-bold mb-4 text-yellow-400 animate-bounce">胜利</h2>
            <p className="text-xl mb-12 text-white font-medium uppercase tracking-[0.2em]">你征服了这条公路</p>
            
            <div className="flex flex-col gap-4">
              {gameState.currentLevel === Level.LEVEL_1 && (
                <button 
                  onClick={() => startGame(Level.LEVEL_2)}
                  className="bg-yellow-400 text-black py-5 px-16 text-xl font-bold border-4 border-white hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                >
                  下一关：第二关
                </button>
              )}
              <button 
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                className="bg-white/10 text-white py-4 px-16 font-bold border-4 border-white/20 hover:bg-white hover:text-black transition-all"
              >
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
