import React, { useState, useCallback, useEffect } from 'react';
import { GameStatus, Level, GameState } from './types';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import BGMPlayer from './components/BGMPlayer';

// 内联样式定义，确保样式一定生效
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  },
  // 开始页面背景
  startBackground: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #1a0a2e 0%, #4a1c6b 50%, #2d1b4e 100%)',
  },
  startOverlay1: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(255,126,95,0.15), transparent 50%)',
  },
  startOverlay2: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 70% 70%, rgba(255,165,0,0.1), transparent 50%)',
  },
  // 游戏结束背景
  gameOverBackground: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #2a0a0a 0%, #4a1a1a 50%, #1a0505 100%)',
  },
  gameOverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255,50,50,0.2), transparent 70%)',
  },
  // 胜利背景
  winBackground: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #1a2a1a 0%, #3d5a2d 50%, #4a3d1a 100%)',
  },
  winOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.2), transparent 60%)',
  },
  // 通用内容容器
  contentWrapper: {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
  },
  // 主卡片
  mainCard: {
    position: 'relative',
    padding: '48px 64px',
    maxWidth: '800px',
    width: '100%',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '4px solid rgba(255,126,95,0.5)',
    borderRadius: '16px',
    boxShadow: '0 0 80px rgba(255,126,95,0.4)',
  },
  // 游戏结束卡片
  gameOverCard: {
    position: 'relative',
    padding: '48px 64px',
    maxWidth: '700px',
    width: '100%',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '4px solid rgba(255,50,50,0.6)',
    borderRadius: '16px',
    boxShadow: '0 0 100px rgba(255,50,50,0.5)',
  },
  // 胜利卡片
  winCard: {
    position: 'relative',
    padding: '48px 64px',
    maxWidth: '700px',
    width: '100%',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '4px solid rgba(255,215,0,0.6)',
    borderRadius: '16px',
    boxShadow: '0 0 100px rgba(255,215,0,0.4)',
  },
  // 标题
  title: {
    fontSize: 'clamp(40px, 8vw, 80px)',
    fontWeight: 'bold',
    marginBottom: '8px',
    background: 'linear-gradient(90deg, #ff7e5f, #feb47b, #ff7e5f)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 40px rgba(255,126,95,0.5)',
    letterSpacing: '-2px',
  },
  subtitle: {
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: 'rgba(255,200,150,0.9)',
    letterSpacing: '8px',
    marginBottom: '32px',
    fontFamily: 'monospace',
  },
  // 引言框
  quoteBox: {
    maxWidth: '600px',
    margin: '0 auto 40px',
    padding: '24px 32px',
    background: 'linear-gradient(90deg, rgba(255,126,95,0.05), transparent, rgba(255,100,80,0.05))',
    borderTop: '2px solid rgba(255,126,95,0.4)',
    borderBottom: '2px solid rgba(255,126,95,0.4)',
    borderRadius: '8px',
  },
  quoteText: {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    color: 'rgba(255,220,200,0.95)',
    fontStyle: 'italic',
    lineHeight: 1.6,
  },
  // 按钮容器
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  // 主按钮
  primaryButton: {
    padding: '20px 32px',
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #ff7e5f, #ff6b4a)',
    border: '3px solid rgba(255,200,150,0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 4px 20px rgba(255,126,95,0.4)',
  },
  // 次按钮
  secondaryButton: {
    padding: '20px 32px',
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #2d2d3d, #1a1a2e)',
    border: '3px solid rgba(255,126,95,0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  // 操作说明网格
  controlsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '32px',
    maxWidth: '500px',
    margin: '32px auto 0',
  },
  controlItem: {
    padding: '16px',
    background: 'rgba(0,0,0,0.4)',
    border: '2px solid rgba(255,126,95,0.3)',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  controlLabel: {
    fontSize: '12px',
    color: 'rgba(255,200,150,0.9)',
    fontWeight: 'bold',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  },
  controlKey: {
    fontSize: '24px',
    color: '#fff',
    fontFamily: 'monospace',
  },
  // 游戏结束样式
  gameOverTitle: {
    fontSize: 'clamp(36px, 6vw, 64px)',
    fontWeight: 'bold',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #ff6b6b, #ff5252)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  gameOverReason: {
    fontSize: 'clamp(18px, 3vw, 24px)',
    color: 'rgba(255,200,200,0.95)',
    padding: '20px',
    background: 'rgba(255,50,50,0.2)',
    border: '2px solid rgba(255,100,100,0.5)',
    borderRadius: '8px',
    marginBottom: '32px',
  },
  retryButton: {
    padding: '18px 36px',
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #ff5252, #d32f2f)',
    border: '3px solid rgba(255,150,150,0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '12px',
    boxShadow: '0 4px 20px rgba(255,50,50,0.4)',
  },
  menuButton: {
    padding: '16px 32px',
    fontSize: 'clamp(14px, 2vw, 18px)',
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  // 胜利样式
  winTitle: {
    fontSize: 'clamp(36px, 6vw, 64px)',
    fontWeight: 'bold',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #ffd700, #ffb700)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  winMessage: {
    fontSize: 'clamp(18px, 3vw, 24px)',
    color: 'rgba(255,235,150,0.95)',
    padding: '20px',
    background: 'rgba(255,215,0,0.15)',
    border: '2px solid rgba(255,200,100,0.5)',
    borderRadius: '8px',
    marginBottom: '32px',
  },
  nextLevelButton: {
    padding: '18px 36px',
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    fontWeight: 'bold',
    color: '#000',
    background: 'linear-gradient(135deg, #ffd700, #ffb700)',
    border: '3px solid rgba(255,255,200,0.8)',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '12px',
    boxShadow: '0 4px 20px rgba(255,215,0,0.5)',
  },
  // 图标
  icon: {
    fontSize: '24px',
  },
  largeIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    animation: 'bounce 1s infinite',
  },
};

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

  // 按钮悬停效果
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const getButtonStyle = (baseStyle: React.CSSProperties, isHovered: boolean) => ({
    ...baseStyle,
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isHovered 
      ? baseStyle.boxShadow?.toString().replace('0.4', '0.6').replace('0.5', '0.7')
      : baseStyle.boxShadow,
  });

  return (
    <div style={styles.container}>
      <BGMPlayer isMuted={isMuted} isPlaying={gameState.status === GameStatus.PLAYING} />

      {gameState.status === GameStatus.START_SCREEN && (
        <>
          <div style={styles.startBackground} />
          <div style={styles.startOverlay1} />
          <div style={styles.startOverlay2} />
          <div style={styles.contentWrapper}>
            <div style={styles.mainCard}>
              <h1 style={styles.title}>孤独的公路</h1>
              <p style={styles.subtitle}>LONELY HIGHWAY</p>
              
              <div style={styles.quoteBox}>
                <p style={styles.quoteText}>"{quote}"</p>
              </div>

              <div style={styles.buttonContainer}>
                <button
                  onClick={() => startGame(Level.LEVEL_1)}
                  onMouseEnter={() => setHoveredButton('level1')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={getButtonStyle(styles.primaryButton, hoveredButton === 'level1')}
                >
                  <span style={styles.icon}>🏎️</span>
                  第一关：笔直冲刺
                </button>

                <button
                  onClick={() => startGame(Level.LEVEL_2)}
                  onMouseEnter={() => setHoveredButton('level2')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={getButtonStyle(styles.secondaryButton, hoveredButton === 'level2')}
                >
                  <span style={styles.icon}>🏔️</span>
                  第二关：蜿蜒山道
                </button>
              </div>

              <div style={styles.controlsGrid}>
                <div style={styles.controlItem}>
                  <div style={styles.controlLabel}>加速</div>
                  <div style={styles.controlKey}>W / ↑</div>
                </div>
                <div style={styles.controlItem}>
                  <div style={styles.controlLabel}>转向</div>
                  <div style={styles.controlKey}>A / D</div>
                </div>
                <div style={styles.controlItem}>
                  <div style={styles.controlLabel}>减速</div>
                  <div style={styles.controlKey}>S / ↓</div>
                </div>
              </div>
            </div>
          </div>
        </>
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
        <>
          <div style={styles.gameOverBackground} />
          <div style={styles.gameOverOverlay} />
          <div style={styles.contentWrapper}>
            <div style={styles.gameOverCard}>
              <div style={styles.largeIcon}>💥</div>
              <h2 style={styles.gameOverTitle}>游戏结束</h2>
              <div style={styles.gameOverReason}>{gameState.failReason}</div>
              
              <button
                onClick={() => startGame(gameState.currentLevel)}
                onMouseEnter={() => setHoveredButton('retry')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle(styles.retryButton, hoveredButton === 'retry')}
              >
                🔄 再次尝试
              </button>
              
              <button
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                onMouseEnter={() => setHoveredButton('menu')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle(styles.menuButton, hoveredButton === 'menu')}
              >
                🏠 返回主菜单
              </button>
            </div>
          </div>
        </>
      )}

      {gameState.status === GameStatus.LEVEL_WON && (
        <>
          <div style={styles.winBackground} />
          <div style={styles.winOverlay} />
          <div style={styles.contentWrapper}>
            <div style={styles.winCard}>
              <div style={styles.largeIcon}>🏆</div>
              <h2 style={styles.winTitle}>胜利</h2>
              <div style={styles.winMessage}>你征服了这条公路！</div>
              
              {gameState.currentLevel === Level.LEVEL_1 && (
                <button
                  onClick={() => startGame(Level.LEVEL_2)}
                  onMouseEnter={() => setHoveredButton('next')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={getButtonStyle(styles.nextLevelButton, hoveredButton === 'next')}
                >
                  🚀 下一关：蜿蜒山道
                </button>
              )}
              
              <button
                onClick={() => setGameState(prev => ({ ...prev, status: GameStatus.START_SCREEN }))}
                onMouseEnter={() => setHoveredButton('menu')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle(styles.menuButton, hoveredButton === 'menu')}
              >
                🏠 返回主菜单
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
