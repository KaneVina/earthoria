import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useGLTF,
  Environment,
  ContactShadows,
  OrbitControls,
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
function Mesh({
  url,
  autoRotate,
  autoRotateSpeed,
  targetSize = 2,
  scaleMultiplier = 1,
}) {
  const { scene } = useGLTF(url);
  const group = useRef();
  // Tracks the scale we've actually rendered so far, so changes to
  // scaleMultiplier (e.g. preview <-> immersive) animate smoothly instead
  // of snapping instantly.
  const currentScale = useRef(null);

  // Tính cả scale CHUẨN HÓA và TÂM bounding-box cùng lúc, MỘT LẦN, dựa
  // trên scene gốc (chưa xoay). Quan trọng: ta tự trừ offset này vào vị
  // trí của <primitive>, thay vì dùng <Center> của drei — vì <Center>
  // chỉ canh giữa lúc mount rồi thôi, không biết group cha sẽ tiếp tục
  // xoay quanh trục Y mỗi frame. Nếu model không đối xứng quanh trục
  // xoay (ví dụ con vật đang cuộn người, nghiêng một bên), việc xoay
  // quanh "tâm bounding-box lúc mount" mà bounding-box đó không trùng
  // tâm hình học thật sẽ khiến model trông như "lắc ra khỏi tâm" theo
  // từng frame xoay — đúng hiện tượng "con gấu rời trung tâm khi quay".
  // Cách khắc phục: dịch mesh sao cho TÂM bounding-box nằm đúng tại gốc
  // [0,0,0] CỦA GROUP XOAY — để dù group cha xoay góc nào, tâm đó vẫn
  // đứng yên tại chính giữa khung hình.
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
      // Offset áp dụng TRƯỚC khi scale (đơn vị gốc của scene), nên nhân
      // ngược lại 1/scale khi gán position của <primitive> bên trong
      // group đã scale — xem bên dưới.
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
        // First frame after (re)mount: snap straight to target, nothing to
        // animate from yet.
        currentScale.current = target;
      } else {
        // Critically-damped-feeling ease toward the target scale. The
        // 1 - exp(-k*delta) form keeps the speed frame-rate independent.
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
 *  - scaleMultiplier extra zoom factor on top of the auto-normalized size,
 *                    eased smoothly on change (default: 1) — handy for
 *                    preview/immersive style size transitions
 *  - className       extra classes on the wrapper div
 *  - rimColor        màu của rim light (viền sáng mảnh phía sau model,
 *                    tạo cảm giác "công nghệ" tinh tế qua ánh sáng thay
 *                    vì geometry phụ trợ) — nên khớp với biến CSS
 *                    --av-tech-green (default: "#6fe06a")
 *  - rimIntensity    độ mạnh của rim light (default: 2.2)
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
  scaleMultiplier = 1,
  rimColor = "#6fe06a",
  rimIntensity = 2.2,
}) {
  return (
    <div
      className={`model3d-viewer ${className}`}
      style={{ width: "100%", height, background, position: "relative" }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 3.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Ánh sáng nền dịu, KHÔNG để model bị "phẳng" — chỉ đủ để
              giữ chi tiết ở vùng tối, phần lớn độ tương phản đến từ
              key light + rim light bên dưới. */}
          <ambientLight intensity={0.32} />

          {/* Key light — nguồn sáng chính, ấm nhẹ, từ trên-trước-phải,
              tạo bóng đổ rõ ràng (đổ vào ContactShadows bên dưới). */}
          <directionalLight
            position={[3, 4.5, 2.5]}
            intensity={1.65}
            color="#fff7ec"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Rim light kép — hai đèn màu công nghệ (xanh lá, khớp brand)
              đặt CHÉO PHÍA SAU model, hắt sáng dọc theo rìa ngược sáng
              của model khi xoay. Đây là kỹ thuật "edge lighting" tiêu
              chuẩn trong chụp sản phẩm cao cấp — viền sáng mảnh, sắc
              nét xuất hiện tự nhiên theo góc nhìn, không phải vẽ thêm
              hình học nào, nên luôn khớp hoàn hảo với silhouette thật
              của model dù nó xoay hướng nào. */}
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
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            scaleMultiplier={scaleMultiplier}
          />

          {/* Đổ bóng mềm, hơi rộng và mờ hơn bản gốc — neo thị giác model
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

          {/* Environment cho phản chiếu bề mặt bóng/kim loại trên model
              — "city" cho nhiều cạnh phản chiếu rõ hơn "studio" phẳng,
              giúp chất liệu trông có chiều sâu thay vì nhựa mờ đều. */}
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