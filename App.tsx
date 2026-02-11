
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
    <div className="relative w-full h-screen overflow-hidden text-white select-none">
      {/* Dynamic background based on game status */}
      <div className="absolute inset-0 z-0">
        {/* Start Screen Background */}
        {gameState.status === GameStatus.START_SCREEN && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#4a1c6b] to-[#2d1b4e] animate-gradient-x"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,126,95,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,165,0,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </>
        )}

        {/* Game Over Background */}
        {gameState.status === GameStatus.GAME_OVER && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a0a0a] via-[#4a1a1a] to-[#1a0505]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,50,50,0.2),transparent_70%)] animate-pulse"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
          </>
        )}

        {/* Level Won Background */}
        {gameState.status === GameStatus.LEVEL_WON && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a1a] via-[#3d5a2d] to-[#4a3d1a]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.2),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/gold-carpet.png')] opacity-10"></div>
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </>
        )}

        {/* Playing Background - Minimal */}
        {gameState.status === GameStatus.PLAYING && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0f0f23]"></div>
        )}
      </div>

      {/* Visual grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>

      <BGMPlayer isMuted={isMuted} isPlaying={gameState.status === GameStatus.PLAYING} />

      {gameState.status === GameStatus.START_SCREEN && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 md:p-12 text-center">
          {/* Animated title card */}
          <div className="relative p-8 md:p-14 border-4 border-orange-500/50 bg-black/60 backdrop-blur-xl shadow-[0_0_80px_rgba(255,126,95,0.4)] max-w-4xl transform hover:scale-[1.01] transition-transform duration-500">
            {/* Animated borders */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 opacity-0 animate-pulse"></div>

            {/* Corner decorations */}
            <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-orange-400 transform -rotate-45"></div>
            <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-orange-400 transform rotate-45"></div>
            <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-orange-400 transform rotate-45"></div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-orange-400 transform -rotate-45"></div>

            {/* Title section with glow effect */}
            <div className="mb-10 relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-orange-500/30 via-yellow-500/20 to-orange-500/30"></div>
              <h1 className="relative text-4xl sm:text-6xl md:text-8xl font-bold mb-3 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 animate-gradient-x">
                孤独的公路
              </h1>
              <p className="relative text-xl sm:text-2xl md:text-3xl text-orange-300/90 font-light tracking-[0.4em] font-mono">
                LONELY HIGHWAY
              </p>
            </div>

            {/* Quote with elegant styling */}
            <div className="max-w-2xl mx-auto mb-10 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-yellow-500/5 to-orange-500/5"></div>
              <div className="relative border-t-2 border-b-2 border-orange-500/40 py-4">
                <div className="text-3xl text-orange-200/20 absolute top-2 left-6">"</div>
                <p className="italic text-orange-100/90 text-base sm:text-lg md:text-xl leading-relaxed font-light">
                  {quote}
                </p>
                <div className="text-3xl text-orange-200/20 absolute bottom-2 right-6">"</div>
              </div>
            </div>

            {/* Buttons with enhanced effects */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-2xl mx-auto">
              <button
                onClick={() => startGame(Level.LEVEL_1)}
                className="group relative flex-1 overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white py-6 px-8 font-bold border-4 border-orange-400/60 hover:from-orange-400 hover:via-orange-500 hover:to-red-400 hover:border-orange-300 hover:shadow-[0_0_40px_rgba(255,126,95,0.6)] hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10 text-base sm:text-lg md:text-xl flex items-center justify-center gap-2">
                  <span className="text-2xl">🏎️</span>
                  第一关：笔直冲刺
                </span>
              </button>

              <button
                onClick={() => startGame(Level.LEVEL_2)}
                className="group relative flex-1 overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-6 px-8 font-bold border-4 border-gray-700/60 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 hover:border-orange-500/60 hover:shadow-[0_0_40px_rgba(255,165,0,0.5)] hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                <span className="relative z-10 text-base sm:text-lg md:text-xl flex items-center justify-center gap-2">
                  <span className="text-2xl">🏔️</span>
                  第二关：蜿蜒山道
                </span>
              </button>
            </div>

            {/* Enhanced controls section */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="px-6 py-4 bg-black/40 rounded-lg border-2 border-orange-500/30">
                <div className="text-orange-400/90 font-bold text-sm mb-1">加速</div>
                <div className="text-2xl">W / ↑</div>
              </div>
              <div className="px-6 py-4 bg-black/40 rounded-lg border-2 border-orange-500/30">
                <div className="text-orange-400/90 font-bold text-sm mb-1">转向</div>
                <div className="text-2xl">A / D</div>
              </div>
              <div className="px-6 py-4 bg-black/40 rounded-lg border-2 border-orange-500/30">
                <div className="text-orange-400/90 font-bold text-sm mb-1">减速</div>
                <div className="text-2xl">S / ↓</div>
              </div>
            </div>

            {/* Footer hint */}
            <div className="mt-10 text-center">
              <p className="text-sm text-orange-300/70 font-mono tracking-widest">
                按下按键开始你的孤独旅程 🚗
              </p>
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 md:p-12 text-center">
          <div className="relative p-10 md:p-16 border-4 border-red-500/60 bg-black/70 backdrop-blur-xl shadow-[0_0_100px_rgba(255,50,50,0.5)] max-w-2xl transform animate-in fade-in duration-700">
            {/* Animated red glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 via-red-500/30 to-red-600/20 blur-3xl"></div>

            {/* Corner accents */}
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-red-400 transform -rotate-45 opacity-80"></div>
            <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-red-400 transform rotate-45 opacity-80"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-red-400 transform rotate-45 opacity-80"></div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-red-400 transform -rotate-45 opacity-80"></div>

            {/* Icon */}
            <div className="mb-8 text-6xl md:text-8xl animate-pulse">💥</div>

            {/* Title */}
            <h2 className="relative text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 drop-shadow-[0_0_30px_rgba(255,50,50,0.8)]">
              游戏结束
            </h2>

            {/* Failure reason */}
            <div className="relative mb-10 px-8 py-5 bg-red-900/30 rounded-lg border-2 border-red-500/50">
              <p className="text-xl md:text-2xl text-red-100 font-bold tracking-wider">
                {gameState.failReason}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => startGame(gameState.currentLevel)}
                className="group relative flex-1 overflow-hidden bg-gradient-to-br from-white via-gray-100 to-white text-black py-5 px-8 text-lg md:text-xl font-bold border-4 border-gray-300 hover:from-red-500 hover:via-red-600 hover:to-red-700 hover:text-white hover:border-red-400 hover:shadow-[0_0_40px_rgba(255,50,50,0.6)] hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-400"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🔄</span>
                  再次尝试
                </span>
              </button>

              <button
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                className="group relative flex-1 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-5 px-8 text-lg md:text-xl font-bold border-4 border-gray-700/60 hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(255,165,0,0.4)] hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🏠</span>
                  返回主菜单
                </span>
              </button>
            </div>

            {/* Encouragement text */}
            <p className="mt-8 text-base text-red-200/70 font-mono">
              失败是成功之母，继续前进！💪
            </p>
          </div>
        </div>
      )}

      {gameState.status === GameStatus.LEVEL_WON && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 md:p-12 text-center">
          <div className="relative p-10 md:p-16 border-4 border-yellow-500/60 bg-black/70 backdrop-blur-xl shadow-[0_0_100px_rgba(255,215,0,0.4)] max-w-2xl transform animate-in zoom-in duration-500">
            {/* Golden glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-3xl animate-pulse"></div>

            {/* Corner decorations */}
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-yellow-400 transform -rotate-45"></div>
            <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-yellow-400 transform rotate-45"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-yellow-400 transform rotate-45"></div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-yellow-400 transform -rotate-45"></div>

            {/* Trophy icon */}
            <div className="mb-6 text-6xl md:text-8xl animate-bounce">🏆</div>

            {/* Title */}
            <h2 className="relative text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 drop-shadow-[0_0_40px_rgba(255,215,0,0.8)]">
              胜利
            </h2>

            {/* Success message */}
            <div className="relative mb-10 px-8 py-6 bg-yellow-900/20 rounded-lg border-2 border-yellow-500/50">
              <p className="text-lg md:text-2xl text-yellow-100 font-medium tracking-wider">
                你征服了这条公路！
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
              {gameState.currentLevel === Level.LEVEL_1 && (
                <button
                  onClick={() => startGame(Level.LEVEL_2)}
                  className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black py-5 px-10 text-lg md:text-xl font-bold border-4 border-yellow-300 hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 hover:border-yellow-200 hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-400"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-2xl">🚀</span>
                    下一关：蜿蜒山道
                  </span>
                </button>
              )}

              <button
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-5 px-10 text-lg md:text-xl font-bold border-4 border-gray-700/60 hover:border-yellow-500/60 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🏠</span>
                  返回主菜单
                </span>
              </button>
            </div>

            {/* Celebration text */}
            <p className="mt-8 text-base text-yellow-200/80 font-mono">
              精彩的表现，继续你的旅程！⭐
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
