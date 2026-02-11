
export const ROAD_WIDTH = 32; // Significantly wider for better maneuverability
export const MAX_SPEED = 1.0;
export const ACCELERATION = 0.015;
export const STEERING_SPEED = 0.8; 
export const FRICTION = 0.005;

export const LEVEL_CONFIGS = {
  1: {
    distanceGoal: 5000,
    curvy: false,
    label: "第一关：笔直之路 (5km)"
  },
  2: {
    distanceGoal: 15000,
    curvy: true,
    label: "第二关：蜿蜒山脊 (15km)"
  }
};

export const COLORS = {
  sky: '#1a0b2e',
  horizon: '#ff7e5f',
  ground: '#05050a',
  road: '#111111',
  roadMarking: '#ffcc00',
  car: '#cc0000',
  mountain: '#0f0f1a',
  mountainPeak: '#ffffff',
  cliff: '#1a1a1a',
  foliage: '#0a2e1a',
  trunk: '#2e1a0a'
};
