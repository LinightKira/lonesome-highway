import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
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

// 道路偏移计算
const getRoadOffset = (z: number, level: Level) => {
  if (level === Level.LEVEL_1) return 0;
  if (z < 400) return 0;
  const nZ = z - 400;
  return Math.sin(nZ * 0.003) * 55 + Math.sin(nZ * 0.001) * 35;
};

// 简化的山脉组件 - 使用低多边形
const Mountain: React.FC<{ position: [number, number, number], scale: number }> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[20, 40, 5]} />
        <meshStandardMaterial color={COLORS.mountain} flatShading />
      </mesh>
    </group>
  );
};

// 简化的树木组件
const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 4, 6]} />
        <meshStandardMaterial color={COLORS.trunk} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <coneGeometry args={[3, 8, 6]} />
        <meshStandardMaterial color={COLORS.foliage} flatShading />
      </mesh>
    </group>
  );
};

// 性能优化的道路组件
const Road: React.FC<{ level: Level }> = ({ level }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 1000;
  
  const roadSegments = useMemo(() => {
    const segments = [];
    const step = 4.0; // 减小步长，让弯道更平滑
    let index = 0;
    for (let z = 0; z < roadLength; z += step) {
      const x1 = getRoadOffset(z, level);
      const x2 = getRoadOffset(z + step, level);
      const dx = x2 - x1;
      const angle = Math.atan2(dx, step);
      const segLength = Math.sqrt(dx * dx + step * step);
      
      segments.push({
        position: [x1 + dx / 2, 0, -z - step / 2],
        rotation: [0, angle, 0],
        length: segLength * 1.05, // 稍微重叠避免缝隙
        hasMarking: index % 4 === 0 // 每4段显示一个标记
      });
      index++;
    }
    return segments;
  }, [level, roadLength]);

  return (
    <group>
      {/* 地面 - 使用较亮的颜色让玩家能看到边界 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -roadLength/2]}>
        <planeGeometry args={[5000, roadLength]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>

      {/* 道路段 */}
      {roadSegments.map((seg, i) => (
        <group key={i} position={seg.position as [number, number, number]} rotation={seg.rotation as [number, number, number]}>
          {/* 路面 - 使用更亮的颜色 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[ROAD_WIDTH, seg.length]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
          </mesh>
          
          {/* 中心线 */}
          {seg.hasMarking && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[0.6, seg.length * 0.5]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
            </mesh>
          )}

          {/* 路边线 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_WIDTH/2 - 0.3, 0.02, 0]}>
            <planeGeometry args={[0.6, seg.length]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-ROAD_WIDTH/2 + 0.3, 0.02, 0]}>
            <planeGeometry args={[0.6, seg.length]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 车灯光照组件
const CarLights: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* 左车灯 - 增强亮度和范围 */}
      <spotLight
        position={[-0.8, 0.5, -1.5]}
        target-position={[-0.8, 0, -20]}
        angle={0.6}
        penumbra={0.4}
        intensity={100}
        distance={150}
        color="#ffffee"
        castShadow
      />
      {/* 右车灯 - 增强亮度和范围 */}
      <spotLight
        position={[0.8, 0.5, -1.5]}
        target-position={[0.8, 0, -20]}
        angle={0.6}
        penumbra={0.4}
        intensity={100}
        distance={150}
        color="#ffffee"
        castShadow
      />
      {/* 尾灯 */}
      <pointLight position={[0, 0.5, 2]} intensity={30} distance={40} color="#ff3333" />
    </group>
  );
};

// 车辆组件
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
  const steerAmountRef = useRef(0);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    // 加速/减速
    if (input.forward) {
      speedRef.current = Math.min(speedRef.current + ACCELERATION, MAX_SPEED);
    } else {
      speedRef.current = Math.max(speedRef.current - FRICTION, 0);
    }

    // 转向
    const steerTarget = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const steerSensitivity = 4.5;
    
    if (steerTarget !== 0) {
      steerAmountRef.current = THREE.MathUtils.lerp(steerAmountRef.current, steerTarget, steerSensitivity * delta);
    } else {
      steerAmountRef.current = THREE.MathUtils.lerp(steerAmountRef.current, 0, 6.0 * delta);
    }

    // 移动
    const forwardMovement = speedRef.current * 200 * delta;
    zRef.current += forwardMovement;
    const lateralMovement = steerAmountRef.current * (speedRef.current * 110) * delta;
    xRef.current += lateralMovement;

    // 更新车辆位置和旋转
    carRef.current.position.set(xRef.current, 0.5, -zRef.current);
    carRef.current.rotation.y = -steerAmountRef.current * 0.4;
    carRef.current.rotation.z = -steerAmountRef.current * 0.2;

    // 相机跟随和碰撞检测
    const roadCenterX = getRoadOffset(zRef.current, level);
    const camTargetX = THREE.MathUtils.lerp(xRef.current, roadCenterX, 0.45);
    state.camera.position.lerp(new THREE.Vector3(camTargetX, 8, -zRef.current + 18), 0.1);
    state.camera.lookAt(xRef.current, 0.5, -zRef.current - 30);

    // 碰撞检测 - 放宽阈值，让玩家有更多容错空间
    // ROAD_WIDTH 是 32，一半是 16，给 8 的容错空间，总共 24
    const distFromCenter = Math.abs(xRef.current - roadCenterX);
    if (distFromCenter > (ROAD_WIDTH / 2) + 8) {
      onFail(level === Level.LEVEL_1 ? "偏离公路" : "失踪在荒野中");
    }

    onUpdate(xRef.current, zRef.current, speedRef.current);
  });

  return (
    <group ref={carRef}>
      <CarLights position={[0, 0, 0]} />
      
      {/* 车身 */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2, 1.2, 4.5]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 车顶 */}
      <mesh position={[0, 1.4, -0.3]} castShadow>
        <boxGeometry args={[1.6, 0.8, 2.5]} />
        <meshStandardMaterial color="#0f0f1a" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* 前车灯 */}
      <mesh position={[-0.7, 0.6, -2.3]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff5e0" emissive="#fff5e0" emissiveIntensity={10} />
      </mesh>
      <mesh position={[0.7, 0.6, -2.3]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff5e0" emissive="#fff5e0" emissiveIntensity={10} />
      </mesh>
      
      {/* 尾灯 */}
      <mesh position={[-0.7, 0.8, 2.3]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0.7, 0.8, 2.3]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} />
      </mesh>

      {/* 车轮 */}
      {[[-1, -1.8], [1, -1.8], [-1, 1.8], [1, 1.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.4, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
};

// 场景组件 - 优化性能
const Scenery: React.FC<{ level: Level }> = ({ level }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 1000;
  
  const elements = useMemo(() => {
    const items = [];
    // 大幅减少密度以优化性能
    const density = level === Level.LEVEL_1 ? 80 : 120;
    
    for (let i = 0; i < density; i++) {
      const zPos = Math.random() * roadLength;
      const roadX = getRoadOffset(zPos, level);
      const side = Math.random() > 0.5 ? 1 : -1;
      
      const typeRand = Math.random();
      const type: 'tree' | 'mountain' = typeRand > 0.3 ? 'tree' : 'mountain';
      const scale = type === 'mountain' ? 10 + Math.random() * 20 : 2 + Math.random() * 2;
      
      // 山体和树木放在更远的地方，避免挡住公路
      const baseRadius = type === 'mountain' ? 25 : 15;
      const safeDistance = (ROAD_WIDTH / 2) + baseRadius + 150; // 增加到150
      
      const xPos = roadX + (side * (safeDistance + Math.random() * 400));

      items.push({ id: i, x: xPos, z: -zPos, type, scale });
    }
    return items;
  }, [level, roadLength]);

  return (
    <group>
      {elements.map((e) => (
        e.type === 'mountain' ? 
          <Mountain key={e.id} position={[e.x, -30, e.z]} scale={e.scale} /> :
          <Tree key={e.id} position={[e.x, 0, e.z]} />
      ))}
    </group>
  );
};

// 天空背景组件 - 替代 Sky 组件
const CustomSky: React.FC = () => {
  return (
    <>
      {/* 远处渐变背景 */}
      <mesh position={[0, 100, -1000]} rotation={[0, 0, 0]}>
        <planeGeometry args={[5000, 500]} />
        <meshBasicMaterial 
          color="#1a0b2e"
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 地平线光晕 */}
      <mesh position={[0, 50, -800]} rotation={[0, 0, 0]}>
        <planeGeometry args={[3000, 200]} />
        <meshBasicMaterial 
          color="#ff6b35"
          transparent
          opacity={0.3}
        />
      </mesh>
    </>
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
      <PerspectiveCamera makeDefault fov={60} near={0.1} far={2000} />
      
      {/* 环境光 - 增加亮度 */}
      <ambientLight intensity={0.6} color="#6a5d7c" />
      
      {/* 半球光 - 模拟天空和地面的反射 */}
      <hemisphereLight 
        skyColor="#ff7e5f" 
        groundColor="#1a0f0a" 
        intensity={0.8}
      />
      
      {/* 主光源（夕阳效果）- 增强亮度 */}
      <directionalLight 
        position={[100, 80, -200]} 
        intensity={5}
        color="#ffaa77"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={1000}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* 补光 - 增强 */}
      <directionalLight 
        position={[-100, 50, -100]} 
        intensity={2}
        color="#7f9eff"
      />
      
      {/* 填充光 - 从下方补光，减少死黑 */}
      <directionalLight 
        position={[0, -50, 100]} 
        intensity={0.5}
        color="#ff9966"
      />
      
      {/* 雾气效果 - 调整为可见度更好 */}
      <fog attach="fog" args={['#1a0a0a', 80, 600]} />
      
      <CustomSky />
      <Road level={level} />
      <Scenery level={level} />
      <Car input={input} level={level} onUpdate={handleUpdate} onFail={onFail} />
      
      {/* 优化星星数量 - 从12万减少到5000 */}
      <Stars 
        radius={400} 
        depth={200} 
        count={5000} 
        factor={8} 
        saturation={0.8} 
        fade 
        speed={0.5}
      />
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
    <div style={{ width: '100%', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={1} // 限制 DPR 以提高性能
        gl={{
          antialias: false, // 关闭抗锯齿以提高性能
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 10, 20], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        frameloop="always"
      >
        <Scene {...props} input={input} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
