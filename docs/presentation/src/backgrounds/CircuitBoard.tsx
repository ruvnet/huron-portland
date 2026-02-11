import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CircuitBoard({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const signalRef = useRef<THREE.Points>(null!);

  const { tracePositions, padPositions, signalPositions } = useMemo(() => {
    const traces: number[] = [];
    const pads: number[] = [];
    const signals: number[] = [];
    const gridSize = 10;
    const spacing = 1.2;

    // Horizontal traces
    for (let y = -gridSize / 2; y <= gridSize / 2; y += 2) {
      traces.push(-gridSize * spacing / 2, y * spacing * 0.6, 0);
      traces.push(gridSize * spacing / 2, y * spacing * 0.6, 0);
    }
    // Vertical traces
    for (let x = -gridSize / 2; x <= gridSize / 2; x += 2) {
      traces.push(x * spacing, -gridSize * spacing * 0.3, 0);
      traces.push(x * spacing, gridSize * spacing * 0.3, 0);
    }
    // Pads at intersections
    for (let x = -gridSize / 2; x <= gridSize / 2; x += 2) {
      for (let y = -gridSize / 2; y <= gridSize / 2; y += 2) {
        pads.push(x * spacing, y * spacing * 0.6, 0);
      }
    }
    // Signal positions (animated later)
    for (let i = 0; i < 12; i++) {
      signals.push(
        (Math.random() - 0.5) * gridSize * spacing,
        (Math.random() - 0.5) * gridSize * spacing * 0.6,
        0.01,
      );
    }

    return {
      tracePositions: new Float32Array(traces),
      padPositions: new Float32Array(pads),
      signalPositions: new Float32Array(signals),
    };
  }, []);

  useFrame(({ clock }) => {
    if (!signalRef.current) return;
    const pos = signalRef.current.geometry.attributes.position
      .array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < 12; i++) {
      pos[i * 3] += Math.sin(t + i) * 0.02;
      pos[i * 3 + 1] += Math.cos(t * 0.7 + i) * 0.01;
      // Wrap around
      if (pos[i * 3] > 7) pos[i * 3] = -7;
      if (pos[i * 3] < -7) pos[i * 3] = 7;
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4;
      if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4;
    }
    signalRef.current.geometry.attributes.position.needsUpdate = true;
    if (groupRef.current)
      groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.02;
  });

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={tracePositions.length / 3}
            array={tracePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={padPositions.length / 3}
            array={padPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={color}
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>
      <points ref={signalRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={12}
            array={signalPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color={color}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
