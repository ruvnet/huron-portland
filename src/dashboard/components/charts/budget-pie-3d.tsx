"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";

interface SliceData {
  label: string;
  value: number;
  color: string;
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

function PieSlice({
  startAngle,
  endAngle,
  color,
  label,
  radius = 2,
}: {
  startAngle: number;
  endAngle: number;
  color: string;
  label: string;
  radius?: number;
}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const segments = 32;
  const angleStep = (endAngle - startAngle) / segments;
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  shape.lineTo(0, 0);

  const midAngle = (startAngle + endAngle) / 2;
  const labelX = Math.cos(midAngle) * (radius * 0.65);
  const labelY = Math.sin(midAngle) * (radius * 0.65);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry
          args={[
            shape,
            { depth: 0.4, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 },
          ]}
        />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
      </mesh>
      <Text
        position={[labelX, 0.5, -labelY]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

export function BudgetPie3D({
  data,
}: {
  data: { department: string; requested: number }[];
}) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const total = data.reduce((s, d) => s + d.requested, 0);
  let currentAngle = 0;

  const slices: SliceData[] = data.map((d, i) => {
    const angle = (d.requested / total) * Math.PI * 2;
    const slice = {
      label: d.department.split(" ")[0],
      value: angle,
      color: COLORS[i % COLORS.length],
    };
    return slice;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {slices.map((slice, i) => {
        const startAngle = currentAngle;
        currentAngle += slice.value;
        return (
          <PieSlice
            key={i}
            startAngle={startAngle}
            endAngle={currentAngle}
            color={slice.color}
            label={slice.label}
          />
        );
      })}
    </group>
  );
}
