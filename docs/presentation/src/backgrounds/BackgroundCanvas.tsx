import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ParticleField } from './ParticleField';
import { GeometricShapes } from './GeometricShapes';
import { FlowingLines } from './FlowingLines';
import { NeuralNetwork } from './NeuralNetwork';
import { CircuitBoard } from './CircuitBoard';

type SceneType = 'particles' | 'geometric' | 'flowingLines' | 'neuralNetwork' | 'circuitBoard';

interface BackgroundCanvasProps {
  scene: SceneType;
  accentColor: string;
}

const scenes: Record<SceneType, React.FC<{ color: string }>> = {
  particles: ParticleField,
  geometric: GeometricShapes,
  flowingLines: FlowingLines,
  neuralNetwork: NeuralNetwork,
  circuitBoard: CircuitBoard,
};

export function BackgroundCanvas({ scene, accentColor }: BackgroundCanvasProps) {
  const SceneComponent = scenes[scene] || ParticleField;

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <Suspense fallback={null}>
          <SceneComponent color={accentColor} />
        </Suspense>
      </Canvas>
      {/* Overlay gradient for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, hsl(220 25% 6% / 0.92) 0%, hsl(220 25% 4% / 0.88) 100%)',
        }}
      />
    </div>
  );
}
