/**
 * Mascot — procedural 3-D character built from R3F primitives.
 *
 * No external assets. Everything is inline geometry + materials.
 * Idle animation: gentle bob, auto-sway, eye blink, antenna glow pulse.
 *
 * Runs only inside Scene.tsx (lazy chunk); never imported directly by
 * the wrapper or jsdom tests.
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Group } from 'three';

// ── Constants ────────────────────────────────────────────────────────────────

const BODY_BLUE = '#1f6bff';
const SPARK_GOLD = '#f5a623';
const EYE_WHITE = '#ffffff';
const PUPIL_DARK = '#2b264a';

// Star / question-mark geometry helpers -----------------------------------

/** Build a flat 6-point star as an ExtrudeGeometry-ready shape array.
 *  We'll render it as a very thin cylinder stand-in using a different approach:
 *  just use a dodecahedron at low opacity for the embossed detail. */

// ── Sub-components ───────────────────────────────────────────────────────────

/** One eye with white sclera, dark pupil, and a tiny specular glint. */
function Eye({
  x,
  y,
  z,
}: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}): JSX.Element {
  const blinkRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!blinkRef.current) return;
    const t = clock.getElapsedTime();
    // Blink: squish scaleY to ~0.05 for 0.08 s every 3.5 s
    const cycle = t % 3.5;
    const blink = cycle > 3.4 ? Math.max(0.05, 1 - (cycle - 3.4) / 0.05) : 1;
    blinkRef.current.scale.y = blink;
  });

  return (
    <group position={[x, y, z]}>
      <group ref={blinkRef}>
        {/* Sclera */}
        <mesh>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshPhysicalMaterial color={EYE_WHITE} roughness={0.1} clearcoat={1} />
        </mesh>
        {/* Pupil — slightly raised */}
        <mesh position={[0, 0, 0.15]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial color={PUPIL_DARK} roughness={0.2} />
        </mesh>
        {/* Specular glint */}
        <mesh position={[0.04, 0.06, 0.22]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

/** Emissive antenna spark sphere — pulses glow intensity. */
function AntennaSpark(): JSX.Element {
  const sparkRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!sparkRef.current) return;
    // Pulse emissive intensity between 0.8 and 2.5
    const t = clock.getElapsedTime();
    const pulse = 0.8 + 1.7 * (0.5 + 0.5 * Math.sin(t * 3.2));
    (sparkRef.current.material as unknown as { emissiveIntensity: number }).emissiveIntensity =
      pulse;
  });

  return (
    <mesh ref={sparkRef} position={[0, 1.52, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshPhysicalMaterial
        color={SPARK_GOLD}
        emissive={SPARK_GOLD}
        emissiveIntensity={1.5}
        roughness={0.1}
        metalness={0.3}
        clearcoat={1}
      />
    </mesh>
  );
}

/** The full mascot group — body, eyes, antenna, embossed detail. */
export function Mascot(): JSX.Element {
  const groupRef = useRef<Group>(null);
  const [pointerX] = useState(0);

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();

    // Vertical bob: ±0.06 units at 0.9 Hz
    groupRef.current.position.y = -0.1 + Math.sin(t * 0.9 * Math.PI * 2) * 0.06;

    // Auto sway toward pointer (or slow auto-turn when no pointer activity)
    const targetX = pointer.x * 0.25;
    const targetY = pointer.y * 0.12;
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (targetY - groupRef.current.rotation.x) * 0.04;
  });

  void pointerX; // used indirectly via useFrame pointer

  return (
    <group ref={groupRef}>
      {/* ── Body: glossy rounded sphere in brand blue ── */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshPhysicalMaterial
          color={BODY_BLUE}
          roughness={0.25}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.08}
          reflectivity={1}
        />
      </mesh>

      {/* ── Embossed "?" mark on body (slightly raised disc) ── */}
      <mesh position={[0, 0.1, 0.72]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
        <meshPhysicalMaterial
          color="#4f9dff"
          roughness={0.3}
          clearcoat={0.6}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* ── Eyes ── */}
      <Eye x={-0.28} y={0.2} z={0.65} />
      <Eye x={0.28} y={0.2} z={0.65} />

      {/* ── Antenna stem ── */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.55, 12]} />
        <meshPhysicalMaterial color="#4f9dff" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* ── Antenna spark ── */}
      <AntennaSpark />

      {/* ── Contact shadow hint (tiny darkened disc at feet) ── */}
      <mesh position={[0, -0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#1657e0" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
