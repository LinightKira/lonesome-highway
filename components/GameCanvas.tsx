
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sky, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, Level, InputState } from '../types';
import { ROAD_WIDTH, MAX_SPEED, ACCELERATION, STEERING_SPEED, FRICTION, LEVEL_CONFIGS, COLORS } from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  level: Level;
  onWin: () => void;
  onFail: (reason: string) => void;
  updateStats: (distance: number, speed: number) => void;
  stagnationTime: number;
  setStagnationTime: (t: number) => void;
}

/** 
 * Smoothly calculates the road's X offset.
 * Designed for flow: no sharp or impossible zig-zags.
 */
const getRoadOffset = (z: number, level: Level) => {
  if (level === Level.LEVEL_1) return 0;
  if (z < 400) return 0; // Gentle warmup
  const nZ = z - 400;
  // Long-wave sine for flow + subtle secondary wave for variety
  return Math.sin(nZ * 0.003) * 55 + Math.sin(nZ * 0.001) * 35;
};

const Mountain: React.FC<{ position: [number, number, number], scale: number }> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <coneGeometry args={[25, 50, 4]} />
        <meshStandardMaterial color={COLORS.mountain} flatShading />
      </mesh>
      <mesh position={[0, 22, 0]}>
        <coneGeometry args={[10, 18, 4]} />
        <meshStandardMaterial color={COLORS.mountainPeak} flatShading />
      </mesh>
    </group>
  );
};

const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[1.5, 5, 1.5]} />
        <meshStandardMaterial color={COLORS.trunk} flatShading />
      </mesh>
      <mesh position={[0, 7.5, 0]} castShadow>
        <coneGeometry args={[5, 12, 5]} />
        <meshStandardMaterial color={COLORS.foliage} flatShading />
      </mesh>
    </group>
  );
};

const Road: React.FC<{ level: Level }> = ({ level }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 2000;
  
  const roadSegments = useMemo(() => {
    const segments = [];
    const step = 4.0; 
    for (let z = 0; z < roadLength; z += step) {
      const x1 = getRoadOffset(z, level);
      const x2 = getRoadOffset(z + step, level);
      const dx = x2 - x1;
      const angle = Math.atan2(dx, step);
      const length = Math.sqrt(dx * dx + step * step);
      
      segments.push({
        position: [x1 + dx / 2, 0, -z - step / 2],
        rotation: [0, angle, 0],
        length: length + 0.2
      });
    }
    return segments;
  }, [level, roadLength]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -roadLength/2]} receiveShadow>
        <planeGeometry args={[20000, roadLength]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {roadSegments.map((seg, i) => (
        <group key={i} position={seg.position as [number, number, number]} rotation={seg.rotation as [number, number, number]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_WIDTH, seg.length]} />
            <meshStandardMaterial color={COLORS.road} roughness={1} />
          </mesh>
          
          {i % 4 === 0 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <planeGeometry args={[0.8, seg.length * 0.7]} />
              <meshStandardMaterial color={COLORS.roadMarking} emissive={COLORS.roadMarking} emissiveIntensity={3} />
            </mesh>
          )}

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_WIDTH/2 - 0.5, 0.1, 0]}>
            <planeGeometry args={[1.2, seg.length]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-ROAD_WIDTH/2 + 0.5, 0.1, 0]}>
            <planeGeometry args={[1.2, seg.length]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Car: React.FC<{
  input: InputState;
  level: Level;
  onUpdate: (x: number, z: number, speed: number) => void;
  onFail: (reason: string) => void;
}> = ({ input, level, onUpdate, onFail }) => {
  const carRef = useRef<THREE.Group>(null);
  const speedRef = useRef(0);
  const xRef = useRef(0);
  const zRef = useRef(0);
  
  // Analog Steering Ref: Ramps up/down for smoothness
  const steerAmountRef = useRef(0); 

  useFrame((state, delta) => {
    if (!carRef.current) return;

    // 1. Throttle / Brake
    if (input.forward) {
      speedRef.current = Math.min(speedRef.current + ACCELERATION, MAX_SPEED);
    } else {
      speedRef.current = Math.max(speedRef.current - FRICTION, 0);
    }

    // 2. Analog Steering Simulation
    // Ramps up when keys are held, ramps down when released
    const steerTarget = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const steerSensitivity = 4.5; // How fast the car reacts
    
    if (steerTarget !== 0) {
      steerAmountRef.current = THREE.MathUtils.lerp(
        steerAmountRef.current, 
        steerTarget, 
        steerSensitivity * delta
      );
    } else {
      // Return to center
      steerAmountRef.current = THREE.MathUtils.lerp(
        steerAmountRef.current, 
        0, 
        6.0 * delta
      );
    }

    // Movement integration
    const forwardMovement = speedRef.current * 200 * delta;
    zRef.current += forwardMovement;

    // Lateral movement is tied to speed (you can't steer if you're not moving)
    // The multiplier is balanced to match the road's max derivative
    const lateralMovement = steerAmountRef.current * (speedRef.current * 110) * delta;
    xRef.current += lateralMovement;

    // 3. Visual Polish
    carRef.current.position.set(xRef.current, 0.6, -zRef.current);
    // Smooth visual rotation based on steer amount
    carRef.current.rotation.y = -steerAmountRef.current * 0.4;
    carRef.current.rotation.z = -steerAmountRef.current * 0.3; // Tilt

    // 4. Collision Detection & Camera
    const roadCenterX = getRoadOffset(zRef.current, level);

    // Chase Camera with smoothing
    const camTargetX = THREE.MathUtils.lerp(xRef.current, roadCenterX, 0.45);
    state.camera.position.lerp(new THREE.Vector3(camTargetX, 10, -zRef.current + 22.0), 0.1);
    state.camera.lookAt(xRef.current, 1.2, -zRef.current - 50);

    // Collision Check: Be generous to maintain the 'Lonely Highway' vibe
    const distFromCenter = Math.abs(xRef.current - roadCenterX);
    const failThreshold = (ROAD_WIDTH / 2) + 5.0; 

    if (distFromCenter > failThreshold) {
      onFail(level === Level.LEVEL_1 ? "偏离公路" : "失踪在荒野中");
    }

    onUpdate(xRef.current, zRef.current, speedRef.current);
  });

  return (
    <group ref={carRef}>
      {/* Sporty Chassis */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.2, 5.0]} />
        <meshStandardMaterial color={COLORS.car} metalness={1} roughness={0.1} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 1.1, -0.4]} castShadow>
        <boxGeometry args={[2.0, 0.9, 2.9]} />
        <meshStandardMaterial color="#000000" roughness={0} />
      </mesh>
      {/* Headlights */}
      <group position={[0, 0.4, -2.5]}>
        <mesh position={[1.1, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={60} />
        </mesh>
        <mesh position={[-1.1, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={60} />
        </mesh>
      </group>
      {/* Brake Bar */}
      <mesh position={[0, 0.6, 2.5]}>
        <boxGeometry args={[2.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={25} />
      </mesh>
    </group>
  );
};

const Scenery: React.FC<{ level: Level }> = ({ level }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 2000;
  
  const elements = useMemo(() => {
    const items = [];
    const density = level === Level.LEVEL_1 ? 500 : 1000; 
    
    for (let i = 0; i < density; i++) {
      const zPos = Math.random() * roadLength;
      const roadX = getRoadOffset(zPos, level);
      const side = Math.random() > 0.5 ? 1 : -1;
      
      const typeRand = Math.random();
      let type: 'tree' | 'mountain' = typeRand > 0.2 ? 'tree' : 'mountain';
      let scale = type === 'mountain' ? 15 + Math.random() * 35 : 3.5 + Math.random();
      
      const baseRadius = type === 'mountain' ? (35 * scale) : 20;
      const safeDistance = (ROAD_WIDTH / 2) + baseRadius + 100;
      
      const xPos = roadX + (side * (safeDistance + Math.random() * 800));

      items.push({ id: i, x: xPos, z: -zPos, type, scale });
    }
    return items;
  }, [level, roadLength]);

  return (
    <group>
      {elements.map((e) => (
        e.type === 'mountain' ? 
          <Mountain key={e.id} position={[e.x, -25, e.z]} scale={e.scale} /> :
          <Tree key={e.id} position={[e.x, 0, e.z]} />
      ))}
    </group>
  );
};

const Scene: React.FC<GameCanvasProps & { input: InputState }> = ({ level, onWin, onFail, updateStats, input, stagnationTime, setStagnationTime }) => {
  const lastUpdate = useRef(Date.now());
  const config = LEVEL_CONFIGS[level];

  const handleUpdate = useCallback((x: number, z: number, speed: number) => {
    updateStats(z, speed);
    const now = Date.now();
    if (speed < 0.02) {
      const dt = (now - lastUpdate.current) / 1000;
      setStagnationTime(stagnationTime + dt);
    } else {
      setStagnationTime(0);
    }
    lastUpdate.current = now;

    if (stagnationTime > 5) onFail("引擎熄火了...");
    if (z >= config.distanceGoal) onWin();
  }, [stagnationTime, level, onWin, onFail, updateStats, config.distanceGoal, setStagnationTime]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={45} />
      <Sky sunPosition={[100, 0.1, -100]} turbidity={30} rayleigh={40} />
      <fog attach="fog" args={['#000000', 100, 800]} />
      <ambientLight intensity={0.1} />
      <directionalLight 
        position={[500, 500, 500]} 
        intensity={6} 
        color="#ff7e5f" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <Road level={level} />
      <Scenery level={level} />
      <Car input={input} level={level} onUpdate={handleUpdate} onFail={onFail} />
      
      <Stars radius={500} depth={300} count={120000} factor={12} saturation={1} fade speed={1.2} />
    </>
  );
};

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const [input, setInput] = useState<InputState>({ forward: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setInput(p => ({ ...p, forward: true }));
      if (key === 'a' || key === 'arrowleft') setInput(p => ({ ...p, left: true }));
      if (key === 'd' || key === 'arrowright') setInput(p => ({ ...p, right: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setInput(p => ({ ...p, forward: false }));
      if (key === 'a' || key === 'arrowleft') setInput(p => ({ ...p, left: false }));
      if (key === 'd' || key === 'arrowright') setInput(p => ({ ...p, right: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: false,
        }}
        camera={{ position: [0, 15, 25], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene {...props} input={input} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
