import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  Compass,
  BookOpen,
  Newspaper,
  Mail,
} from "lucide-react";

const quickLinks = [
  { label: "Trang chủ", to: "/", icon: Home },
  { label: "Cửa hàng", to: "/shop", icon: BookOpen },
  { label: "Blog", to: "/blog", icon: Newspaper },
  { label: "Liên hệ", to: "/contact", icon: Mail },
];

// Hand-drawn compass illustration in the Earthoria palette.
// The needle drifts slowly to suggest "lost", not broken.
function LostCompass() {
  return (
    <motion.svg
      width="132"
      height="132"
      viewBox="0 0 132 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* faint wandering trail */}
      <motion.path
        d="M10 118 C 34 108, 40 86, 60 90 S 96 108, 122 88"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeDasharray="1 7"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
      />

      {/* outer ring */}
      <circle
        cx="66"
        cy="56"
        r="46"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle
        cx="66"
        cy="56"
        r="38"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        opacity="0.6"
      />

      {/* tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 66 + Math.sin(angle) * 40;
        const y1 = 56 - Math.cos(angle) * 40;
        const x2 = 66 + Math.sin(angle) * 44;
        const y2 = 56 - Math.cos(angle) * 44;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--text-muted)"
            strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
            opacity={i % 3 === 0 ? 0.55 : 0.3}
          />
        );
      })}

      {/* N / E / S / W */}
      <text
        x="66"
        y="20"
        textAnchor="middle"
        fontSize="8"
        fill="var(--forest)"
        fontFamily="Playfair Display, serif"
        opacity="0.7"
      >
        B
      </text>
      <text
        x="66"
        y="102"
        textAnchor="middle"
        fontSize="8"
        fill="var(--text-muted)"
        fontFamily="Playfair Display, serif"
        opacity="0.5"
      >
        N
      </text>
      <text
        x="20"
        y="59"
        textAnchor="middle"
        fontSize="8"
        fill="var(--text-muted)"
        fontFamily="Playfair Display, serif"
        opacity="0.5"
      >
        T
      </text>
      <text
        x="112"
        y="59"
        textAnchor="middle"
        fontSize="8"
        fill="var(--text-muted)"
        fontFamily="Playfair Display, serif"
        opacity="0.5"
      >
        Đ
      </text>

      {/* drifting needle — rotates around its own center (fill-box),
          so it stays pinned to the pivot dot regardless of coordinates */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={{ rotate: [-8, 10, -6, 8, -8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <polygon
          points="66,26 71,56 66,64 61,56"
          fill="var(--forest)"
          opacity="0.85"
        />
        <polygon
          points="66,86 71,56 66,50 61,56"
          fill="var(--text-muted)"
          opacity="0.5"
        />
      </motion.g>
      <circle cx="66" cy="56" r="4" fill="var(--forest)" />

      {/* small dropped pin, as if set down mid-search */}
      <motion.g
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <path
          d="M104 100c0 6-6 12-6 12s-6-6-6-12a6 6 0 1112 0z"
          fill="var(--forest)"
          opacity="0.18"
        />
        <circle cx="98" cy="100" r="2.2" fill="var(--forest)" opacity="0.4" />
      </motion.g>
    </motion.svg>
  );
}

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(60% 50% at 50% 30%, color-mix(in srgb, var(--forest) 6%, transparent), transparent)",
      }}
    >
      {/* breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--text-muted)",
          marginBottom: "28px",
          letterSpacing: "0.02em",
        }}
      >
        <Home size={12} />
        <span>/</span>
        <span>trang không tồn tại</span>
      </motion.div>

      {/* illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ marginBottom: "20px" }}
      >
        <LostCompass />
      </motion.div>

      {/* headline block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
      >
        <div
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(64px, 14vw, 104px)",
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: "-3px",
            color: "var(--forest)",
            opacity: 0.1,
            userSelect: "none",
            marginBottom: "-18px",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "30px",
            fontWeight: 400,
            color: "var(--forest)",
            margin: "0 0 14px",
          }}
        >
          Bạn đã đi lạc khỏi bản đồ
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            maxWidth: "340px",
            lineHeight: 1.75,
            margin: "0 auto 8px",
          }}
        >
          Trang bạn tìm có thể đã đổi tên, được di chuyển, hoặc chưa từng tồn
          tại.
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            opacity: 0.6,
            letterSpacing: "0.06em",
            margin: "0 auto 36px",
          }}
        >
          MÃ LỖI · 404
        </p>
      </motion.div>

      <div
        style={{
          width: "32px",
          height: "1px",
          background: "var(--border)",
          marginBottom: "32px",
        }}
      />

      {/* primary actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "44px",
        }}
      >
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Link
            to="/"
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <Compass size={15} />
            Khám phá Earthoria
          </Link>
        </motion.div>

        <motion.button
          className="btn-secondary"
          onClick={() => navigate(-1)}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <ArrowLeft size={15} />
          Quay lại
        </motion.button>
      </motion.div>

      {/* quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            opacity: 0.6,
            letterSpacing: "0.08em",
            marginBottom: "14px",
          }}
        >
          HOẶC THỬ NHỮNG LỐI ĐI KHÁC
        </p>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {quickLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-muted)",
                textDecoration: "none",
                borderBottom: "1px solid transparent",
                paddingBottom: "2px",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--forest)";
                e.currentTarget.style.borderColor = "var(--forest)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
