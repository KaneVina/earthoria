import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Download, Smartphone, Apple, Bot, BookOpen, Camera, Box, Mic,
  Sparkles, QrCode, MousePointerClick, RotateCcw, Plus, Minus,
  X, ArrowLeft, ArrowRight, Info, CheckCircle2, Loader2,
  Volume2, Leaf, CircleDot, ShieldCheck, PlayCircle, Globe, WifiOff, PawPrint,
} from 'lucide-react'

const STEPS = [
  {
    id: 'download',
    step: '01',
    title: 'Tải Ứng Dụng',
    subtitle: 'Hoặc Không Cần Cài Gì Cả',
    desc: 'Có 2 cách để bắt đầu: tải app Earthoria AR để có đầy đủ tính năng (AI Tutor, âm thanh vòm…), hoặc quét thẳng bằng Camera điện thoại — không cần cài đặt gì.',
    detail: 'Không có app? Quét bằng Camera/trình duyệt vẫn xem AR ngay trên web.',
    icon: 'download',
    color: '#4a9e3f',
    bg: '#0d3330',
  },
  {
    id: 'open',
    step: '02',
    title: 'Mở Sách',
    subtitle: 'Tìm Biểu Tượng AR',
    desc: 'Mở cuốn sách Earthoria. Các trang có biểu tượng tròn màu xanh là trang AR — nơi thế giới 3D sẽ hiện ra.',
    detail: 'Mỗi cuốn có 40–80 trang AR tùy theo bộ sưu tập.',
    icon: 'book',
    color: '#5cb84f',
    bg: '#1a5c52',
  },
  {
    id: 'scan',
    step: '03',
    title: 'Quét Trang Sách',
    subtitle: 'Hướng Camera Vào',
    desc: 'Hướng camera vào trang sách cách 20–40cm. Quét bằng app Earthoria: mô hình hiện ngay trong app. Quét bằng Camera điện thoại hoặc app khác: hệ thống tự mở trang AR tương ứng trên web.',
    detail: 'Đảm bảo ánh sáng đủ, trang sách phẳng, không bị nhăn.',
    icon: 'camera',
    color: '#4a9e3f',
    bg: '#2d7a6e',
  },
  {
    id: 'explore',
    step: '04',
    title: 'Khám Phá 3D',
    subtitle: 'Tương Tác Tự Do',
    desc: 'Mô hình 3D xuất hiện ngay trên trang sách! Xoay, phóng to, thu nhỏ bằng ngón tay. Nhấn vào sinh vật để nghe AI kể chuyện.',
    detail: 'Vuốt để xoay 360°, chụm/doãng để zoom, nhấn đôi để reset.',
    icon: 'cube',
    color: '#5cb84f',
    bg: '#0d3330',
  },
  {
    id: 'ai',
    step: '05',
    title: 'Hỏi AI Tutor',
    subtitle: 'Nhà Tự Nhiên Học Ảo',
    desc: 'Nhấn nút micro và đặt câu hỏi bất kỳ bằng tiếng Việt hoặc tiếng Anh. AI giải thích phù hợp theo lứa tuổi.',
    detail: 'Hỗ trợ hơn 500 câu hỏi theo chủ đề cho mỗi cuốn sách.',
    icon: 'mic',
    color: '#4a9e3f',
    bg: '#1a5c52',
  },
]

const STEP_ICONS = { download: Download, book: BookOpen, camera: Camera, cube: Box, mic: Mic }

const FEATURES = [
  { icon: Box, title: '120+ Mô Hình AR', desc: 'Mỗi cuốn sách có hơn 120 mô hình 3D siêu thực được nghiên cứu từ dữ liệu khoa học.' },
  { icon: Mic, title: 'AI Tutor Thông Minh', desc: 'Trợ lý AI đóng vai nhà tự nhiên học, trả lời hàng trăm câu hỏi theo cách phù hợp với trẻ.' },
  { icon: Volume2, title: 'Âm Thanh 3D Vòm', desc: 'Công nghệ spatial audio 360° tái hiện âm thanh sinh thái chân thực từng ngách rừng.' },
  { icon: WifiOff, title: 'Offline 100%', desc: 'Sau lần tải đầu, toàn bộ AR hoạt động không cần internet. Chỉ AI Tutor cần kết nối.' },
]

// Respect the user's OS-level motion preference everywhere we drive animation from JS.
function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Single shared loader so every demo reuses the same THREE instance/script tag.
let threeLoadPromise = null
function loadThreeJS() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.THREE) return Promise.resolve(window.THREE)
  if (!threeLoadPromise) {
    threeLoadPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[data-three-loader]')
      if (existing) { existing.addEventListener('load', () => resolve(window.THREE)); return }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.dataset.threeLoader = 'true'
      script.onload = () => resolve(window.THREE)
      document.head.appendChild(script)
    })
  }
  return threeLoadPromise
}

// Builds a small low-poly, stylized lion entirely out of primitives — no external
// model files, so it's fast, lightweight and license-free, but reads as a real 3D
// object rather than an emoji glyph.
function buildLionModel(THREE, accentColor) {
  const group = new THREE.Group()
  const fur = new THREE.MeshStandardMaterial({ color: 0xd9a44a, roughness: 0.75, metalness: 0.05 })
  const mane = new THREE.MeshStandardMaterial({ color: 0x8a4a26, roughness: 0.85, metalness: 0.03 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.6 })
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.35, roughness: 0.4 })

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), fur)
  body.scale.set(1.35, 0.95, 0.95)
  body.position.set(-0.05, -0.05, 0)
  group.add(body)

  // Mane (cluster of soft spikes around the head)
  const maneCore = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), mane)
  maneCore.position.set(0.62, 0.18, 0)
  group.add(maneCore)
  const spikeCount = 14
  for (let i = 0; i < spikeCount; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / spikeCount)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 6), mane)
    const r = 0.52
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.cos(phi)
    const z = r * Math.sin(phi) * Math.sin(theta)
    spike.position.set(0.62 + x * 1.05, 0.18 + y * 1.05, z * 1.05)
    spike.lookAt(0.62 + x * 2.2, 0.18 + y * 2.2, z * 2.2)
    spike.rotateX(Math.PI / 2)
    group.add(spike)
  }

  // Head / muzzle
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), fur)
  head.position.set(0.95, 0.16, 0)
  group.add(head)
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), fur)
  muzzle.scale.set(1.2, 0.85, 0.85)
  muzzle.position.set(1.22, 0.03, 0)
  group.add(muzzle)
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dark)
  nose.position.set(1.36, 0.05, 0)
  group.add(nose)

  // Eyes
  ;[1, -1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), dark)
    eye.position.set(1.08, 0.22, s * 0.16)
    group.add(eye)
  })

  // Ears
  ;[1, -1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mane)
    ear.position.set(0.82, 0.42, s * 0.22)
    group.add(ear)
  })

  // Legs
  const legPositions = [[-0.45, -0.5, 0.32], [-0.45, -0.5, -0.32], [0.35, -0.5, 0.32], [0.35, -0.5, -0.32]]
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8), fur)
    leg.position.set(x, y, z)
    group.add(leg)
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), fur)
    paw.position.set(x, y - 0.24, z)
    group.add(paw)
  })

  // Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.65, 8), fur)
  tail.position.set(-0.95, -0.05, 0)
  tail.rotation.z = Math.PI / 2.6
  group.add(tail)
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mane)
  tailTip.position.set(-1.32, 0.22, 0)
  group.add(tailTip)

  // Soft ground-contact disc using the step's accent color, ties the model into the brand palette
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.78, 32), accent)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.78
  ring.material.transparent = true
  ring.material.opacity = 0.45
  group.add(ring)

  group.scale.setScalar(0.85)
  return group
}

// Self-contained Three.js viewport that renders the procedural lion. Supports either
// gentle auto-rotation (ScanDemo preview) or fully interactive drag/zoom (ModelDemo).
function Lion3D({ color = '#4a9e3f', interactive = false, rotation, zoom = 1, height = '100%' }) {
  const mountRef = useRef(null)
  const stateRef = useRef({})

  useEffect(() => {
    let disposed = false
    loadThreeJS().then((THREE) => {
      if (disposed || !THREE || !mountRef.current) return
      const el = mountRef.current
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 50)
      camera.position.set(0, 0.3, 3.4)
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(el.clientWidth, el.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      el.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.55))
      const key = new THREE.DirectionalLight(0xfff3da, 1.1)
      key.position.set(2.5, 3, 2)
      scene.add(key)
      const rim = new THREE.PointLight(new THREE.Color(color).getHex(), 1.2, 8)
      rim.position.set(-2, 1, -1.5)
      scene.add(rim)

      const lion = buildLionModel(THREE, new THREE.Color(color).getHex())
      scene.add(lion)

      const ro = new ResizeObserver(() => {
        if (!el) return
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(el.clientWidth, el.clientHeight)
      })
      ro.observe(el)

      stateRef.current = { THREE, scene, camera, renderer, lion, ro }

      const reduced = prefersReducedMotion()
      let t = 0
      let animId
      function tick() {
        animId = requestAnimationFrame(tick)
        t += 0.01
        if (interactive && rotation) {
          lion.rotation.y = rotation.y * (Math.PI / 180)
          lion.rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x * (Math.PI / 180)))
          lion.scale.setScalar(0.85 * zoom)
        } else if (!reduced) {
          lion.rotation.y = t * 0.6
          lion.position.y = Math.sin(t * 1.3) * 0.06
        }
        renderer.render(scene, camera)
      }
      tick()
      stateRef.current.cleanup = () => { if (animId) cancelAnimationFrame(animId) }
    })

    return () => {
      disposed = true
      const s = stateRef.current
      if (s.cleanup) s.cleanup()
      if (s.ro) s.ro.disconnect()
      if (s.renderer) {
        s.renderer.dispose()
        if (s.renderer.domElement && s.renderer.domElement.parentNode) {
          s.renderer.domElement.parentNode.removeChild(s.renderer.domElement)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push live rotation/zoom updates without re-mounting the scene
  useEffect(() => {
    const s = stateRef.current
    if (!s.lion || !interactive || !rotation) return
    s.lion.rotation.y = rotation.y * (Math.PI / 180)
    s.lion.rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x * (Math.PI / 180)))
    s.lion.scale.setScalar(0.85 * zoom)
  }, [rotation, zoom, interactive])

  return <div ref={mountRef} style={{ width: '100%', height, minHeight: '120px' }} />
}

// Generic scroll-reveal wrapper: fades + lifts children in once they enter the viewport.
function Reveal({ children, delay = 0, y = 24 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) { setVisible(true); return }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

export default function ARGuide() {
  const canvasRef = useRef(null)
  const threeRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [activeStep, setActiveStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [modelVisible, setModelVisible] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [aiText, setAiText] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showDemo, setShowDemo] = useState(false)

  const AI_RESPONSES = [
    'Sư tử châu Phi (Panthera leo) là loài mèo lớn nhất châu Phi. Con đực trưởng thành có thể nặng tới 250kg!',
    'Bờm của sư tử đực giúp bảo vệ cổ trong các cuộc đấu tranh và thu hút con cái.',
    'Sư tử là loài mèo duy nhất sống thành đàn — gọi là "pride" — với 10–40 con.',
  ]
  const [aiIdx, setAiIdx] = useState(0)

  useEffect(() => {
    let THREE, scene, camera, renderer, animId
    let particles, ring1, ring2, floatMesh, scanPlane

    async function init() {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.onload = () => {
        THREE = window.THREE
        if (!canvasRef.current) return

        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(60, canvasRef.current.offsetWidth / canvasRef.current.offsetHeight, 0.1, 1000)
        camera.position.set(0, 0, 5)

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true })
        renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)

        // Floating particles
        const geo = new THREE.BufferGeometry()
        const count = 300
        const pos = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 20
          pos[i * 3 + 1] = (Math.random() - 0.5) * 20
          pos[i * 3 + 2] = (Math.random() - 0.5) * 10
          const t = Math.random()
          colors[i * 3] = t > 0.5 ? 0.29 : 0.36
          colors[i * 3 + 1] = t > 0.5 ? 0.62 : 0.72
          colors[i * 3 + 2] = t > 0.5 ? 0.25 : 0.43
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const mat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.7 })
        particles = new THREE.Points(geo, mat)
        scene.add(particles)

        // Glowing rings
        const rGeo1 = new THREE.TorusGeometry(2.5, 0.01, 8, 80)
        ring1 = new THREE.Mesh(rGeo1, new THREE.MeshBasicMaterial({ color: 0x4a9e3f, transparent: true, opacity: 0.3 }))
        scene.add(ring1)

        const rGeo2 = new THREE.TorusGeometry(1.8, 0.008, 8, 80)
        ring2 = new THREE.Mesh(rGeo2, new THREE.MeshBasicMaterial({ color: 0x5cb84f, transparent: true, opacity: 0.2 }))
        ring2.rotation.x = Math.PI / 3
        scene.add(ring2)

        // Central floating mesh (icosahedron)
        const fGeo = new THREE.IcosahedronGeometry(0.8, 1)
        const fMat = new THREE.MeshBasicMaterial({
          color: 0x4a9e3f, wireframe: true, transparent: true, opacity: 0
        })
        floatMesh = new THREE.Mesh(fGeo, fMat)
        scene.add(floatMesh)

        // Scan plane
        const spGeo = new THREE.PlaneGeometry(3, 2)
        const spMat = new THREE.MeshBasicMaterial({ color: 0x4a9e3f, transparent: true, opacity: 0, side: THREE.DoubleSide })
        scanPlane = new THREE.Mesh(spGeo, spMat)
        scanPlane.position.z = -1
        scene.add(scanPlane)

        threeRef.current = { THREE, scene, camera, renderer, particles, ring1, ring2, floatMesh, scanPlane }

        const reduced = prefersReducedMotion()
        let t = 0
        function animate() {
          if (!reduced) animId = requestAnimationFrame(animate)
          t += 0.008

          particles.rotation.y = t * 0.05
          particles.rotation.x = t * 0.02

          ring1.rotation.z = t * 0.3
          ring1.rotation.x = Math.sin(t * 0.2) * 0.3
          ring2.rotation.z = -t * 0.2
          ring2.rotation.y = Math.cos(t * 0.15) * 0.5

          if (floatMesh.material.opacity > 0) {
            floatMesh.rotation.x = t * 0.4
            floatMesh.rotation.y = t * 0.6
            floatMesh.position.y = Math.sin(t * 1.2) * 0.15
          }

          if (scanPlane.material.opacity > 0) {
            scanPlane.position.y = Math.sin(t * 2) * 0.8
          }

          if (!reduced) {
            camera.position.x += (mouseRef.current.x * 0.6 - camera.position.x) * 0.04
            camera.position.y += (-mouseRef.current.y * 0.4 - camera.position.y) * 0.04
            camera.lookAt(0, 0, 0)
          }

          renderer.render(scene, camera)
        }
        animate()

        const ro = new ResizeObserver(() => {
          if (!canvasRef.current) return
          const w = canvasRef.current.offsetWidth
          const h = canvasRef.current.offsetHeight
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        })
        ro.observe(canvasRef.current)
      }
      document.head.appendChild(script)
    }
    init()

    const handleScroll = () => {
      const el = document.getElementById('ar-guide-main')
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setScrollProgress(Math.max(0, Math.min(1, scrolled / total)))
    }
    window.addEventListener('scroll', handleScroll)

    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animId) cancelAnimationFrame(animId)
      if (renderer) renderer.dispose()
    }
  }, [])

  // Scroll-spy: keep the sticky nav + 3D scene in sync with whichever step is in view.
  useEffect(() => {
    const sections = document.querySelectorAll('.ar-step-section')
    if (!sections.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.stepIndex)
            if (!Number.isNaN(idx)) setActiveStep(idx)
          }
        })
      },
      { threshold: 0.5, rootMargin: '-90px 0px -35% 0px' }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Morph Three.js scene based on active step
  useEffect(() => {
    const r = threeRef.current
    if (!r) return
    const { floatMesh, scanPlane, ring1, ring2 } = r

    const fade = (mesh, to, dur = 800) => {
      if (prefersReducedMotion()) { mesh.material.opacity = to; return }
      const start = mesh.material.opacity
      const t0 = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1)
        mesh.material.opacity = start + (to - start) * p
        if (p < 1) requestAnimationFrame(tick)
      }
      tick()
    }

    switch (activeStep) {
      case 0: fade(floatMesh, 0); fade(scanPlane, 0); ring1.material.opacity = 0.3; ring2.material.opacity = 0.2; break
      case 1: fade(floatMesh, 0); fade(scanPlane, 0.08); ring1.material.opacity = 0.5; break
      case 2: fade(floatMesh, 0); fade(scanPlane, 0.15); ring1.material.opacity = 0.6; ring2.material.opacity = 0.4; break
      case 3: fade(floatMesh, 0.5); fade(scanPlane, 0); ring1.material.opacity = 0.2; ring2.material.opacity = 0.5; break
      case 4: fade(floatMesh, 0.4); fade(scanPlane, 0); ring1.material.opacity = 0.4; break
    }
  }, [activeStep])

  const handleScan = () => {
    setScanning(true)
    setScanProgress(0)
    setModelVisible(false)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 8 + 4
      setScanProgress(Math.min(100, Math.round(p)))
      if (p >= 100) {
        clearInterval(iv)
        setScanning(false)
        setModelVisible(true)
        toast.success('Sư tử châu Phi đã xuất hiện!', { duration: 3000 })
      }
    }, 120)
  }

  const handleAsk = () => {
    setAiTyping(true)
    setAiText('')
    const response = AI_RESPONSES[aiIdx % AI_RESPONSES.length]
    setAiIdx(i => i + 1)
    let i = 0
    const iv = setInterval(() => {
      setAiText(response.slice(0, i + 1))
      i++
      if (i >= response.length) { clearInterval(iv); setAiTyping(false) }
    }, 28)
  }

  const handleMagnet = (e, strength = 0.22) => {
    if (prefersReducedMotion()) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    e.currentTarget.style.transform = `translate(${x * strength}px, ${y * (strength * 1.4)}px)`
  }
  const resetMagnet = (e) => { e.currentTarget.style.transform = 'translate(0,0)' }

  return (
    <div id="ar-guide-main" style={{ background: '#050e0a', minHeight: '100vh', color: '#faf8f3', fontFamily: "'Be Vietnam Pro', sans-serif", overflowX: 'hidden' }}>

      {/* ── Reading progress ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '2px', width: `${scrollProgress * 100}%`, background: 'linear-gradient(90deg, #4a9e3f, #5cb84f)', zIndex: 250, transition: 'width 0.1s linear' }} />

      <LiveDemoModal open={showDemo} onClose={() => setShowDemo(false)} />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(13,51,48,0.7) 0%, transparent 70%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, #050e0a 0%, transparent 100%)', zIndex: 2 }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: '1400px', margin: '0 auto', padding: '140px 100px 80px', width: '100%' }}>
          <Reveal y={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '0.5px', background: '#4a9e3f' }} />
              <span style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#4a9e3f', fontWeight: 400 }}>
                Hướng Dẫn Công Nghệ
              </span>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(52px, 6vw, 96px)', fontWeight: 300, lineHeight: 1.04, letterSpacing: '-0.02em', marginBottom: '28px', maxWidth: '700px' }}>
              Mở Sách —<br/>
              <span style={{ fontStyle: 'italic', color: '#4a9e3f' }}>Thế Giới</span><br/>
              Hiện Ra
            </h1>
          </Reveal>

          <Reveal delay={0.15} y={16}>
            <p style={{ fontSize: '16px', lineHeight: 1.85, color: 'rgba(250,248,243,0.55)', maxWidth: '480px', fontWeight: 300, marginBottom: '56px' }}>
              5 bước đơn giản để khởi động trải nghiệm AR đầu tiên của bé. Từ tải app đến nghe AI kể chuyện — tất cả trong 3 phút.
            </p>
          </Reveal>

          <Reveal delay={0.3} y={16}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('step-1').scrollIntoView({ behavior: 'smooth' })}
                onMouseMove={handleMagnet}
                style={{ background: '#4a9e3f', color: '#0a0e0c', border: 'none', padding: '16px 40px', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 400, transition: 'background 0.3s, transform 0.2s ease-out' }}
                onMouseEnter={e => e.currentTarget.style.background = '#5cb84f'}
                onMouseLeave={e => { e.currentTarget.style.background = '#4a9e3f'; resetMagnet(e) }}
              >
                Bắt Đầu Ngay
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
              <DemoTrigger onClick={() => setShowDemo(true)} />
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={0.45} y={16}>
            <div style={{ display: 'flex', gap: '0', marginTop: '80px', borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '40px' }}>
              {[['3 min', 'Thời gian cài đặt'], ['120+', 'Mô hình 3D'], ['4.9★', 'Đánh giá'], ['100%', 'Offline AR']].map(([v, l], i) => (
                <div key={i} style={{ flex: 1, paddingRight: '40px', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.08)' : 'none', paddingLeft: i > 0 ? '40px' : 0 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 300, color: '#4a9e3f', lineHeight: 1, marginBottom: '8px' }}>{v}</div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Cuộn xuống</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(74,158,63,0.6), transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }} />
        </div>
      </div>

      {/* ── Step Navigation bar (sticky) ── */}
      <div style={{ position: 'sticky', top: '0', zIndex: 100, background: 'rgba(5,14,10,0.95)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(74,158,63,0.15)', padding: '0 100px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '60px', gap: '0' }}>
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                setActiveStep(i)
                document.getElementById(`step-${i + 1}`)?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                flex: 1, height: '100%', background: 'transparent', border: 'none',
                borderBottom: activeStep === i ? '2px solid #4a9e3f' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: activeStep === i ? '#4a9e3f' : 'rgba(255,255,255,0.35)',
                fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase'
              }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 300, opacity: 0.6 }}>{step.step}</span>
              <span className="step-nav-label">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      {STEPS.map((step, idx) => (
        <section
          key={step.id}
          id={`step-${idx + 1}`}
          className="ar-step-section"
          data-step-index={idx}
          style={{ minHeight: '100vh', background: step.bg, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
        >
          {/* BG pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(74,158,63,0.4), transparent)' }} />

          {/* Big step number bg */}
          <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(200px, 25vw, 320px)', fontWeight: 300, color: 'rgba(255,255,255,0.02)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-0.05em' }}>{step.step}</div>

          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '120px 100px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

            {/* Left: Content */}
            <Reveal>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ width: '40px', height: '0.5px', background: step.color }} />
                  <span style={{ fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: step.color }}>Bước {step.step}</span>
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 4vw, 64px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.01em', color: '#faf8f3', marginBottom: '8px' }}>{step.title}</h2>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 300, fontStyle: 'italic', color: step.color, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {(() => { const StepIcon = STEP_ICONS[step.icon]; return <StepIcon size={22} strokeWidth={1.5} /> })()}
                  {step.subtitle}
                </h3>

                <p style={{ fontSize: '16px', lineHeight: 1.9, color: 'rgba(250,248,243,0.7)', fontWeight: 300, marginBottom: '20px', maxWidth: '440px' }}>{step.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(74,158,63,0.08)', border: '0.5px solid rgba(74,158,63,0.2)', maxWidth: '440px' }}>
                  <Info size={14} strokeWidth={1.5} color={step.color} />
                  <span style={{ fontSize: '12px', color: 'rgba(250,248,243,0.5)', fontWeight: 300 }}>{step.detail}</span>
                </div>

                {/* Navigation arrows */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
                  {idx > 0 && (
                    <button
                      onClick={() => { setActiveStep(idx - 1); document.getElementById(`step-${idx}`)?.scrollIntoView({ behavior: 'smooth' }) }}
                      style={{ padding: '12px 24px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = step.color; e.currentTarget.style.color = step.color }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                    >
                      <ArrowLeft size={12} strokeWidth={1.5} />
                      Trước
                    </button>
                  )}
                  {idx < STEPS.length - 1 && (
                    <button
                      onClick={() => { setActiveStep(idx + 1); document.getElementById(`step-${idx + 2}`)?.scrollIntoView({ behavior: 'smooth' }) }}
                      style={{ padding: '12px 28px', border: 'none', background: step.color, color: '#0a0e0c', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s', fontWeight: 400 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Bước Tiếp Theo
                      <ArrowRight size={12} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Right: Interactive Demo */}
            <Reveal delay={0.12}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {idx === 0 && <DownloadDemo color={step.color} />}
                {idx === 1 && <BookDemo color={step.color} />}
                {idx === 2 && (
                  <ScanDemo color={step.color} scanning={scanning} progress={scanProgress}
                    onScan={handleScan} modelVisible={modelVisible} />
                )}
                {idx === 3 && <ModelDemo color={step.color} modelVisible={modelVisible} />}
                {idx === 4 && (
                  <AIDemo color={step.color} onAsk={handleAsk} typing={aiTyping} text={aiText} />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* ── Features Grid ── */}
      <section style={{ background: '#071210', padding: '120px 100px', borderTop: '0.5px solid rgba(74,158,63,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '0.5px', background: '#4a9e3f' }} />
                <span style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#4a9e3f' }}>Tính Năng</span>
                <div style={{ width: '32px', height: '0.5px', background: '#4a9e3f' }} />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 300, color: '#faf8f3', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                Công Nghệ <span style={{ fontStyle: 'italic', color: '#4a9e3f' }}>Vượt Trội</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <FeatureCard f={f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#050e0a', padding: '120px 100px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: '64px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '0.5px', background: '#4a9e3f' }} />
                <span style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#4a9e3f' }}>Hỏi Đáp</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 300, color: '#faf8f3', lineHeight: 1.2 }}>Câu Hỏi <span style={{ fontStyle: 'italic', color: '#4a9e3f' }}>Thường Gặp</span></h2>
            </div>
          </Reveal>
          {[
            ['Máy tôi có hỗ trợ không?', 'Earthoria AR hoạt động trên hầu hết điện thoại từ 2019 trở đi. iPhone SE (2020) trở lên, Android mid-range với 3GB RAM trở lên đều chạy mượt.'],
            ['Con tôi dùng được không nếu chưa biết đọc?', 'Hoàn toàn được! AI Tutor hỗ trợ nhận lệnh giọng nói, và toàn bộ AR hoạt động bằng thao tác chạm trực quan. Trẻ từ 4 tuổi đã có thể dùng độc lập.'],
            ['Mất bao lâu để cài đặt?', 'Tải app mất 2 phút. Tải nội dung AR cho một cuốn sách mất 5–10 phút tuỳ tốc độ mạng. Sau đó dùng offline hoàn toàn.'],
            ['Có thể dùng trên máy tính bảng không?', 'iPad và Android tablet đều hỗ trợ — và trải nghiệm còn tốt hơn nhờ màn hình lớn. Màn hình 8 inch trở lên là lý tưởng nhất.'],
          ].map(([q, a], i) => (
            <Reveal key={i} delay={i * 0.06}>
              <FAQItem q={q} a={a} color="#4a9e3f" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#0d3330', padding: '140px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '0.5px solid rgba(74,158,63,0.15)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', border: '0.5px solid rgba(74,158,63,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', border: '0.5px solid rgba(74,158,63,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <span style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#4a9e3f', marginBottom: '24px', display: 'block' }}>Sẵn Sàng Chưa?</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 300, color: '#faf8f3', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '24px' }}>
              Bắt Đầu Hành Trình<br/><span style={{ fontStyle: 'italic', color: '#4a9e3f' }}>Khám Phá</span> Ngay Hôm Nay
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(250,248,243,0.45)', maxWidth: '480px', margin: '0 auto 56px', lineHeight: 1.8, fontWeight: 300 }}>
              Hàng ngàn gia đình đã trải nghiệm. Bộ sách đầu tiên chỉ trong 3 phút là con bé đã có thể khám phá thế giới 3D.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop">
                <button
                  onMouseMove={handleMagnet}
                  style={{ background: '#4a9e3f', color: '#0a0e0c', border: 'none', padding: '18px 48px', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 400, transition: 'background 0.3s, transform 0.2s ease-out' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#5cb84f'}
                  onMouseLeave={e => { e.currentTarget.style.background = '#4a9e3f'; resetMagnet(e) }}
                >
                  Mua Sách Ngay
                </button>
              </Link>
              <Link to="/shop">
                <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.2)', padding: '18px 40px', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a9e3f'; e.currentTarget.style.color = '#4a9e3f' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                >
                  Xem Thư Viện Sách
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        @keyframes scrollPulse { 0%,100%{opacity:0.3;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.1)} }
        @keyframes scanLine { 0%{top:0} 100%{top:100%} }
        @keyframes modelFloat { 0%,100%{transform:translateY(0) rotateY(0deg)} 50%{transform:translateY(-10px) rotateY(10deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cornerSpin { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes progressShine { from{left:-100%} to{left:200%} }
        @keyframes sparkleFloat { 0%{opacity:0;transform:scale(0.3) translateY(0)} 30%{opacity:1} 100%{opacity:0;transform:scale(1) translateY(-30px)} }
        @keyframes waveBar { 0%,100%{height:4px} 50%{height:22px} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin-icon { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes btnGlow { 0%,100%{opacity:0.45;transform:scale(1)} 50%{opacity:0.15;transform:scale(1.06)} }
        @keyframes bounceHint { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} }

        .step-nav-label { display: none; }
        @media (min-width: 900px) { .step-nav-label { display: inline; } }

        button:focus-visible, a:focus-visible { outline: 2px solid #4a9e3f; outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── Hero "watch the demo" trigger ──
function DemoTrigger({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      <div style={{ width: '36px', height: '36px', border: `0.5px solid ${hover ? '#4a9e3f' : 'rgba(74,158,63,0.4)'}`, background: hover ? 'rgba(74,158,63,0.12)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
        <PlayCircle size={16} strokeWidth={1.5} color="#4a9e3f" />
      </div>
      <span style={{ fontSize: '12px', color: hover ? '#faf8f3' : 'rgba(250,248,243,0.45)', transition: 'color 0.25s' }}>Xem demo trực tiếp 30 giây</span>
    </button>
  )
}

// ── Auto-playing live demo modal (scan → reveal → AI answer, on loop) ──
function LiveDemoModal({ open, onClose }) {
  const [phase, setPhase] = useState('scan')
  const [scanOn, setScanOn] = useState(false)
  const [aiText, setAiText] = useState('')
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!open) return
    cancelledRef.current = false
    const messages = [
      'Voi châu Phi là động vật trên cạn lớn nhất, nặng tới 6 tấn và sống theo đàn mẫu hệ.',
      'Chúng dùng vòi với hơn 40.000 cơ để ngửi, uống nước và ôm con.',
    ]
    let msgIdx = 0
    let typeIv = null

    function runScan() {
      if (cancelledRef.current) return
      setPhase('scan'); setScanOn(false); setAiText('')
      requestAnimationFrame(() => { if (!cancelledRef.current) setScanOn(true) })
      setTimeout(() => runReveal(), 2000)
    }
    function runReveal() {
      if (cancelledRef.current) return
      setPhase('reveal')
      setTimeout(() => runAI(), 1700)
    }
    function runAI() {
      if (cancelledRef.current) return
      setPhase('ai')
      const msg = messages[msgIdx % messages.length]
      msgIdx++
      let i = 0
      typeIv = setInterval(() => {
        if (cancelledRef.current) { clearInterval(typeIv); return }
        i++
        setAiText(msg.slice(0, i))
        if (i >= msg.length) {
          clearInterval(typeIv)
          setTimeout(() => runScan(), 2200)
        }
      }, 26)
    }
    runScan()
    return () => { cancelledRef.current = true; if (typeIv) clearInterval(typeIv) }
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey) }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Demo trực tiếp Earthoria AR"
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,6,0.85)', backdropFilter: 'blur(6px)', animation: 'fadeInUp 0.3s ease' }}
      />
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '320px', maxWidth: '100%', background: '#0d1f1a', border: '0.5px solid rgba(74,158,63,0.25)', padding: '28px 24px 24px', borderRadius: '4px', boxShadow: '0 60px 120px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng demo"
          style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        ><X size={14} strokeWidth={1.8} /></button>

        <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a9e3f', marginBottom: '20px' }}>Demo Trực Tiếp</div>

        <div style={{ background: 'linear-gradient(160deg, #0f2e20 0%, #1a4a30 100%)', borderRadius: '16px', padding: '20px', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a9e3f', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {phase === 'scan' ? <><Loader2 size={11} className="spin-icon" /> Đang quét trang sách...</> : phase === 'reveal' ? <><CheckCircle2 size={11} /> Voi châu Phi xuất hiện</> : <><Mic size={11} /> AI Tutor đang trả lời</>}
          </div>
          <div style={{ flex: 1, border: phase === 'scan' ? '1px solid #4a9e3f' : '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '160px' }}>
            {phase === 'scan' && (
              <>
                {['tl', 'tr', 'bl', 'br'].map(c => (
                  <div key={c} style={{ position: 'absolute', width: '14px', height: '14px', [c.includes('t') ? 'top' : 'bottom']: '-1px', [c.includes('l') ? 'left' : 'right']: '-1px', borderTop: c.includes('t') ? '2px solid #4a9e3f' : 'none', borderBottom: c.includes('b') ? '2px solid #4a9e3f' : 'none', borderLeft: c.includes('l') ? '2px solid #4a9e3f' : 'none', borderRight: c.includes('r') ? '2px solid #4a9e3f' : 'none' }} />
                ))}
                <CircleDot size={24} strokeWidth={1.5} color="#4a9e3f" style={{ opacity: 0.25 }} />
              </>
            )}
            {(phase === 'reveal' || phase === 'ai') && (
              <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto', borderRadius: '50%', background: 'rgba(74,158,63,0.12)', border: '0.5px solid rgba(74,158,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'modelFloat 3s ease-in-out infinite' }}>
                  <PawPrint size={26} strokeWidth={1.5} color="#4a9e3f" />
                </div>
                <div style={{ fontSize: '10px', color: '#4a9e3f', marginTop: '6px' }}>Loxodonta africana</div>
              </div>
            )}
          </div>
          {phase === 'scan' && (
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '14px', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#4a9e3f', width: scanOn ? '100%' : '0%', transition: 'width 2s linear' }} />
            </div>
          )}
          {phase === 'ai' && (
            <div style={{ marginTop: '14px', background: 'rgba(74,158,63,0.1)', border: '0.5px solid rgba(74,158,63,0.25)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', minHeight: '48px' }}>
              {aiText}<span style={{ animation: 'blink 1s step-end infinite', color: '#4a9e3f' }}>|</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
          Quét sách, xem mô hình 3D nổi lên, rồi hỏi AI bất cứ điều gì — vòng lặp tự động.
        </p>
      </div>
    </div>
  )
}

// ── Download Demo ──
function DownloadDemo({ color }) {
  const [platform, setPlatform] = useState(null)
  const [mode, setMode] = useState('app') // 'app' | 'noapp'
  return (
    <div style={{ width: '320px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '3px' }}>
        {[['app', 'Dùng App', Smartphone], ['noapp', 'Không Cần App', QrCode]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setMode(id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: mode === id ? color : 'transparent', color: mode === id ? '#0a0e0c' : 'rgba(255,255,255,0.55)', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: mode === id ? 500 : 300, transition: 'all 0.25s' }}>
            <Icon size={13} strokeWidth={1.5} />{label}
          </button>
        ))}
      </div>

      {mode === 'app' ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '40px 32px', textAlign: 'center', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(74,158,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Smartphone size={28} strokeWidth={1.5} color={color} />
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 300, color: '#faf8f3', marginBottom: '8px' }}>Earthoria AR</h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '32px' }}>Phiên bản 3.2.1 · 124MB · Miễn phí</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[[Apple, 'App Store', 'iOS 14+'], [Bot, 'Google Play', 'Android 10+']].map(([Icon, label, sub], i) => (
              <button key={i}
                onClick={() => { setPlatform(i); toast.success(`Đang chuyển đến ${label}...`) }}
                style={{ flex: 1, padding: '16px 12px', background: platform === i ? color : 'rgba(255,255,255,0.06)', border: `0.5px solid ${platform === i ? color : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', transition: 'all 0.3s', color: platform === i ? '#0a0e0c' : '#faf8f3', borderRadius: '2px' }}
              >
                <Icon size={18} strokeWidth={1.5} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', fontWeight: platform === i ? 500 : 300 }}>{label}</div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>{sub}</div>
              </button>
            ))}
          </div>
          {platform !== null && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(74,158,63,0.1)', border: '0.5px solid rgba(74,158,63,0.3)', animation: 'fadeInUp 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CheckCircle2 size={13} color={color} />
              <span style={{ fontSize: '12px', color: color }}>Đang mở cửa hàng ứng dụng...</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '36px 32px', textAlign: 'center', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ width: '120px', height: '120px', margin: '0 auto 20px', background: '#faf8f3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <QrCode size={68} strokeWidth={1.2} color="#0a0e0c" />
            <div style={{ position: 'absolute', inset: 0, border: `2px solid ${color}`, borderRadius: '8px', animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <p style={{ fontSize: '13px', color: '#faf8f3', fontWeight: 400, marginBottom: '6px' }}>Quét QR bằng Camera điện thoại</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '20px' }}>Web AR mở ngay trên trình duyệt — không cần tải hay cài đặt gì cả.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(74,158,63,0.08)', border: `0.5px solid rgba(74,158,63,0.25)` }}>
            <Globe size={13} strokeWidth={1.5} color={color} />
            <span style={{ fontSize: '11px', color: color }}>earthoria.ar/book/rung-mua</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(74,158,63,0.06)', border: '0.5px solid rgba(74,158,63,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={14} strokeWidth={1.5} color={color} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>Không quảng cáo · Không yêu cầu tài khoản</span>
      </div>
    </div>
  )
}

// ── Book Demo ──
function BookDemo({ color }) {
  const [hoveredPage, setHoveredPage] = useState(null)
  const wrapRef = useRef(null)
  const pages = [null, null, '◉', null, '◉', '◉', null, '◉']

  const handleMove = (e) => {
    if (prefersReducedMotion()) return
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(700px) rotateY(${-8 + px * 14}deg) rotateX(${-py * 7}deg)`
  }
  const handleLeave = () => {
    const el = wrapRef.current
    if (!el) return
    el.style.transform = 'perspective(700px) rotateY(-8deg) rotateX(0deg)'
  }

  return (
    <div style={{ width: '340px', position: 'relative' }}>
      <div
        ref={wrapRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ background: '#faf8f3', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', transform: 'perspective(700px) rotateY(-8deg)', transformOrigin: 'left center', transition: 'transform 0.15s ease-out' }}
      >
        {/* Book spine */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', background: color, borderRadius: '2px 0 0 2px' }} />
        <div style={{ padding: '28px 28px 28px 24px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#5a6b60', textTransform: 'uppercase', marginBottom: '12px' }}>Earthoria · Bộ Thiên Nhiên</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#0d3330', marginBottom: '20px', lineHeight: 1.2 }}>Bí Mật Rừng Mưa</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {pages.map((hasAR, i) => (
              <div key={i}
                onMouseEnter={() => setHoveredPage(i)}
                onMouseLeave={() => setHoveredPage(null)}
                style={{
                  height: '60px', background: hasAR
                    ? (hoveredPage === i ? color : 'rgba(74,158,63,0.15)')
                    : '#f0ece4',
                  border: `0.5px solid ${hasAR ? (hoveredPage === i ? color : 'rgba(74,158,63,0.3)') : 'rgba(13,43,30,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: hasAR ? 'pointer' : 'default',
                  transition: 'all 0.3s',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {hasAR && hoveredPage !== i && (
                  <div style={{ position: 'absolute', inset: '4px', border: `1px solid ${color}`, borderRadius: '4px', animation: 'pulse 1.8s ease-in-out infinite' }} />
                )}
                {hasAR && (
                  hoveredPage === i
                    ? <QrCode size={22} strokeWidth={1.5} color="#fff" style={{ animation: 'fadeInUp 0.2s ease' }} />
                    : <CircleDot size={15} strokeWidth={1.5} color={color} />
                )}
                {hasAR && hoveredPage === i && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(74,158,63,0.2)', animation: 'fadeInUp 0.3s ease' }} />
                    <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>Quét bằng Camera</div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDot size={14} strokeWidth={1.5} color={color} />
            <span style={{ fontSize: '11px', color: '#5a6b60' }}>= Trang có AR · Rê chuột để xem</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scan Demo ──
function ScanDemo({ color, scanning, progress, onScan, modelVisible }) {
  const [sparkles, setSparkles] = useState([])
  const [mode, setMode] = useState('app') // 'app' | 'camera'
  const [hasScannedOnce, setHasScannedOnce] = useState(false)
  const wasVisible = useRef(false)

  useEffect(() => {
    if (modelVisible && !wasVisible.current) {
      wasVisible.current = true
      setHasScannedOnce(true)
      if (!prefersReducedMotion()) {
        const arr = Array.from({ length: 10 }, (_, i) => ({
          id: i,
          left: 30 + Math.random() * 40,
          top: 20 + Math.random() * 40,
          delay: Math.random() * 0.35,
        }))
        setSparkles(arr)
        const t = setTimeout(() => setSparkles([]), 1300)
        return () => clearTimeout(t)
      }
    }
    if (!modelVisible) wasVisible.current = false
  }, [modelVisible])

  return (
    <div style={{ width: '280px' }}>
      {/* App vs Camera mode toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '3px' }}>
        {[['app', 'Quét bằng App', Smartphone], ['camera', 'Camera / Trình duyệt', Globe]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setMode(id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px 4px', background: mode === id ? color : 'transparent', color: mode === id ? '#0a0e0c' : 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: mode === id ? 500 : 300, transition: 'all 0.25s' }}>
            <Icon size={11} strokeWidth={1.5} />{label}
          </button>
        ))}
      </div>

      {/* Phone mockup */}
      <div style={{ background: '#0a0e0c', borderRadius: '24px', border: '6px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(160deg, #0f2e20 0%, #1a4a30 100%)', minHeight: '460px', display: 'flex', flexDirection: 'column' }}>
          {/* Status bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', paddingTop: '4px' }}>
            <span>9:41</span><span>●●●</span>
          </div>
          {/* Browser address bar mockup when in camera/no-app mode and a result is showing */}
          {mode === 'camera' && modelVisible ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px', animation: 'fadeInUp 0.3s ease' }}>
              <Globe size={10} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>earthoria.ar/book/rung-mua/leo</span>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(74,158,63,0.15)', border: '0.5px solid rgba(74,158,63,0.4)', padding: '4px 10px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: color, marginBottom: '12px', width: 'fit-content' }}>
              {scanning ? <><Loader2 size={10} className="spin-icon" /> Đang quét...</> : modelVisible ? <><CheckCircle2 size={10} /> Đã nhận diện</> : 'Chế độ AR'}
            </div>
          )}
          {mode === 'camera' && modelVisible && (
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', letterSpacing: '0.05em' }}>Mở bằng trình duyệt · Không cần cài App</div>
          )}
          {/* Viewfinder */}
          <div style={{ flex: 1, border: scanning ? `1px solid ${color}` : '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', minHeight: '260px', background: modelVisible ? 'rgba(74,158,63,0.05)' : 'transparent', transition: 'all 0.5s' }}>
            {/* Corners */}
            {['tl', 'tr', 'bl', 'br'].map(c => (
              <div key={c} style={{ position: 'absolute', width: '14px', height: '14px', [c.includes('t') ? 'top' : 'bottom']: '-1px', [c.includes('l') ? 'left' : 'right']: '-1px', borderTop: c.includes('t') ? `2px solid ${color}` : 'none', borderBottom: c.includes('b') ? `2px solid ${color}` : 'none', borderLeft: c.includes('l') ? `2px solid ${color}` : 'none', borderRight: c.includes('r') ? `2px solid ${color}` : 'none', animation: scanning ? 'cornerSpin 1s ease-in-out infinite' : 'none' }} />
            ))}
            {/* Scan line */}
            {scanning && (
              <div style={{ position: 'absolute', left: '16px', right: '16px', height: '1px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, top: `${progress}%`, transition: 'top 0.1s linear' }} />
            )}
            {/* Sparkle burst on successful recognition */}
            {sparkles.map(s => (
              <span key={s.id} style={{ position: 'absolute', left: `${s.left}%`, top: `${s.top}%`, fontSize: '13px', color, pointerEvents: 'none', animation: `sparkleFloat 1s ease-out ${s.delay}s forwards` }}>✦</span>
            ))}
            {/* Content */}
            {modelVisible ? (
              <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease', width: '100%' }}>
                <div style={{ height: '120px' }}><Lion3D color={color} height="120px" /></div>
                <div style={{ fontSize: '11px', color: color, marginTop: '4px', letterSpacing: '0.1em' }}>Panthera leo</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Sư tử châu Phi • 3D</div>
              </div>
            ) : scanning ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: color, marginBottom: '8px' }}>{progress}%</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Đang nhận diện...</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.1em' }}>
                <CircleDot size={24} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <div>Hướng vào trang sách</div>
              </div>
            )}
          </div>
          {/* Progress bar */}
          {scanning && (
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '12px', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: color, width: `${progress}%`, transition: 'width 0.1s', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-100%', width: '60%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'progressShine 1s ease-in-out infinite' }} />
              </div>
            </div>
          )}
          {/* Scan button, made obviously clickable */}
          <div style={{ position: 'relative' }}>
            {!hasScannedOnce && !scanning && !modelVisible && (
              <div style={{ position: 'absolute', top: '-26px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: color, whiteSpace: 'nowrap', animation: 'bounceHint 1.4s ease-in-out infinite' }}>
                <MousePointerClick size={11} strokeWidth={1.5} />Nhấn vào đây để bắt đầu
              </div>
            )}
            {!scanning && !modelVisible && (
              <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50px', background: color, opacity: 0.5, animation: 'btnGlow 1.6s ease-in-out infinite', pointerEvents: 'none' }} />
            )}
            <button
              onClick={onScan}
              disabled={scanning || modelVisible}
              style={{ position: 'relative', width: '100%', background: scanning ? 'rgba(74,158,63,0.3)' : modelVisible ? 'rgba(74,158,63,0.5)' : color, border: 'none', borderRadius: '50px', height: '44px', cursor: scanning || modelVisible ? 'not-allowed' : 'pointer', fontSize: '11px', color: modelVisible ? color : '#0a0e0c', letterSpacing: '0.1em', fontFamily: "'Be Vietnam Pro', sans-serif", transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !scanning && !modelVisible ? `0 4px 24px ${color}66` : 'none' }}
            >
              {modelVisible ? <><CheckCircle2 size={13} />Đã quét thành công</> : scanning ? <><Loader2 size={13} className="spin-icon" />Đang quét...</> : <><CircleDot size={13} />Bắt đầu quét AR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Model Demo ──
function ModelDemo({ color, modelVisible }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [info, setInfo] = useState(null)
  const lastPos = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const inertiaRaf = useRef(null)

  const HOTSPOTS = [
    { x: '55%', y: '30%', label: 'Bờm', desc: 'Bảo vệ cổ trong đấu tranh' },
    { x: '70%', y: '50%', label: 'Móng vuốt', desc: 'Dài 7cm, sắc bén' },
    { x: '40%', y: '60%', label: 'Cơ thể', desc: 'Nặng 120–250kg' },
  ]

  const getPoint = (e) => (e.touches && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY })

  const stopInertia = () => {
    if (inertiaRaf.current) { cancelAnimationFrame(inertiaRaf.current); inertiaRaf.current = null }
  }

  const startDrag = (e) => {
    stopInertia()
    setDragging(true)
    lastPos.current = getPoint(e)
    velocity.current = { x: 0, y: 0 }
  }
  const moveDrag = (e) => {
    if (!dragging) return
    const p = getPoint(e)
    const dx = p.x - lastPos.current.x
    const dy = p.y - lastPos.current.y
    velocity.current = { x: dx, y: dy }
    setRotation(r => ({ x: r.x + dy * 0.5, y: r.y + dx * 0.5 }))
    lastPos.current = p
  }
  const endDrag = () => {
    setDragging(false)
    if (prefersReducedMotion()) return
    let vx = velocity.current.y * 0.5
    let vy = velocity.current.x * 0.5
    const step = () => {
      vx *= 0.94
      vy *= 0.94
      setRotation(r => ({ x: r.x + vx, y: r.y + vy }))
      if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) {
        inertiaRaf.current = requestAnimationFrame(step)
      } else {
        inertiaRaf.current = null
      }
    }
    if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) inertiaRaf.current = requestAnimationFrame(step)
  }

  useEffect(() => () => stopInertia(), [])

  return (
    <div style={{ width: '340px' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* 3D viewport */}
        <div
          style={{ height: '300px', background: 'radial-gradient(ellipse at center, rgba(74,158,63,0.05) 0%, transparent 70%)', position: 'relative', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
          onWheel={e => setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.001)))}
        >
          <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 20px 40px rgba(74,158,63,0.3))' }}>
            {modelVisible ? (
              <Lion3D color={color} interactive rotation={rotation} zoom={zoom} height="100%" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`, animation: !dragging ? 'modelFloat 4s ease-in-out infinite' : 'none' }}>
                <Box size={72 * zoom} strokeWidth={1} color="rgba(255,255,255,0.2)" />
              </div>
            )}
          </div>
          {/* Hotspots */}
          {modelVisible && HOTSPOTS.map((h, i) => (
            <div key={i} style={{ position: 'absolute', left: h.x, top: h.y }}>
              <button
                onClick={() => setInfo(info === i ? null : i)}
                style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', animation: 'pulse 2s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}
              ><Plus size={11} strokeWidth={2.5} /></button>
              {info === i && (
                <div style={{ position: 'absolute', left: '24px', top: '-8px', background: 'rgba(13,51,48,0.95)', border: `0.5px solid ${color}`, padding: '8px 12px', whiteSpace: 'nowrap', zIndex: 10, animation: 'fadeInUp 0.3s ease', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '11px', color: '#faf8f3', fontWeight: 500 }}>{h.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{h.desc}</div>
                </div>
              )}
            </div>
          ))}
          {/* Controls hint */}
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>Kéo để xoay · Cuộn để zoom</div>
          <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '9px', color: color, letterSpacing: '0.1em' }}>360°</div>
        </div>
        {/* Controls */}
        <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Zoom: {Math.round(zoom * 100)}%</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[Minus, RotateCcw, Plus].map((Icon, i) => (
              <button key={i} onClick={() => { stopInertia(); if (i === 0) setZoom(z => Math.max(0.5, z - 0.2)); if (i === 1) { setZoom(1); setRotation({ x: 0, y: 0 }) } if (i === 2) setZoom(z => Math.min(2.5, z + 0.2)) }}
                style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', color: '#faf8f3', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Icon size={13} strokeWidth={1.5} /></button>
            ))}
          </div>
        </div>
      </div>
      {!modelVisible && (
        <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(74,158,63,0.06)', border: '0.5px solid rgba(74,158,63,0.15)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Hoàn thành bước 3 để thấy mô hình 3D thật sự
        </div>
      )}
    </div>
  )
}

// ── AI Demo ──
function AIDemo({ color, onAsk, typing, text }) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const handleMic = () => {
    setListening(true)
    setTimeout(() => { setListening(false); onAsk() }, 1500)
  }
  const handleListen = () => {
    if (speaking) return
    setSpeaking(true)
    setTimeout(() => setSpeaking(false), 1800)
  }
  const thinking = typing && !text
  return (
    <div style={{ width: '340px' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
        {/* AI header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'relative', width: '40px', height: '40px' }}>
            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: color, opacity: 0.25, animation: 'pulse 2.4s ease-in-out infinite' }} />
            <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${color}, #5cb84f)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${color}55` }}>
              <Leaf size={18} strokeWidth={1.5} color="#0a0e0c" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#faf8f3', fontWeight: 400 }}>Nhà Tự Nhiên Học AI</div>
            <div style={{ fontSize: '10px', color: color, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, animation: 'pulse 2s infinite' }} />
              Đang hoạt động
            </div>
          </div>
        </div>
        {/* Messages */}
        <div style={{ minHeight: '180px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '2px 12px 12px 12px', padding: '12px 16px', marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontWeight: 300, boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
            Xin chào! Tôi là trợ lý tự nhiên học của Earthoria. Bạn muốn biết điều gì về <span style={{ color: color }}>Sư tử châu Phi</span>?
          </div>
          {thinking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px', padding: '10px 16px', animation: 'fadeInUp 0.3s ease' }}>
              <Sparkles size={13} strokeWidth={1.5} color={color} style={{ animation: 'pulse 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Đang suy nghĩ...</span>
            </div>
          )}
          {text && (
            <div style={{ background: `rgba(74,158,63,0.1)`, border: `0.5px solid rgba(74,158,63,0.2)`, borderRadius: '12px 2px 12px 12px', padding: '12px 16px', marginLeft: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontWeight: 300, animation: 'fadeInUp 0.3s ease', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
              {text}
              {typing && <span style={{ animation: 'blink 1s step-end infinite', marginLeft: '2px', color: color }}>|</span>}
              {!typing && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={handleListen} disabled={speaking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: speaking ? 'default' : 'pointer', fontSize: '11px', color: speaking ? color : 'rgba(255,255,255,0.4)', fontFamily: "'Be Vietnam Pro', sans-serif", padding: 0 }}>
                    <Volume2 size={13} strokeWidth={1.5} style={{ animation: speaking ? 'pulse 0.7s ease-in-out infinite' : 'none' }} />
                    {speaking ? 'Đang đọc...' : 'Nghe'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Suggested questions / waveform while listening */}
        {listening ? (
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center', height: '28px', marginBottom: '16px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: '3px', height: '4px', borderRadius: '2px', background: color, animation: 'waveBar 0.9s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['Sư tử sống bao lâu?', 'Chúng ăn gì?', 'Bầy sư tử có bao nhiêu con?'].map((q, i) => (
              <button key={i} onClick={onAsk}
                style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Be Vietnam Pro', sans-serif", transition: 'all 0.2s', borderRadius: '2px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >{q}</button>
            ))}
          </div>
        )}
        {/* Mic button */}
        <button
          onClick={handleMic}
          disabled={listening || typing}
          style={{ width: '100%', height: '52px', background: listening ? 'rgba(74,158,63,0.2)' : color, border: `0.5px solid ${listening ? color : 'transparent'}`, cursor: listening || typing ? 'wait' : 'pointer', fontSize: '13px', color: listening ? color : '#0a0e0c', fontFamily: "'Be Vietnam Pro', sans-serif", letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s', animation: listening ? 'pulse 0.8s infinite' : 'none', boxShadow: !listening && !typing ? `0 6px 20px ${color}40` : 'none' }}
        >
          <Mic size={15} strokeWidth={1.5} />
          {listening ? 'Đang nghe...' : typing ? 'Đang trả lời...' : 'Hỏi AI Tutor'}
        </button>
      </div>
    </div>
  )
}

// ── Feature card with cursor-tilt ──
function FeatureCard({ f }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) { el.style.background = '#0d1f1a'; return }
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateY(-2px)`
    el.style.background = '#0d1f1a'
  }
  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)'
    el.style.background = '#071210'
  }
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ background: '#071210', padding: '52px 48px', cursor: 'default', transition: 'transform 0.25s ease-out, background 0.4s', transformStyle: 'preserve-3d' }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(74,158,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <f.icon size={24} strokeWidth={1.5} color="#4a9e3f" />
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 400, color: '#faf8f3', marginBottom: '12px' }}>{f.title}</h3>
      <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(250,248,243,0.5)', fontWeight: 300 }}>{f.desc}</p>
    </div>
  )
}

// ── FAQ Item ──
function FAQItem({ q, a, color }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '24px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 400, color: '#faf8f3', lineHeight: 1.3 }}>{q}</span>
        <Plus size={18} strokeWidth={1.5} color={color} style={{ flexShrink: 0, transition: 'transform 0.3s', transform: open ? 'rotate(45deg)' : 'none' }} />
      </button>
      <div style={{ maxHeight: open ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <p style={{ fontSize: '14px', lineHeight: 1.85, color: 'rgba(255,255,255,0.45)', paddingBottom: '24px', fontWeight: 300, margin: 0 }}>{a}</p>
      </div>
    </div>
  )
}