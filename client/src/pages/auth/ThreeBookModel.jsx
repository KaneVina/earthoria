import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBookModel() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 400;
    const H = el.clientHeight || 300;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    /* ── Scene & fog (adds depth/luxury haze) ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a2420, 0.045);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 3.6, 6.8);
    camera.lookAt(0, 0, 0);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0x0d3330, 0.35));

    const sunLight = new THREE.PointLight(0xffd98a, 7, 22, 1.8);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const fillTeal = new THREE.DirectionalLight(0x2d7a6e, 0.45);
    fillTeal.position.set(-5, 3, -3);
    scene.add(fillTeal);

    const rimGreen = new THREE.PointLight(0x4a9e3f, 1.4, 16);
    rimGreen.position.set(4, -2, 3);
    scene.add(rimGreen);

    const rimGold = new THREE.PointLight(0xc9a84c, 1.0, 12);
    rimGold.position.set(-3, 2, 4);
    scene.add(rimGold);

    /* ── Soft circular glow sprite texture (procedural, no external assets) ── */
    function makeGlowTexture(innerHex, outerHex) {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      grad.addColorStop(0, innerHex);
      grad.addColorStop(0.35, outerHex);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const sunGlowTex = makeGlowTexture("rgba(255,235,170,1)", "rgba(245,195,77,0.55)");
    const starGlowTex = makeGlowTexture("rgba(220,240,210,1)", "rgba(150,200,140,0)");

    /* ── Starfield (sprites = soft round points, not square pixels) ── */
    const starCount = 260;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starScale = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 7.5 + Math.random() * 5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      starPos[i*3+1] = r * Math.sin(ph) * Math.sin(th) * 0.55;
      starPos[i*3+2] = r * Math.cos(ph);
      starScale[i] = 0.4 + Math.random() * 1.1;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      map: starGlowTex,
      size: 0.09,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ── Sun: layered for richness ── */
    const sunGeo = new THREE.SphereGeometry(0.5, 64, 64);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffd98a,
      emissive: 0xf5c34d,
      emissiveIntensity: 1.6,
      roughness: 0.3,
      metalness: 0.1,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunGlowTex, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sunSprite.scale.set(3.2, 3.2, 1);
    scene.add(sunSprite);

    const sunSprite2 = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunGlowTex, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sunSprite2.scale.set(5.2, 5.2, 1);
    scene.add(sunSprite2);

    /* ── Materials: physical for a premium, glassy/metallic look ── */
    function makePlanetMat(color, opts = {}) {
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: opts.roughness ?? 0.42,
        metalness: opts.metalness ?? 0.35,
        clearcoat: opts.clearcoat ?? 0.5,
        clearcoatRoughness: 0.3,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        envMapIntensity: 1.1,
      });
    }

    /* ── Elliptical orbit path (returns point on ellipse) ── */
    function ellipsePoint(a, b, angle) {
      return new THREE.Vector3(Math.cos(angle) * a, 0, Math.sin(angle) * b);
    }

    function makeOrbitLine(a, b) {
      const pts = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const ang = (i / segments) * Math.PI * 2;
        pts.push(ellipsePoint(a, b, ang));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x4a9e3f, transparent: true, opacity: 0.28,
      });
      return new THREE.LineLoop(geo, mat);
    }

    /* ── Planet definitions: elliptical orbits (a, b semi-axes) ── */
    const planetDefs = [
      { a: 1.15, b: 1.0,  size: 0.075, color: 0x9c8d77, speed: 1.5,  tilt: 0.05, roughness: 0.6, metalness: 0.15 },
      { a: 1.55, b: 1.4,  size: 0.12,  color: 0xc9a84c, speed: 1.1,  tilt: 0.08, roughness: 0.25, metalness: 0.55, clearcoat: 0.8 },
      { a: 2.05, b: 1.85, size: 0.135, color: 0x4a9e3f, speed: 0.9,  tilt: 0.0,  emissive: 0x1a4a1a, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.3 },
      { a: 2.5,  b: 2.3,  size: 0.095, color: 0xb5573f, speed: 0.72, tilt: 0.07, roughness: 0.55, metalness: 0.2 },
      { a: 3.15, b: 2.85, size: 0.26,  color: 0x2d7a6e, speed: 0.46, tilt: 0.05, ring: true, roughness: 0.3, metalness: 0.5, clearcoat: 0.6 },
      { a: 3.8,  b: 3.45, size: 0.19,  color: 0x6fce5a, speed: 0.34, tilt: 0.1,  emissive: 0x2a5a2a, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.35 },
    ];

    const planets = planetDefs.map((def) => {
      const orbitLine = makeOrbitLine(def.a, def.b);
      orbitLine.rotation.x = def.tilt;
      scene.add(orbitLine);

      const mat = makePlanetMat(def.color, def);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.size, 40, 40), mat);
      mesh.rotation.x = def.tilt;

      // soft point-light trail dot (subtle glow companion behind planet)
      const trailSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: starGlowTex, color: def.color, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      trailSprite.scale.set(def.size * 5, def.size * 5, 1);

      const pivot = new THREE.Group();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      pivot.add(mesh);
      pivot.add(trailSprite);
      scene.add(pivot);

      if (def.ring) {
        const ringGeo = new THREE.RingGeometry(def.size * 1.5, def.size * 2.3, 56);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd9c27e, side: THREE.DoubleSide, transparent: true, opacity: 0.55,
        });
        const planetRing = new THREE.Mesh(ringGeo, ringMat);
        planetRing.rotation.x = Math.PI / 2.25;
        mesh.add(planetRing);
      }

      return { pivot, mesh, trailSprite, def, angle: Math.random() * Math.PI * 2 };
    });

    /* ── Moon orbiting the teal giant ── */
    const moonMat = makePlanetMat(0xe8e2d4, { roughness: 0.7, metalness: 0.1 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 20), moonMat);
    const moonPivot = new THREE.Group();
    planets[4].mesh.add(moonPivot);
    moonPivot.add(moon);
    moon.position.x = 0.4;

    /* ── Easing helper for smooth camera drift ── */
    const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

    /* ── Animate ── */
    let raf;
    let t = 0;
    let targetMx = 0, targetMy = 0, curMx = 0, curMy = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.0065;

      sun.rotation.y += 0.0018;
      const pulse = 1 + Math.sin(t * 1.3) * 0.035;
      sunSprite.scale.set(3.2 * pulse, 3.2 * pulse, 1);
      sunSprite2.scale.set(5.2 * (1 + Math.sin(t * 1.0 + 1) * 0.05), 5.2 * (1 + Math.sin(t * 1.0 + 1) * 0.05), 1);

      planets.forEach((p) => {
        p.angle += 0.0042 * p.def.speed;
        const pos = ellipsePoint(p.def.a, p.def.b, p.angle);
        pos.applyEuler(new THREE.Euler(p.def.tilt, 0, 0));
        p.pivot.position.copy(new THREE.Vector3(0,0,0));
        p.mesh.position.copy(pos);
        p.trailSprite.position.copy(pos);
        p.mesh.rotation.y += 0.012;
      });
      moonPivot.rotation.y += 0.035;

      stars.rotation.y += 0.00025;

      // smooth eased camera parallax (lerp toward target)
      curMx += (targetMx - curMx) * 0.04;
      curMy += (targetMy - curMy) * 0.04;
      camera.position.x = curMx * 1.1;
      camera.position.y = 3.6 - curMy * 0.9;
      camera.lookAt(0, 0, 0);

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

    /* ── Mouse parallax target ── */
    const onMouse = (e) => {
      const r = el.getBoundingClientRect();
      targetMx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      targetMy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };
    el.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("mousemove", onMouse);
      renderer.dispose();
      sunGeo.dispose();
      starGeo.dispose();
      sunGlowTex.dispose();
      starGlowTex.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "300px",
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
      }}
    />
  );
}