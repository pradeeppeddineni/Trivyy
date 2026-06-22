/**
 * Scene — the R3F Canvas + lights + environment + Mascot.
 *
 * This file is the LAZY CHUNK. It is only ever imported via React.lazy()
 * inside HeroMascot.tsx. It must NEVER be imported at the top-level of
 * any page component or test file.
 *
 * Constraints:
 *  - Zero external network fetches (no remote HDR, no CDN assets).
 *  - Environment built from inline Lightformers only.
 *  - Optional bloom via postprocessing (cheap settings).
 *  - Rendering paused when canvas/tab is hidden (frameloop="demand" + visibilitychange).
 *  - DPR capped at 1.5 for battery.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Mascot } from './Mascot';

// ── Inline environment (no external HDR) ──────────────────────────────────────

function InlineEnvironment(): JSX.Element {
  return (
    <Environment resolution={64}>
      {/* Key: warm blue-white from top-front */}
      <Lightformer
        intensity={2}
        color="#a8c8ff"
        position={[0, 4, 2]}
        rotation={[Math.PI / -4, 0, 0]}
        scale={[4, 2, 1]}
        form="rect"
      />
      {/* Rim: cool purple from behind */}
      <Lightformer
        intensity={1.2}
        color="#9b7bff"
        position={[0, 1, -4]}
        rotation={[0, Math.PI, 0]}
        scale={[3, 2, 1]}
        form="rect"
      />
      {/* Fill: warm gold accent from lower-right */}
      <Lightformer
        intensity={0.8}
        color="#f5c842"
        position={[3, -1, 2]}
        scale={[2, 2, 1]}
        form="circle"
      />
      {/* Soft ambient dome (top) */}
      <Lightformer
        intensity={0.4}
        color="#e0ecff"
        position={[0, 6, 0]}
        scale={[6, 6, 1]}
        form="rect"
      />
    </Environment>
  );
}

// ── Lights ────────────────────────────────────────────────────────────────────

function Lights(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.5} color="#d0e8ff" />
      {/* Key: directional, from top-left-front */}
      <directionalLight
        castShadow
        position={[-3, 4, 4]}
        intensity={1.8}
        color="#ffffff"
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      {/* Rim: from behind-right */}
      <directionalLight position={[4, 2, -4]} intensity={0.6} color="#b0a0ff" />
    </>
  );
}

// ── Postprocessing ────────────────────────────────────────────────────────────

function Effects(): JSX.Element {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.35} luminanceThreshold={0.7} luminanceSmoothing={0.9} mipmapBlur />
    </EffectComposer>
  );
}

// ── Scene props ───────────────────────────────────────────────────────────────

export interface SceneProps {
  readonly variant?: 'hero' | 'compact';
  readonly size?: number;
}

// ── Main exported component ───────────────────────────────────────────────────

export default function Scene({ variant = 'hero', size }: SceneProps): JSX.Element {
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always');
  const containerRef = useRef<HTMLDivElement>(null);

  // Pause rendering when the tab is hidden (battery saving)
  useEffect(() => {
    const handleVisibility = (): void => {
      setFrameloop(document.hidden ? 'demand' : 'always');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const isCompact = variant === 'compact';
  const canvasSize = size ?? (isCompact ? 120 : 220);
  const cameraZ = isCompact ? 3.2 : 2.8;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        width: canvasSize,
        height: canvasSize,
        pointerEvents: 'none',
        display: 'block',
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, cameraZ], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        frameloop={frameloop}
        style={{ background: 'transparent' }}
      >
        <Lights />
        <InlineEnvironment />

        <Mascot />

        <ContactShadows
          position={[0, -0.78, 0]}
          opacity={isCompact ? 0.3 : 0.45}
          scale={2.5}
          blur={2.5}
          far={1.5}
          color="#1f6bff"
        />

        <Effects />
      </Canvas>
    </div>
  );
}
