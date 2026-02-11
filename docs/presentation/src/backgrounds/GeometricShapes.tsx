import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

function WireframeShape({
  geometry,
  position,
  speed,
  color,
}: {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  speed: number;
  color: string;
}) {
  const ref = useRef<THREE.LineSegments>(null!);
  const edges = new THREE.EdgesGeometry(geometry);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed * 0.5;
    ref.current.rotation.y += delta * speed;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <lineSegments ref={ref} position={position} geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </lineSegments>
    </Float>
  );
}

export function GeometricShapes({ color }: { color: string }) {
  return (
    <group>
      <WireframeShape
        geometry={new THREE.IcosahedronGeometry(1.8)}
        position={[-3.5, 0.5, -2]}
        speed={0.12}
        color={color}
      />
      <WireframeShape
        geometry={new THREE.OctahedronGeometry(1.5)}
        position={[0, -0.5, -1]}
        speed={0.18}
        color={color}
      />
      <WireframeShape
        geometry={new THREE.DodecahedronGeometry(1.4)}
        position={[3.5, 0.3, -3]}
        speed={0.09}
        color={color}
      />
    </group>
  );
}
