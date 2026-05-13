import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function SoftRings() {
  const groupRef = useRef(null);
  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.z += dt * 0.02;
    g.rotation.y += dt * 0.006;
  });

  return (
    <Float speed={0.35} rotationIntensity={0.12} floatIntensity={0.18}>
      <group ref={groupRef} rotation={[0.42, -0.22, 0.12]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.35, 0.011, 12, 96]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.09}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.15, 0.28, 0.18]}>
          <torusGeometry args={[3.05, 0.009, 12, 80]} />
          <meshBasicMaterial
            color="#f472b6"
            transparent
            opacity={0.055}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.35, -0.18, -0.08]}>
          <torusGeometry args={[3.75, 0.007, 10, 64]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

function SceneContent() {
  return (
    <>
      <Stars
        radius={90}
        depth={55}
        count={1100}
        factor={2.8}
        saturation={0.32}
        fade
        speed={0.15}
      />
      <SoftRings />
    </>
  );
}

export default function BackgroundScene() {
  const [frameloop, setFrameloop] = useState(() => (document.hidden ? 'never' : 'always'));

  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div className="three-bg-root" aria-hidden>
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.75]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 6.2], fov: 40 }}
        onCreated={({ gl, scene }) => {
          scene.background = null;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
