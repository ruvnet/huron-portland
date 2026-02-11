"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { STATUS_COLORS } from "@/lib/constants";
import type { ProposalStatus } from "@/lib/types";

interface BarData {
  status: string;
  count: number;
}

function Bar({
  position,
  height,
  color,
  label,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
}) {
  const meshRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group position={position} ref={meshRef}>
      <RoundedBox
        args={[0.6, height, 0.6]}
        position={[0, height / 2, 0]}
        radius={0.05}
        smoothness={4}
      >
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.18}
        color="#888888"
        anchorY="top"
        rotation={[-Math.PI / 4, 0, 0]}
      >
        {label}
      </Text>
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorY="bottom"
      >
        {String(Math.round(height * 2))}
      </Text>
    </group>
  );
}

export function StatusBarChart3D({ data }: { data: BarData[] }) {
  const offset = -(data.length * 1.2) / 2;

  return (
    <group position={[0, -1.5, 0]}>
      {data.map((d, i) => (
        <Bar
          key={d.status}
          position={[offset + i * 1.2, 0, 0]}
          height={d.count / 2}
          color={STATUS_COLORS[d.status as ProposalStatus] || "#6B7280"}
          label={d.status.replace(/_/g, " ").slice(0, 10)}
        />
      ))}
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[data.length * 1.5, 4]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
