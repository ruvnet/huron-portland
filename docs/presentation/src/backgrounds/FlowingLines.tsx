import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function FlowingLine({
  offset,
  color,
  yBase,
}: {
  offset: number;
  color: string;
  yBase: number;
}) {
  const ref = useRef<THREE.Line>(null!);
  const tubePoints = 80;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.3 + offset;
    const positions = ref.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < tubePoints; i++) {
      const f = i / tubePoints;
      positions[i * 3] = (f - 0.5) * 16;
      positions[i * 3 + 1] =
        yBase +
        Math.sin(f * Math.PI * 2 + t) * 1.2 +
        Math.sin(f * Math.PI * 3 + t * 0.7) * 0.5;
      positions[i * 3 + 2] = -2 + Math.cos(f * Math.PI + t * 0.5) * 1.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(tubePoints * 3);
    for (let i = 0; i < tubePoints; i++) {
      const f = i / tubePoints;
      pos[i * 3] = (f - 0.5) * 16;
      pos[i * 3 + 1] = yBase;
      pos[i * 3 + 2] = -2;
    }
    return pos;
  }, [yBase]);

  return (
    <line ref={ref as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={tubePoints}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.25} />
    </line>
  );
}

export function FlowingLines({ color }: { color: string }) {
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <FlowingLine
          key={i}
          offset={i * 0.8}
          color={color}
          yBase={(i - 3.5) * 1.2}
        />
      ))}
    </group>
  );
}
