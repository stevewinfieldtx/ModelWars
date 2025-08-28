export type GameState = 'start' | 'playing' | 'end' | 'winners' | 'stats' | 'admin' | 'modelProfile';

export type SwipeDirection = 'left' | 'right';

export interface BattleImage {
  url: string;
  name: string;
}