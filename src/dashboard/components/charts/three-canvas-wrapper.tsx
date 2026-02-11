"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false },
);

interface ThreeCanvasWrapperProps {
  children: ReactNode;
  height?: string;
  camera?: { position: [number, number, number]; fov?: number };
}

export function ThreeCanvasWrapper({
  children,
  height = "400px",
  camera = { position: [0, 3, 8], fov: 50 },
}: ThreeCanvasWrapperProps) {
  return (
    <div style={{ height, width: "100%" }} className="rounded-lg overflow-hidden bg-default-50">
      <Canvas camera={camera}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        {children}
      </Canvas>
    </div>
  );
}
