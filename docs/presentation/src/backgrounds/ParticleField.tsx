import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Cognitum palette ────────────────────────── */
const PURPLE = '#8b5cf6';
const CYAN = '#22d3ee';
const PINK = '#f472b6';

/* ── Hyperbolic (Poincaré disk) distribution ─── */
function poincareDisk(count: number, spread: number): Float32Array {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform sampling inside unit disk, scaled
    const r = Math.sqrt(Math.random()) * spread;
    const theta = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(theta) * r;
    pos[i * 3 + 1] = Math.sin(theta) * r;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
  }
  return pos;
}

/* ── Ring positions ────────────────────────────── */
function ringPositions(count: number, radius: number): Float32Array {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    pos[i * 3] = Math.cos(theta) * radius;
    pos[i * 3 + 1] = Math.sin(theta) * radius;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  return pos;
}

/* ── Geodesic arc curve ────────────────────────── */
function GeodesicArc({ index }: { index: number }) {
  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    const startAngle = (index / 4) * Math.PI * 2;
    const arcLength = Math.PI * 0.6 + Math.random() * 0.4;
    const radius = 2.0 + index * 0.3;
    const tilt = (index * 0.3) - 0.45;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * arcLength;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * Math.cos(tilt);
      const z = Math.sin(angle) * radius * Math.sin(tilt) * 0.3;
      pts.push(new THREE.Vector3(x, y, z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [index]);

  useFrame((_, delta) => {
    lineObj.rotation.z += delta * 0.015;
  });

  return <primitive object={lineObj} />;
}

/* ── Main ParticleField component ──────────────── */
export function ParticleField({ color }: { color: string }) {
  const fieldRef = useRef<THREE.Points>(null!);
  const innerRef = useRef<THREE.Points>(null!);
  const middleRef = useRef<THREE.Points>(null!);
  const outerRef = useRef<THREE.Points>(null!);

  const fieldCount = 500;
  const ringCount = 60;

  const fieldPos = useMemo(() => poincareDisk(fieldCount, 5), []);
  const innerPos = useMemo(() => ringPositions(ringCount, 1.2), []);
  const middlePos = useMemo(() => ringPositions(ringCount, 1.8), []);
  const outerPos = useMemo(() => ringPositions(ringCount, 2.4), []);

  useFrame((_, delta) => {
    // Slow Z rotation for the entire field
    if (fieldRef.current) {
      fieldRef.current.rotation.z += delta * 0.02;
      // Gentle Y drift
      const pos = fieldRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < fieldCount; i++) {
        pos[i * 3 + 1] += delta * 0.08;
        if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5;
      }
      fieldRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Ring rotations at different speeds
    if (innerRef.current) innerRef.current.rotation.z += delta * 0.04;
    if (middleRef.current) middleRef.current.rotation.z -= delta * 0.025;
    if (outerRef.current) outerRef.current.rotation.z += delta * 0.015;
  });

  return (
    <group>
      {/* Hyperbolic particle field — 500 points */}
      <points ref={fieldRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={fieldCount}
            array={fieldPos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={PURPLE}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Inner ring — 60 points, r=1.2, purple */}
      <points ref={innerRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ringCount}
            array={innerPos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color={PURPLE}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Middle ring — 60 points, r=1.8, cyan */}
      <points ref={middleRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ringCount}
            array={middlePos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color={CYAN}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Outer ring — 60 points, r=2.4, pink */}
      <points ref={outerRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ringCount}
            array={outerPos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={PINK}
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 4 geodesic arcs — cyan, 12% opacity */}
      {[0, 1, 2, 3].map((i) => (
        <GeodesicArc key={i} index={i} />
      ))}
    </group>
  );
}
