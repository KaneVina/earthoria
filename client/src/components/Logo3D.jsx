import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { NAVY_LETTERS, GREEN_LETTERS } from "./letterData";

/**
 * EARTHORIA — Logo 3D
 * ---------------------------------------------------------------
 * Hình dạng từng chữ cái KHÔNG được vẽ tay ước lượng, mà được
 * trace trực tiếp từ file ảnh logo gốc (logoBT_1__12_.png) bằng
 * OpenCV (phân tách màu navy/green theo kênh RGB -> threshold ->
 * connectedComponents -> findContours với RETR_CCOMP để giữ đúng
 * các lỗ rỗng như vành khuyên chữ O). Toạ độ polygon thật sau đó
 * được chuẩn hoá và nhúng vào letterData.js.
 *
 * Vì vậy hình khối 3D ở đây bám sát 1:1 đường viền thật của logo,
 * kể cả các chi tiết tinh như nét hở của chữ R, đỉnh nhọn chữ A,
 * và 2 chiếc lá nối liền phía trên chữ O.
 * ---------------------------------------------------------------
 */

const NAVY_COLOR = "#0E3B4D";
const GREEN_COLOR = "#5BA13B";

// Khoảng cách offsetX gốc lấy thẳng từ ảnh (đơn vị px logo gốc),
// dùng nguyên để giữ đúng kerning giữa các chữ.
const ORIGINAL_OFFSETS = {
  E: 107, A1: 234, R1: 389, T: 524, H: 661,
  O: 818, R2: 965, I: 1102, A2: 1162,
};

/** Build THREE.Shape từ polygon outer + holes (mảng [x,y]) */
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

/** Một chữ cái 3D, geometry build từ dữ liệu trace thật */
function Letter3D({ letterDef, color, depth = 26, bevelSize = 1.6 }) {
  const geometry = useMemo(() => {
    const shape = buildShapeFromPoints(letterDef.outer, letterDef.holes);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize * 0.85,
      bevelSegments: 6,
      curveSegments: 1, // polygon đã là đường thẳng nối điểm trace -> không cần chia nhỏ thêm
      steps: 1,
    });
    // căn geometry quanh tâm bbox của chính nó để group định vị dễ
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -depth / 2);
    return geo;
  }, [letterDef, depth, bevelSize]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.3}
        metalness={0.2}
        clearcoat={0.65}
        clearcoatRoughness={0.2}
        reflectivity={0.55}
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
  { def: GREEN_LETTERS[0], color: GREEN_COLOR, offsetKey: "O" }, // bao gồm 2 lá dính liền
  { def: GREEN_LETTERS[1], color: GREEN_COLOR, offsetKey: "R2" },
  { def: GREEN_LETTERS[2], color: GREEN_COLOR, offsetKey: "I" },
  { def: GREEN_LETTERS[3], color: GREEN_COLOR, offsetKey: "A2" },
];

function LogoGroup() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.16;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  // Tổng chiều rộng (dùng offset gốc + width chữ cuối) để center cả cụm logo
  const lastLetter = WORD_ORDER[WORD_ORDER.length - 1];
  const totalWidth =
    ORIGINAL_OFFSETS[lastLetter.offsetKey] + lastLetter.def.width - ORIGINAL_OFFSETS["E"];
  const centerX = ORIGINAL_OFFSETS["E"] + totalWidth / 2;

  const scale = 0.018; // co toàn bộ logo (đơn vị px gốc) về kích thước scene hợp lý

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {WORD_ORDER.map(({ def, color, offsetKey }, i) => {
        const x = ORIGINAL_OFFSETS[offsetKey] + def.width / 2 - centerX;
        // baseline: chữ thường cao ~104-105, chữ O cao 144 (có lá) -> căn theo baseline chung y=0..105
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
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        position: "relative",
        background: "linear-gradient(180deg,#f7faf8 0%,#eef3ee 100%)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Canvas shadows camera={{ position: [0, 0.6, 13], fov: 30 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[6, 9, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 4, -6]} intensity={0.4} color={"#bcd6c4"} />

        <LogoGroup />

        <ContactShadows position={[0, -1.7, 0]} opacity={0.35} scale={18} blur={2.2} far={5} />

        <Environment preset="city" />

        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          minDistance={7}
          maxDistance={22}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>

      <button
        onClick={() => setAutoRotate((v) => !v)}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          padding: "8px 14px",
          borderRadius: 999,
          border: "1px solid #d8e2da",
          background: "rgba(255,255,255,0.9)",
          color: "#0E3B4D",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {autoRotate ? "Tắt tự xoay" : "Bật tự xoay"}
      </button>
    </div>
  );
}