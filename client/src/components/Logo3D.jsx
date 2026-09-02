import React, { useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { NAVY_LETTERS, GREEN_LETTERS } from "./letterData";

const NAVY_COLOR = "#0E3B4D";
const GREEN_COLOR = "#5BA13B";

const ORIGINAL_OFFSETS = {
  E: 107,
  A1: 234,
  R1: 389,
  T: 524,
  H: 661,
  O: 818,
  R2: 965,
  I: 1102,
  A2: 1162,
};

function buildShapeFromPoints(outer, holes) {
  const shape = new THREE.Shape();
  outer.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  holes.forEach((holePts) => {
    const path = new THREE.Path();
    holePts.forEach(([x, y], i) => {
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();
    shape.holes.push(path);
  });

  return shape;
}

function Letter3D({ letterDef, color, depth = 26, bevelSize = 1.6 }) {
  const geometry = useMemo(() => {
    const shape = buildShapeFromPoints(letterDef.outer, letterDef.holes);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize * 0.85,
      bevelSegments: 6,
      curveSegments: 1,
      steps: 1,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(
      -(bb.min.x + bb.max.x) / 2,
      -(bb.min.y + bb.max.y) / 2,
      -depth / 2,
    );
    return geo;
  }, [letterDef, depth, bevelSize]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.28}
        metalness={0.25}
        clearcoat={0.7}
        clearcoatRoughness={0.18}
        reflectivity={0.6}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

const WORD_ORDER = [
  { def: NAVY_LETTERS[0], color: NAVY_COLOR, offsetKey: "E" },
  { def: NAVY_LETTERS[1], color: NAVY_COLOR, offsetKey: "A1" },
  { def: NAVY_LETTERS[2], color: NAVY_COLOR, offsetKey: "R1" },
  { def: NAVY_LETTERS[3], color: NAVY_COLOR, offsetKey: "T" },
  { def: NAVY_LETTERS[4], color: NAVY_COLOR, offsetKey: "H" },
  { def: GREEN_LETTERS[0], color: GREEN_COLOR, offsetKey: "O" },
  { def: GREEN_LETTERS[1], color: GREEN_COLOR, offsetKey: "R2" },
  { def: GREEN_LETTERS[2], color: GREEN_COLOR, offsetKey: "I" },
  { def: GREEN_LETTERS[3], color: GREEN_COLOR, offsetKey: "A2" },
];

// ─ Đèn "theo con trỏ" — quét một điểm sáng vàng ấm qua bề mặt logo khi
// người dùng di chuột, giống ánh phản chiếu trên huy hiệu kim loại thật
// thay vì ánh sáng tĩnh. Dùng lerp để chuyển động mượt, không giật khung.
function PointerLight({ pointer }) {
  const lightRef = useRef();
  useFrame(() => {
    if (!lightRef.current) return;
    const target = new THREE.Vector3(
      pointer.current.x * 6,
      pointer.current.y * 4 + 2,
      5,
    );
    lightRef.current.position.lerp(target, 0.08);
  });
  return (
    <pointLight
      ref={lightRef}
      intensity={1.5}
      color="#e8c878"
      distance={14}
      decay={2}
    />
  );
}

function LogoGroup({ pointer }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const idleY = Math.sin(state.clock.elapsedTime * 0.25) * 0.16;
    const idleFloat = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    // Nghiêng nhẹ thêm theo vị trí con trỏ, cộng dồn lên nhịp xoay tự thân
    // sẵn có — lerp để cảm giác "nặng tay", sang trọng hơn là bám cứng.
    const targetY = idleY + pointer.current.x * 0.32;
    const targetX = pointer.current.y * -0.18;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.06,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.06,
    );
    groupRef.current.position.y = idleFloat;
  });

  const lastLetter = WORD_ORDER[WORD_ORDER.length - 1];
  const totalWidth =
    ORIGINAL_OFFSETS[lastLetter.offsetKey] +
    lastLetter.def.width -
    ORIGINAL_OFFSETS["E"];
  const centerX = ORIGINAL_OFFSETS["E"] + totalWidth / 2;

  const scale = 0.018;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {WORD_ORDER.map(({ def, color, offsetKey }, i) => {
        const x = ORIGINAL_OFFSETS[offsetKey] + def.width / 2 - centerX;
        const y = def.height / 2 - 105 / 2;
        return (
          <group key={i} position={[x, y, 0]}>
            <Letter3D letterDef={def} color={color} />
          </group>
        );
      })}
    </group>
  );
}

export default function Logo3D() {
  const [autoRotate, setAutoRotate] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }, []);
  const handlePointerLeave = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: 220,
        position: "relative",
        overflow: "hidden",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0.6, 9], fov: 30 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[6, 9, 8]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-6, 4, -6]}
          intensity={0.35}
          color={"#bcd6c4"}
        />
        <PointerLight pointer={pointer} />

        {/* Environment map — yếu tố quan trọng nhất để vật liệu clearcoat
            có phản chiếu thật (bầu trời/môi trường xung quanh) thay vì chỉ
            ăn 2 đèn hướng tĩnh, giúp logo trông như kim loại/ngọc thật */}
        <Environment preset="city" blur={1} />

        <LogoGroup pointer={pointer} />

        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.35}
          scale={18}
          blur={2.2}
          far={5}
        />

        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          minDistance={5}
          maxDistance={14}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.7}
          onStart={() => setAutoRotate(true)}
        />
      </Canvas>
    </div>
  );
}
