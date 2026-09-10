import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useGLTF,
  Environment,
  ContactShadows,
  OrbitControls,
} from "@react-three/drei";

function Mesh({
  url,
  autoRotate,
  autoRotateSpeed,
  targetSize = 2,
  scaleMultiplier = 1,
}) {
  const { scene } = useGLTF(url);
  const group = useRef();
  const currentScale = useRef(null);
  const { baseScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    return {
      baseScale: scale,
      centerOffset: center,
    };
  }, [scene, targetSize]);

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * autoRotateSpeed;
    }

    if (group.current) {
      const target = baseScale * scaleMultiplier;
      if (currentScale.current === null) {
        currentScale.current = target;
      } else {
        const k = 6.5;
        currentScale.current +=
          (target - currentScale.current) * (1 - Math.exp(-k * delta));
      }
      group.current.scale.setScalar(currentScale.current);
    }
  });

  return (
    <group ref={group} scale={baseScale * scaleMultiplier}>
      <primitive
        object={scene}
        position={[-centerOffset.x, -centerOffset.y, -centerOffset.z]}
      />
    </group>
  );
}

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
  scaleMultiplier = 1,
  rimColor = "#6fe06a",
  rimIntensity = 2.2,
}) {
  const [spinning, setSpinning] = useState(autoRotate);
  useEffect(() => {
    setSpinning(autoRotate);
  }, [autoRotate]);

  const tapStateRef = useRef({ count: 0, timer: null, downPos: null });

  const handlePointerDown = (e) => {
    tapStateRef.current.downPos = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    const down = tapStateRef.current.downPos;
    tapStateRef.current.downPos = null;
    if (!down) return;

    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const isDrag = Math.hypot(dx, dy) > 8; // ngưỡng 8px
    if (isDrag) return;

    tapStateRef.current.count += 1;
    clearTimeout(tapStateRef.current.timer);
    tapStateRef.current.timer = setTimeout(() => {
      tapStateRef.current.count = 0;
    }, 600); // 3 lần tap phải nằm trong 600ms

    if (tapStateRef.current.count >= 3) {
      tapStateRef.current.count = 0;
      setSpinning((prev) => !prev);
    }
  };

  return (
    <div
      className={`model3d-viewer ${className}`}
      style={{ width: "100%", height, background, position: "relative" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Canvas
        camera={{ position: [0, 0.4, 3.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.32} />
          <directionalLight
            position={[3, 4.5, 2.5]}
            intensity={1.65}
            color="#fff7ec"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          <pointLight
            position={[-2.2, 1.4, -2]}
            intensity={rimIntensity}
            color={rimColor}
            distance={6}
            decay={2}
          />
          <pointLight
            position={[2, 0.6, -2.4]}
            intensity={rimIntensity * 0.6}
            color={rimColor}
            distance={6}
            decay={2}
          />

          {/* Fill light rất nhẹ phía đối diện key light, giữ vùng tối
              không bị đen hoàn toàn nhưng vẫn còn chiều sâu. */}
          <directionalLight
            position={[-2, 1, 3]}
            intensity={0.25}
            color="#dfeee0"
          />

          <Mesh
            url={url}
            autoRotate={spinning}
            autoRotateSpeed={autoRotateSpeed}
            scaleMultiplier={scaleMultiplier}
          />

          {/* Đổ bóng mềm, hơi rộng và mờ hơn bản gốc - neo thị giác model
              xuống "mặt sàn" mà không tạo viền cứng dưới chân. */}
          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.5}
            scale={7}
            blur={3}
            far={2.2}
            resolution={512}
            color="#02110d"
          />

          <Environment preset="city" environmentIntensity={0.55} />
        </Suspense>
        <OrbitControls
          target={[0, 0, 0]}
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
useGLTF.preload("/models/PolarBear.glb");