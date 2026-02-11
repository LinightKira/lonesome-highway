
export enum GameStatus {
  START_SCREEN = 'START_SCREEN',
  PLAYING = 'PLAYING',
  LEVEL_WON = 'LEVEL_WON',
  GAME_OVER = 'GAME_OVER'
}

export enum Level {
  LEVEL_1 = 1,
  LEVEL_2 = 2
}

export interface GameState {
  status: GameStatus;
  currentLevel: Level;
  distanceTraveled: number;
  speed: number;
  failReason: string;
}

export interface InputState {
  forward: boolean;
  left: boolean;
  right: boolean;
}
