import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useGLTF,
  Environment,
  ContactShadows,
  OrbitControls,
  Center,
} from "@react-three/drei";

/**
 * Loads and renders the GLB mesh.
 * Wrap this in <Suspense> — useGLTF suspends while the file streams in.
 *
 * GLB files exported from different tools (Blender, etc.) can come in at
 * wildly different real-world scales — some are 1 unit tall, some are
 * 100+ units tall. If we don't normalize that, the fixed camera distance
 * either floats far away from a tiny model or ends up INSIDE a huge one
 * (which looks like a blank/foggy close-up — exactly what "stuck inside
 * the elephant" looks like). So we measure the model's bounding box after
 * load and rescale it to a consistent target size before centering it.
 */
function Mesh({ url, autoRotate, autoRotateSpeed, targetSize = 2 }) {
  const { scene } = useGLTF(url);
  const group = useRef();

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return targetSize / maxDim;
  }, [scene, targetSize]);

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * autoRotateSpeed;
    }
  });

  return (
    <Center>
      <group ref={group} scale={scale}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

/**
 * A drop-in, reusable 3D viewer.
 *
 * <Model3D url="/models/Untitled.glb" />
 *
 * Props:
 *  - url            path to the .glb file (default: /models/Untitled.glb)
 *  - height         CSS height of the canvas wrapper (default: "420px")
 *  - autoRotate     spins the model when idle (default: true)
 *  - autoRotateSpeed radians/sec (default: 0.35)
 *  - enableZoom     allow scroll/pinch-to-zoom (default: true)
 *  - enablePan      allow right-click pan (default: false)
 *  - minDistance    closest the camera can zoom in (default: 0.8)
 *  - maxDistance    farthest the camera can zoom out (default: 8)
 *  - background     CSS background for the canvas wrapper (default: transparent)
 *  - className       extra classes on the wrapper div
 */
export default function Model3D({
  url = "/models/Untitled.glb",
  height = "420px",
  autoRotate = true,
  autoRotateSpeed = 0.35,
  enableZoom = true,
  enablePan = false,
  minDistance = 0.8,
  maxDistance = 8,
  background = "transparent",
  className = "",
}) {
  return (
    <div
      className={`model3d-viewer ${className}`}
      style={{ width: "100%", height, background, position: "relative" }}
    >
      <Canvas
        camera={{ position: [0, 0.6, 3.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 2]} intensity={1.4} castShadow />
          <Mesh
            url={url}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
          />
          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.45}
            scale={6}
            blur={2.4}
            far={2}
          />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enableZoom={enableZoom}
          enablePan={enablePan}
          enableDamping
          dampingFactor={0.08}
          zoomSpeed={0.9}
          rotateSpeed={0.7}
          minDistance={minDistance}
          maxDistance={maxDistance}
          autoRotate={false}
          makeDefault
        />
      </Canvas>
    </div>
  );
}

// Preload so the file starts fetching as soon as the module is imported.
useGLTF.preload("/models/Untitled.glb");