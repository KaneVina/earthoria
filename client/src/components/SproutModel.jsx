import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * SproutModel — ambient 3D background for the "Giá Trị Cốt Lõi" (Core Values) section.
 * A crystalline knowledge-network: faceted nodes connected by lines that stay
 * perfectly locked to each node's live position every frame (no drift/desync).
 * Sits BEHIND content (low opacity, z-index 0); colors read from CSS variables
 * so it adapts automatically to light/dark mode.
 */
export default function SproutModel({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 1200;
    const H = el.clientHeight || 600;

    /* ── Theme colors from CSS variables (auto light/dark) ── */
    const rootStyles = getComputedStyle(document.documentElement);
    const goldHex = rootStyles.getPropertyValue("--gold").trim() || "#4a9e3f";
    const forestHex = rootStyles.getPropertyValue("--forest").trim() || "#0d3330";
    const goldLightHex = rootStyles.getPropertyValue("--gold-light").trim() || "#5cb84f";
    const isDark = document.body.classList.contains("dark-mode");

    const goldColor = new THREE.Color(goldHex);
    const forestColor = new THREE.Color(forestHex);
    const goldLightColor = new THREE.Color(goldLightHex);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50);
    camera.position.set(0, 0.4, 8.5);
    camera.lookAt(0, 0, 0);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.9));
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 0.55 : 0.65);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(goldColor, 0.5);
    fill.position.set(-4, -2, 3);
    scene.add(fill);

    /* ── Procedural soft-glow sprite texture (for node halos) ── */
    function makeGlowTexture(hex) {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      grad.addColorStop(0, hex);
      grad.addColorStop(0.4, hex.replace("1)", "0.5)"));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    }
    const glowTexGold = makeGlowTexture(`rgba(${Math.round(goldColor.r*255)},${Math.round(goldColor.g*255)},${Math.round(goldColor.b*255)},1)`);

    /* ── Materials ── */
    const nodeMat = new THREE.MeshStandardMaterial({
      color: goldColor, roughness: 0.25, metalness: 0.55,
      transparent: true, opacity: isDark ? 0.65 : 0.5,
      flatShading: true,
    });
    const nodeMatAlt = new THREE.MeshStandardMaterial({
      color: forestColor, roughness: 0.3, metalness: 0.5,
      transparent: true, opacity: isDark ? 0.6 : 0.45,
      flatShading: true,
    });

    /* ── Generate node positions (loose cloud, several depth layers) ── */
    const nodeCount = 22;
    const spread = { x: 9, y: 3.4, z: 4 };
    const basePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      basePositions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * spread.x,
          (Math.random() - 0.5) * spread.y,
          (Math.random() - 0.5) * spread.z - 0.5
        )
      );
    }

    /* ── Build edge list: connect each node to its nearest 2-3 neighbors ── */
    const maxDist = 2.8;
    const maxLinksPerNode = 3;
    const linkCounts = new Array(nodeCount).fill(0);
    const edges = []; // [i, j]
    const seen = new Set();

    for (let i = 0; i < nodeCount; i++) {
      const candidates = [];
      for (let j = 0; j < nodeCount; j++) {
        if (i === j) continue;
        const d = basePositions[i].distanceTo(basePositions[j]);
        if (d < maxDist) candidates.push({ j, d });
      }
      candidates.sort((a, b) => a.d - b.d);
      for (const { j } of candidates) {
        if (linkCounts[i] >= maxLinksPerNode || linkCounts[j] >= maxLinksPerNode) continue;
        const key = i < j ? `${i}_${j}` : `${j}_${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push([i, j]);
        linkCounts[i]++;
        linkCounts[j]++;
      }
    }

    /* ── Line geometry: positions + per-vertex color (fades with depth) ── */
    const lineVertexCount = edges.length * 2;
    const linePosArray = new Float32Array(lineVertexCount * 3);
    const lineColorArray = new Float32Array(lineVertexCount * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePosArray, 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColorArray, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.4 : 0.28,
    });
    const lattice = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lattice);

    /* ── Node meshes (faceted icosahedrons, varied size) + glow sprites ── */
    const geoSmall = new THREE.IcosahedronGeometry(0.055, 0);
    const geoMed = new THREE.IcosahedronGeometry(0.085, 0);
    const geoLarge = new THREE.IcosahedronGeometry(0.115, 0);

    const nodeGroup = new THREE.Group();
    const nodes = basePositions.map((basePos, i) => {
      const roll = Math.random();
      const geo = roll < 0.45 ? geoSmall : roll < 0.8 ? geoMed : geoLarge;
      const mat = i % 3 === 0 ? nodeMatAlt : nodeMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(basePos);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      nodeGroup.add(mesh);

      // small glow halo only on the larger "hub" nodes for visual hierarchy
      let glow = null;
      if (roll >= 0.8) {
        glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTexGold, transparent: true, opacity: isDark ? 0.5 : 0.32,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        const glowScale = 0.55;
        glow.scale.set(glowScale, glowScale, 1);
        glow.position.copy(basePos);
        nodeGroup.add(glow);
      }

      return {
        mesh,
        glow,
        basePos: basePos.clone(),
        livePos: basePos.clone(),
        phase: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.35,
        rotSpeed: 0.15 + Math.random() * 0.25,
      };
    });
    scene.add(nodeGroup);

    const latticeGroup = new THREE.Group();
    latticeGroup.add(lattice);
    latticeGroup.add(nodeGroup);
    scene.add(latticeGroup);

    /* ── Color helper: fade line color toward background tone by depth ── */
    const nearColor = goldLightColor;
    const farColor = forestColor;
    const tmpColor = new THREE.Color();

    function depthFactor(z) {
      // z roughly in [-2.5, 1.5] given spread.z; normalize to 0..1
      return THREE.MathUtils.clamp((z + 2.5) / 4, 0, 1);
    }

    /* ── Animate ── */
    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.0045;

      // 1) update each node's live position (organic drift)
      nodes.forEach((n) => {
        n.livePos.x = n.basePos.x + Math.sin(t * n.speed + n.phase) * 0.14;
        n.livePos.y = n.basePos.y + Math.cos(t * n.speed * 0.85 + n.phaseY) * 0.11;
        n.livePos.z = n.basePos.z + Math.sin(t * n.speed * 0.6 + n.phase) * 0.08;

        n.mesh.position.copy(n.livePos);
        n.mesh.rotation.x += 0.0025 * n.rotSpeed;
        n.mesh.rotation.y += 0.003 * n.rotSpeed;

        if (n.glow) {
          n.glow.position.copy(n.livePos);
          const pulse = 0.55 + Math.sin(t * 1.4 + n.phase) * 0.12;
          n.glow.scale.set(pulse, pulse, 1);
        }
      });

      // 2) rebuild line vertex positions + colors to PERFECTLY match live node positions
      const posAttr = lineGeo.attributes.position;
      const colAttr = lineGeo.attributes.color;
      edges.forEach(([i, j], idx) => {
        const a = nodes[i].livePos;
        const b = nodes[j].livePos;
        const vBase = idx * 2;

        posAttr.setXYZ(vBase, a.x, a.y, a.z);
        posAttr.setXYZ(vBase + 1, b.x, b.y, b.z);

        const da = depthFactor(a.z);
        const db = depthFactor(b.z);
        tmpColor.copy(farColor).lerp(nearColor, da);
        colAttr.setXYZ(vBase, tmpColor.r, tmpColor.g, tmpColor.b);
        tmpColor.copy(farColor).lerp(nearColor, db);
        colAttr.setXYZ(vBase + 1, tmpColor.r, tmpColor.g, tmpColor.b);
      });
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // 3) whole lattice drifts as one body — slow, luxurious
      latticeGroup.rotation.y = Math.sin(t * 0.18) * 0.12 + t * 0.025;
      latticeGroup.rotation.x = Math.sin(t * 0.13) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize ── */
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      lineGeo.dispose();
      geoSmall.dispose();
      geoMed.dispose();
      geoLarge.dispose();
      glowTexGold.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}