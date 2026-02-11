import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NeuralNetwork({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null!);

  const { nodes, connections } = useMemo(() => {
    const n: THREE.Vector3[] = [];
    const layers = [10, 10, 10];
    const layerX = [-4, 0, 4];

    layers.forEach((count, li) => {
      for (let i = 0; i < count; i++) {
        const y = (i - (count - 1) / 2) * 0.8;
        const z = (Math.random() - 0.5) * 2;
        n.push(new THREE.Vector3(layerX[li], y, z));
      }
    });

    const c: [number, number][] = [];
    let offset = 0;
    for (let li = 0; li < layers.length - 1; li++) {
      const nextOffset = offset + layers[li];
      for (let i = 0; i < layers[li]; i++) {
        for (let j = 0; j < layers[li + 1]; j++) {
          if (Math.random() < 0.3) {
            c.push([offset + i, nextOffset + j]);
          }
        }
      }
      offset = nextOffset;
    }

    return { nodes: n, connections: c };
  }, []);

  const linePositions = useMemo(() => {
    const pos = new Float32Array(connections.length * 6);
    connections.forEach(([a, b], i) => {
      pos[i * 6] = nodes[a].x;
      pos[i * 6 + 1] = nodes[a].y;
      pos[i * 6 + 2] = nodes[a].z;
      pos[i * 6 + 3] = nodes[b].x;
      pos[i * 6 + 4] = nodes[b].y;
      pos[i * 6 + 5] = nodes[b].z;
    });
    return pos;
  }, [nodes, connections]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.1) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      ))}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={connections.length * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}
