
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
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a1a] text-white select-none">
      {/* Visual grain and vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>

      <BGMPlayer isMuted={isMuted} isPlaying={gameState.status === GameStatus.PLAYING} />

      {gameState.status === GameStatus.START_SCREEN && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 p-8 text-center backdrop-blur-sm">
          <div className="p-12 border-4 border-orange-500/50 bg-black/40">
            <h1 className="text-4xl md:text-7xl font-bold mb-4 tracking-tighter text-orange-500 drop-shadow-[0_0_15px_rgba(255,126,95,0.5)]">
              孤独的公路
              <span className="block text-2xl mt-4 text-white/80 font-normal">LONELY HIGHWAY</span>
            </h1>
            <p className="max-w-md italic text-gray-400 my-8 text-sm leading-relaxed border-t border-b border-white/10 py-4">
              "{quote}"
            </p>
            
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
              <button 
                onClick={() => startGame(Level.LEVEL_1)}
                className="group relative overflow-hidden bg-white text-black py-4 px-8 font-bold border-4 border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-400 transition-all active:scale-95"
              >
                第一关：笔直冲刺
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </button>
              <button 
                onClick={() => startGame(Level.LEVEL_2)}
                className="group relative overflow-hidden bg-black text-white py-4 px-8 font-bold border-4 border-gray-700 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(255,165,0,0.3)] transition-all active:scale-95"
              >
                第二关：蜿蜒山道
                <div className="absolute inset-0 bg-orange-500/10 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
              </button>
            </div>

            <div className="mt-12 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
              [W/A/D] 驾驶 • 不要停下 • 不要坠落
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
