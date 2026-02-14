import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, Level, InputState } from '../types';
import { ROAD_WIDTH, MAX_SPEED, ACCELERATION, STEERING_SPEED, FRICTION, LEVEL_CONFIGS } from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  level: Level;
  onWin: () => void;
  onFail: (reason: string) => void;
  updateStats: (distance: number, speed: number) => void;
  stagnationTime: number;
  setStagnationTime: (t: number) => void;
}

// 道路偏移计算 - 更平缓的弯道
const getRoadOffset = (z: number, level: Level) => {
  if (level === Level.LEVEL_1) return 0;
  if (z < 600) return 0; // 延长直道起始段
  const nZ = z - 600;
  // 更平缓的弯道：降低频率和幅度
  return Math.sin(nZ * 0.0015) * 25 + Math.sin(nZ * 0.0005) * 15;
};

// 天空背景组件 - 使用渐变着色器实现自然过渡
const SkyBackground: React.FC = () => {
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `;

  const uniforms = useMemo(() => ({
    topColor: { value: new THREE.Color(0x0077ff) },
    bottomColor: { value: new THREE.Color(0xE0F6FF) },
    offset: { value: 400 },
    exponent: { value: 0.6 }
  }), []);

  return (
    <>
      {/* 渐变天空球体 */}
      <mesh>
        <sphereGeometry args={[2000, 32, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* 太阳 */}
      <mesh position={[500, 300, -800]}>
        <sphereGeometry args={[60, 32, 32]} />
        <meshBasicMaterial color="#FFF8DC" />
      </mesh>
      
      {/* 太阳光晕 */}
      <mesh position={[500, 300, -799]}>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial 
          color="#FFF8DC" 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </>
  );
};

// 云朵组件 - 降低几何复杂度
const Cloud: React.FC<{ position: [number, number, number], scale: number }> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[15, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </mesh>
      <mesh position={[12, 2, 0]}>
        <sphereGeometry args={[12, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-12, 0, 2]}>
        <sphereGeometry args={[10, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// 绿色山丘组件 - 降低几何复杂度
const Hill: React.FC<{ position: [number, number, number], scale: number, color: string }> = ({ position, scale, color }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[40, 30, 6]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  );
};

// 树木组件 - 降低几何复杂度
const Tree: React.FC<{ position: [number, number, number], type: 'pine' | 'oak' }> = ({ position, type }) => {
  if (type === 'pine') {
    return (
      <group position={position}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 3, 6]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 5, 0]}>
          <coneGeometry args={[2.5, 6, 6]} />
          <meshStandardMaterial color="#228B22" flatShading />
        </mesh>
        <mesh position={[0, 8, 0]}>
          <coneGeometry args={[2, 5, 6]} />
          <meshStandardMaterial color="#228B22" flatShading />
        </mesh>
      </group>
    );
  }
  
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 4, 6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <sphereGeometry args={[4, 6, 6]} />
        <meshStandardMaterial color="#32CD32" flatShading />
      </mesh>
    </group>
  );
};

// 道路组件
const Road: React.FC<{ level: Level }> = ({ level }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 1000;
  
  const roadSegments = useMemo(() => {
    const segments = [];
    const step = 4.0;
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
        length: segLength * 1.05,
        hasMarking: index % 4 === 0
      });
      index++;
    }
    return segments;
  }, [level, roadLength]);

  return (
    <group>
      {/* 草地地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -roadLength/2]}>
        <planeGeometry args={[10000, roadLength]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* 道路段 */}
      {roadSegments.map((seg, i) => (
        <group key={i} position={seg.position as [number, number, number]} rotation={seg.rotation as [number, number, number]}>
          {/* 沥青路面 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[ROAD_WIDTH, seg.length]} />
            <meshStandardMaterial color="#333333" roughness={0.9} />
          </mesh>
          
          {/* 黄色中心线 */}
          {seg.hasMarking && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[0.4, seg.length * 0.6]} />
              <meshStandardMaterial color="#FFD700" />
            </mesh>
          )}

          {/* 白色路边线 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_WIDTH/2 - 0.3, 0.01, 0]}>
            <planeGeometry args={[0.4, seg.length]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-ROAD_WIDTH/2 + 0.3, 0.01, 0]}>
            <planeGeometry args={[0.4, seg.length]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 场景装饰组件 - 使用视距优化
const Scenery: React.FC<{ level: Level; carZ: number }> = ({ level, carZ }) => {
  const config = LEVEL_CONFIGS[level];
  const roadLength = config.distanceGoal + 1000;
  
  const elements = useMemo(() => {
    const items = [];
    
    // 远处的山丘 - 静态生成
    for (let i = 0; i < 8; i++) {
      const zPos = Math.random() * roadLength;
      const roadX = getRoadOffset(zPos, level);
      const side = Math.random() > 0.5 ? 1 : -1;
      const scale = 8 + Math.random() * 12;
      const minDistance = 1000 + Math.random() * 800;
      const xPos = roadX + (side * minDistance);
      const colors = ['#6B8E23', '#556B2F', '#8FBC8F'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      items.push({ 
        id: `hill-${i}`, 
        x: xPos, 
        z: -zPos, 
        type: 'hill' as const, 
        scale, 
        color,
        y: -20
      });
    }
    
    // 树木 - 只在道路附近生成
    for (let i = 0; i < 15; i++) {
      const zPos = Math.random() * roadLength;
      const roadX = getRoadOffset(zPos, level);
      const side = Math.random() > 0.5 ? 1 : -1;
      const safeDistance = (ROAD_WIDTH / 2) + 30;
      const xPos = roadX + (side * (safeDistance + Math.random() * 200));
      
      items.push({ 
        id: `tree-${i}`, 
        x: xPos, 
        z: -zPos, 
        type: 'tree' as const,
        treeType: Math.random() > 0.5 ? 'pine' : 'oak' as const,
        y: 0
      });
    }
    
    // 云朵
    for (let i = 0; i < 5; i++) {
      items.push({
        id: `cloud-${i}`,
        x: (Math.random() - 0.5) * 2000,
        y: 150 + Math.random() * 100,
        z: -Math.random() * 2000,
        type: 'cloud' as const,
        scale: 2 + Math.random() * 3
      });
    }
    
    return items;
  }, [level, roadLength]);

  // 只渲染视野范围内的物体
  const visibleElements = useMemo(() => {
    const viewDistance = 400; // 视野距离
    const viewBuffer = 100;   // 后方缓冲
    return elements.filter(e => {
      const dist = Math.abs(e.z - (-carZ));
      return dist < viewDistance + viewBuffer && e.z > -carZ - viewBuffer;
    });
  }, [elements, carZ]);

  return (
    <group>
      {visibleElements.map((e) => {
        if (e.type === 'hill') {
          return <Hill key={e.id} position={[e.x, e.y, e.z]} scale={e.scale} color={e.color} />;
        }
        if (e.type === 'tree') {
          return <Tree key={e.id} position={[e.x, e.y, e.z]} type={e.treeType} />;
        }
        if (e.type === 'cloud') {
          return <Cloud key={e.id} position={[e.x, e.y, e.z]} scale={e.scale} />;
        }
        return null;
      })}
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

    // 限制 delta 防止卡顿时的跳跃
    const dt = Math.min(delta, 0.05);

    if (input.forward) {
      speedRef.current = Math.min(speedRef.current + ACCELERATION, MAX_SPEED);
    } else {
      speedRef.current = Math.max(speedRef.current - FRICTION, 0);
    }

    // 转向输入
    const steerTarget = (input.left ? -1 : 0) + (input.right ? 1 : 0);

    // 基于速度的转向系数：速度越快，转向越慢（更真实）
    const speedFactor = 1 - (speedRef.current * 0.4);
    const steerSpeed = 2.5 * speedFactor;
    const returnSpeed = 3.5;

    // 平滑转向
    if (steerTarget !== 0) {
      steerAmountRef.current = THREE.MathUtils.lerp(steerAmountRef.current, steerTarget * speedFactor, steerSpeed * dt);
    } else {
      steerAmountRef.current = THREE.MathUtils.lerp(steerAmountRef.current, 0, returnSpeed * dt);
    }

    // 限制最大转向角度
    steerAmountRef.current = Math.max(-0.8, Math.min(0.8, steerAmountRef.current));

    const forwardMovement = speedRef.current * 200 * dt;
    zRef.current += forwardMovement;

    // 横向移动：速度越快，转向移动越明显，但有上限
    const lateralFactor = Math.min(speedRef.current * 60, 35);
    const lateralMovement = steerAmountRef.current * lateralFactor * dt;
    xRef.current += lateralMovement;

    carRef.current.position.set(xRef.current, 0.5, -zRef.current);
    carRef.current.rotation.y = -steerAmountRef.current * 0.35;
    carRef.current.rotation.z = -steerAmountRef.current * 0.15;

    const roadCenterX = getRoadOffset(zRef.current, level);
    // 相机跟随：根据车辆位置偏移，看到更多前方道路
    const lookAheadFactor = 0.1 + speedRef.current * 0.15;
    const camTargetX = xRef.current * 0.7 + roadCenterX * 0.3;
    state.camera.position.set(camTargetX, 8, -zRef.current + 12);
    state.camera.lookAt(xRef.current + (steerAmountRef.current * 20), 0, -zRef.current - 50);

    const distFromCenter = Math.abs(xRef.current - roadCenterX);
    if (distFromCenter > (ROAD_WIDTH / 2) + 8) {
      onFail(level === Level.LEVEL_1 ? "偏离公路" : "失踪在荒野中");
    }

    onUpdate(xRef.current, zRef.current, speedRef.current);
  });

  return (
    <group ref={carRef}>
      {/* 车身 - 红色跑车 */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 1, 4.5]} />
        <meshStandardMaterial color="#DC143C" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* 车顶 */}
      <mesh position={[0, 1.4, -0.3]}>
        <boxGeometry args={[1.6, 0.8, 2.5]} />
        <meshStandardMaterial color="#B22222" metalness={0.7} roughness={0.1} />
      </mesh>
      
      {/* 挡风玻璃 */}
      <mesh position={[0, 1.4, -1.6]}>
        <boxGeometry args={[1.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} />
      </mesh>
      
      {/* 车轮 - 简化几何体 */}
      {[[-1.1, -1.8], [1.1, -1.8], [-1.1, 1.8], [1.1, 1.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.4, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      
      {/* 前大灯 */}
      <mesh position={[-0.7, 0.6, -2.3]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.7, 0.6, -2.3]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

const Scene: React.FC<GameCanvasProps & { input: InputState }> = ({ level, onWin, onFail, updateStats, input, stagnationTime, setStagnationTime }) => {
  const lastUpdate = useRef(Date.now());
  const config = LEVEL_CONFIGS[level];
  const carZRef = useRef(0);

  const handleUpdate = useCallback((x: number, z: number, speed: number) => {
    carZRef.current = z;
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
      <PerspectiveCamera makeDefault fov={60} near={0.1} far={5000} />

      {/* 天空背景 */}
      <SkyBackground />

      {/* 环境光 - 明亮的白天 */}
      <ambientLight intensity={0.8} color="#FFFFFF" />

      {/* 半球光 - 天空和地面的自然光照 */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#4a7c59"
        intensity={0.6}
      />

      {/* 太阳光 - 主光源（关闭阴影提升性能） */}
      <directionalLight
        position={[500, 300, -500]}
        intensity={1.2}
        color="#FFF8DC"
      />

      {/* 补光 - 减少阴影死黑 */}
      <directionalLight
        position={[-200, 100, 200]}
        intensity={0.4}
        color="#E0F6FF"
      />

      {/* 远处的雾气 - 与天空地平线颜色匹配 */}
      <fog attach="fog" args={['#E0F6FF', 100, 1200]} />

      <Road level={level} />
      <Scenery level={level} carZ={carZRef.current} />
      <Car input={input} level={level} onUpdate={handleUpdate} onFail={onFail} />
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
    <div style={{ width: '100%', height: '100vh', background: '#87CEEB', overflow: 'hidden' }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 10, 20], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <Scene {...props} input={input} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
