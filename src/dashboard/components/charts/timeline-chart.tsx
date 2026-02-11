"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import type { Group } from "three";
import type { Proposal } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";

export function TimelineChart({ proposals }: { proposals: Proposal[] }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.15;
    }
  });

  const withDates = proposals.filter((p) => p.submittedDate);
  const sorted = withDates.sort(
    (a, b) =>
      new Date(a.submittedDate!).getTime() -
      new Date(b.submittedDate!).getTime(),
  );

  const xSpan = 10;
  const yScale = 3;

  return (
    <group ref={groupRef} position={[-xSpan / 2, -1, 0]}>
      {/* Axis line */}
      <Line
        points={[
          [0, 0, 0],
          [xSpan, 0, 0],
        ]}
        color="#444444"
        lineWidth={2}
      />

      {sorted.map((p, i) => {
        const x = (i / Math.max(sorted.length - 1, 1)) * xSpan;
        const y = (p.requestedAmount / 5_500_000) * yScale;
        const color = STATUS_COLORS[p.status] || "#6B7280";

        return (
          <group key={p.id} position={[x, 0, 0]}>
            {/* Vertical line */}
            <Line
              points={[
                [0, 0, 0],
                [0, y, 0],
              ]}
              color={color}
              lineWidth={1.5}
            />
            {/* Sphere at top */}
            <mesh position={[0, y, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Label */}
            <Text
              position={[0, -0.3, 0]}
              fontSize={0.15}
              color="#888888"
              rotation={[-Math.PI / 4, 0, Math.PI / 4]}
              anchorY="top"
            >
              {p.title.slice(0, 15)}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
