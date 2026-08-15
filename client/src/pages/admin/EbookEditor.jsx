import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ebookService } from "../../services/ebookService";
import api from "../../services/api";
import { QRCodeCanvas } from "qrcode.react";
import "../../components/assets/css/ebookPreview.css";
import {
  Undo2,
  Redo2,
  Plus,
  Image,
  Play,
  Square,
  Eye,
  Folder,
  Layers,
  Palette,
  X,
  ChevronUp,
  ChevronDown,
  Copy,
  Volume2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  Type,
  Sparkles,
  Save,
  Upload,
  Wand2,
  Tag,
  GripVertical,
  Lock,
  Unlock,
  Minus as LineIcon,
  ArrowRight,
  Star,
  Triangle,
  Group,
  Ungroup,
  QrCode,
  Info,
  User,
} from "lucide-react";

const FONTS = [
  { label: "Be Vietnam Pro", value: "'Be Vietnam Pro', system-ui, sans-serif" },
  { label: "Georgia (nghiêm túc)", value: "Georgia, 'Times New Roman', serif" },
  {
    label: "Comic Sans (vui nhộn)",
    value: "'Comic Sans MS', 'Comic Sans', cursive",
  },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier (máy chữ)", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const BASE_PAGE_W = 680;
const BASE_PAGE_H = 440;

const uid = () =>
  `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));
const speechAvailable = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

function fileToResizedDataUrl(file, maxDim = 900, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Không đọc được ảnh"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

function hexToRgb(hex) {
  const clean = (hex || "#ffffff").replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function removeBackgroundByColor(srcUrl, hexColor, tolerancePercent) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let data;
      try {
        data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (err) {
        reject(new Error("CORS"));
        return;
      }
      const [tr, tg, tb] = hexToRgb(hexColor);
      const tol = (tolerancePercent / 100) * 450;
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const dist =
          Math.abs(d[i] - tr) +
          Math.abs(d[i + 1] - tg) +
          Math.abs(d[i + 2] - tb);
        if (dist <= tol) d[i + 3] = 0;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("LOAD"));
    img.src = srcUrl;
  });
}

function splitWords(text) {
  const out = [];
  let idx = 0;
  (text || "").split(" ").forEach((w) => {
    out.push({ word: w, start: idx });
    idx += w.length + 1;
  });
  return out;
}

function wordIndexForCharIndex(words, charIndex) {
  let wIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= charIndex) wIdx = i;
  }
  return wIdx;
}

function speakText(text, { onWord, onEnd } = {}) {
  if (!speechAvailable() || !text || !text.trim()) {
    onEnd && onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const words = splitWords(text);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "vi-VN";
  utter.rate = 0.85;
  if (onWord) {
    utter.onboundary = (ev) => {
      if (ev.charIndex === undefined) return;
      onWord(wordIndexForCharIndex(words, ev.charIndex));
    };
  }
  utter.onend = () => onEnd && onEnd();
  window.speechSynthesis.speak(utter);
}

function defaultTextLayer(overrides = {}) {
  return {
    id: uid(),
    type: "text",
    text: "Nhập chữ...",
    x: BASE_PAGE_W / 2 - 110,
    y: BASE_PAGE_H / 2 - 20,
    width: 220,
    align: "left",
    color: "#1f4d3f",
    bold: false,
    italic: false,
    underline: false,
    fontSize: 24,
    fontFamily: FONTS[0].value,
    strokeColor: "#000000",
    strokeWidth: 0,
    opacity: 100,
    headingLevel: 0,
    height: null,
    verticalAlign: "top",
    locked: false,
    ...overrides,
  };
}

function defaultImageLayer(overrides = {}) {
  return {
    id: uid(),
    type: "image",
    src: "",
    x: BASE_PAGE_W / 2 - 80,
    y: BASE_PAGE_H / 2 - 60,
    width: 160,
    height: 120,
    opacity: 100,
    locked: false,
    ...overrides,
  };
}

function defaultShapeLayer(overrides = {}) {
  return {
    id: uid(),
    type: "shape",
    shapeType: "rect",
    x: BASE_PAGE_W / 2 - 80,
    y: BASE_PAGE_H / 2 - 60,
    width: 160,
    height: 100,
    fill: "#4a9e3f",
    strokeColor: "#1a5c47",
    strokeWidth: 0,
    borderRadius: 12,
    opacity: 100,
    locked: false,
    ...overrides,
  };
}

function defaultQrLayer(overrides = {}) {
  return {
    id: uid(),
    type: "qr",
    linkType: "AR",
    refId: "",
    code: "",
    bookSlug: "",
    label: "",
    x: BASE_PAGE_W / 2 - 60,
    y: BASE_PAGE_H / 2 - 60,
    width: 120,
    height: 120,
    opacity: 100,
    locked: false,
    ...overrides,
  };
}

function qrLayerUrl(layer) {
  if (!layer || !layer.code || !layer.bookSlug) return "";
  const kind = layer.linkType === "GAME" ? "game" : "ar";
  return `${window.location.origin}/${kind}/${layer.bookSlug}/${layer.code}`;
}

function ShapeSvg({ shapeType, fill, strokeColor, strokeWidth }) {
  const sw = strokeWidth || 0;
  if (shapeType === "line") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="2"
          y1="50"
          x2="98"
          y2="50"
          stroke={fill}
          strokeWidth={Math.max(sw, 3)}
        />
      </svg>
    );
  }
  if (shapeType === "arrow") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="2"
          y1="50"
          x2="82"
          y2="50"
          stroke={fill}
          strokeWidth={Math.max(sw, 3)}
        />
        <polygon points="70,35 98,50 70,65" fill={fill} />
      </svg>
    );
  }
  if (shapeType === "star") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,4 62,38 98,38 69,59 80,95 50,73 20,95 31,59 2,38 38,38"
          fill={fill}
          stroke={sw > 0 ? strokeColor : "none"}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (shapeType === "triangle") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,4 96,96 4,96"
          fill={fill}
          stroke={sw > 0 ? strokeColor : "none"}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

function defaultPage(overrides = {}) {
  return {
    id: uid(),
    title: "",
    background: "#fffdf8",
    layers: [],
    ...overrides,
  };
}

function pageNumberBoxStyle(pos) {
  const p = pos || { v: "bottom", h: "center" };
  const style = {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    alignItems:
      p.h === "left" ? "flex-start" : p.h === "right" ? "flex-end" : "center",
    fontFamily: "Georgia, serif",
    fontSize: 12,
    color: "rgba(31,42,36,0.45)",
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 2,
  };
  if (p.v === "top") style.top = 10;
  else style.bottom = 10;
  if (p.h === "left") style.left = 14;
  else if (p.h === "right") style.right = 14;
  else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }
  return style;
}

function PageNumberBadge({ page, number, pos, showTitle }) {
  return (
    <div style={pageNumberBoxStyle(pos)}>
      {showTitle && page?.title ? (
        <span style={{ fontSize: 10, opacity: 0.85, whiteSpace: "nowrap" }}>
          {page.title}
        </span>
      ) : null}
      <span>{number}</span>
    </div>
  );
}

function LayerView({
  layer,
  selected,
  readOnly,
  isReadingThis,
  readingWordIndex,
  fontScale,
  onSelect,
  onDragStart,
  onResizeStart,
  onWordHover,
  onWordLeave,
  onLayerClick,
  onImageDrop,
  onLineHover,
  onLineLeave,
  onAskAI,
}) {
  const wrapStyle = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    opacity: (layer.opacity ?? 100) / 100,
  };
  const isTocLink = readOnly && !!layer.tocTargetPageId;

  const handleClick = (e) => {
    e.stopPropagation();
    if (readOnly) {
      if (layer.type === "qr") {
        const url = qrLayerUrl(layer);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if (layer.tocTargetPageId) {
        onLayerClick && onLayerClick(layer.tocTargetPageId);
      }
      return;
    }
    if (!layer.locked) onSelect(layer.id, e.shiftKey);
  };
  const handleDragStart = (e) => {
    if (!readOnly && !layer.locked) onDragStart(e, layer);
  };

  if (layer.type === "shape") {
    const isVector = ["line", "arrow", "star", "triangle"].includes(
      layer.shapeType,
    );
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={handleDragStart}
        onClick={handleClick}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            outline:
              !readOnly && selected
                ? "2px solid #4a9e3f"
                : "2px solid transparent",
            outlineOffset: 4,
            cursor: readOnly
              ? "default"
              : layer.locked
                ? "not-allowed"
                : "grab",
            touchAction: "none",
            boxShadow:
              !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
          }}
        >
          {isVector ? (
            <ShapeSvg
              shapeType={layer.shapeType}
              fill={layer.fill}
              strokeColor={layer.strokeColor}
              strokeWidth={layer.strokeWidth}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                background: layer.fill,
                border:
                  layer.strokeWidth > 0
                    ? `${layer.strokeWidth}px solid ${layer.strokeColor}`
                    : "none",
                borderRadius:
                  layer.shapeType === "circle" ? "50%" : layer.borderRadius,
              }}
            />
          )}
        </div>
        {!readOnly && selected && !layer.locked && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, layer);
            }}
            className="bb-resize-handle"
            style={{ cursor: "nwse-resize" }}
          />
        )}
      </div>
    );
  }

  if (layer.type === "qr") {
    const qrUrl = qrLayerUrl(layer);
    const clickable = readOnly && !!qrUrl;
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={handleDragStart}
        onClick={handleClick}
      >
        <div
          className={clickable ? "bb-qr-tap bb-qr-pulse" : undefined}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            outline:
              !readOnly && selected
                ? "2px solid #4a9e3f"
                : "2px solid transparent",
            outlineOffset: 4,
            borderRadius: 10,
            overflow: "hidden",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: readOnly
              ? qrUrl
                ? "pointer"
                : "default"
              : layer.locked
                ? "not-allowed"
                : "grab",
            touchAction: "none",
            boxShadow:
              !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
            transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
          }}
        >
          {qrUrl ? (
            <QRCodeCanvas
              value={qrUrl}
              size={Math.max(24, Math.min(layer.width, layer.height) - 14)}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a5c47"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "repeating-linear-gradient(135deg, #eef1ee, #eef1ee 10px, #e5e9e4 10px, #e5e9e4 20px)",
                border: "1.5px dashed #c7d0c9",
                borderRadius: 10,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                color: "#8a978f",
                fontSize: 11,
                textAlign: "center",
                padding: 8,
              }}
            >
              {!readOnly && <QrCode size={18} strokeWidth={1.6} />}
              {readOnly ? "" : "Chưa gắn liên kết AR/Game"}
            </div>
          )}
          {qrUrl && (
            <span
              style={{
                position: "absolute",
                bottom: 3,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.3,
                padding: "1px 6px",
                borderRadius: 6,
                background: "#1a5c47",
                color: "#fff",
                pointerEvents: "none",
              }}
            >
              {layer.linkType === "GAME" ? "GAME" : "AR"}
            </span>
          )}
        </div>
        {!readOnly && selected && !layer.locked && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, layer);
            }}
            className="bb-resize-handle"
            style={{ cursor: "nwse-resize" }}
          />
        )}
      </div>
    );
  }

  if (layer.type === "image") {
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={handleDragStart}
        onClick={handleClick}
        onDragOver={(e) => !readOnly && e.preventDefault()}
        onDrop={(e) =>
          !readOnly && !layer.locked && onImageDrop && onImageDrop(e, layer.id)
        }
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            outline:
              !readOnly && selected
                ? "2px solid #4a9e3f"
                : "2px solid transparent",
            outlineOffset: 4,
            borderRadius: 10,
            overflow: "hidden",
            cursor: readOnly ? "default" : "grab",
            touchAction: "none",
            boxShadow:
              !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
            transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
          }}
        >
          {layer.src ? (
            <img
              src={layer.src}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "repeating-linear-gradient(135deg, #eef1ee, #eef1ee 10px, #e5e9e4 10px, #e5e9e4 20px)",
                border: "1.5px dashed #c7d0c9",
                borderRadius: 10,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                color: "#8a978f",
                fontSize: 12,
                textAlign: "center",
                padding: 8,
              }}
            >
              {!readOnly && <Image size={18} strokeWidth={1.6} />}
              {readOnly ? "" : "Dán link ảnh ở bảng Định dạng"}
            </div>
          )}
        </div>
        {!readOnly && selected && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, layer);
            }}
            className="bb-resize-handle"
            style={{ cursor: "nwse-resize" }}
          />
        )}
      </div>
    );
  }

  const words = (layer.text || "").split(" ");
  const hasFixedHeight = layer.height != null && layer.height > 0;
  const scaledFontSize = (layer.fontSize || 16) * (fontScale || 1);
  const askable = readOnly && !!layer.text?.trim() && !layer.tocTargetPageId;
  return (
    <div
      style={{
        ...wrapStyle,
        width: layer.width,
        height: hasFixedHeight ? layer.height : undefined,
      }}
      onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
      onClick={handleClick}
    >
      <div
        className={askable ? "er-line" : undefined}
        onMouseEnter={
          readOnly ? () => onLineHover && onLineHover(layer) : undefined
        }
        onMouseLeave={readOnly ? () => onLineLeave && onLineLeave() : undefined}
        style={{
          position: "relative",
          padding: "4px 6px",
          borderRadius: 8,
          height: hasFixedHeight ? "100%" : undefined,
          display: hasFixedHeight ? "flex" : undefined,
          flexDirection: hasFixedHeight ? "column" : undefined,
          justifyContent: hasFixedHeight
            ? layer.verticalAlign === "middle"
              ? "center"
              : layer.verticalAlign === "bottom"
                ? "flex-end"
                : "flex-start"
            : undefined,
          boxSizing: "border-box",
          outline:
            !readOnly && selected
              ? "2px solid #4a9e3f"
              : "2px solid transparent",
          outlineOffset: 4,
          cursor: readOnly ? (isTocLink ? "pointer" : "default") : "grab",
          touchAction: "none",
          boxShadow:
            !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
          transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
        }}
      >
        {askable && (
          <button
            type="button"
            className="er-line-badge"
            onClick={(e) => {
              e.stopPropagation();
              onAskAI && onAskAI(layer.text.trim());
            }}
          >
            <Sparkles size={10} /> Hỏi AI
          </button>
        )}
        <div
          style={{
            fontFamily: layer.fontFamily,
            fontSize: scaledFontSize,
            fontWeight: layer.bold ? 700 : 400,
            fontStyle: layer.italic ? "italic" : "normal",
            textDecoration: layer.underline
              ? "underline"
              : isTocLink
                ? "underline dotted"
                : "none",
            color: layer.color,
            textAlign: layer.align || "left",
            WebkitTextStroke:
              layer.strokeWidth > 0
                ? `${layer.strokeWidth}px ${layer.strokeColor}`
                : undefined,
            lineHeight: 1.35,
            wordBreak: "break-word",
          }}
        >
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span
                onMouseEnter={
                  !readOnly
                    ? (e) => {
                        e.stopPropagation();
                        onWordHover({ word: w });
                      }
                    : undefined
                }
                onMouseLeave={!readOnly ? onWordLeave : undefined}
                style={{
                  padding: "1px 2px",
                  borderRadius: 4,
                  cursor: readOnly ? "inherit" : "pointer",
                  background:
                    isReadingThis && readingWordIndex === i
                      ? "rgba(255,196,61,0.55)"
                      : "transparent",
                  transition: "background 0.12s ease",
                }}
              >
                {w}
              </span>
              {i < words.length - 1 ? " " : ""}
            </React.Fragment>
          ))}
        </div>
        {!readOnly && selected && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, layer);
            }}
            className="bb-resize-handle"
            style={{ cursor: hasFixedHeight ? "nwse-resize" : "ew-resize" }}
          />
        )}
      </div>
    </div>
  );
}

export function PreviewOverlay({
  pages,
  startIndex,
  onClose,
  orientation,
  pageNumberPos,
  showTitleWithPageNumber,
  hidePageNumberOnCover,
  bookInfo,
}) {
  const THEMES = {
    forest: { label: "Rừng đêm" },
    dark: { label: "Tối" },
    light: { label: "Sáng" },
    sepia: { label: "Ấm áp" },
  };
  const SPREAD_GAP = 26;

  const PAGE_W = orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
  const PAGE_H = orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;

  const [idx, setIdx] = useState(Math.max(0, Math.min(pages.length - 1, startIndex)));
  const [reading, setReading] = useState(null);
  const [scale, setScale] = useState(1);
  const [theme, setTheme] = useState("forest");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [pageView, setPageView] = useState("single");
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [direction, setDirection] = useState("next");

  const wrapRef = useRef(null);
  const themeBoxRef = useRef(null);
  const lineHoverTimer = useRef(null);

  const toggleFullscreen = () => {
    const el = document.documentElement;
    const request =
      el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (!document.fullscreenElement) {
      request && request.call(el).catch(() => {});
    } else {
      exit && exit.call(document).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      if (document.fullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(
          document,
        );
      }
    };
  }, []);

  const groupStartFor = (i, mode = pageView) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, i));
    if (mode !== "double") return clamped;
    return clamped - (clamped % 2);
  };

  const visiblePages =
    pageView === "double"
      ? [pages[idx], pages[idx + 1]].filter(Boolean)
      : [pages[idx]].filter(Boolean);

  const page = pages[idx];

  const nextGroupStart = (current) => {
    if (pageView !== "double") return Math.min(pages.length - 1, current + 1);
    const n = current + 2;
    return n <= pages.length - 1 ? n : current;
  };
  const prevGroupStart = (current) => {
    if (pageView !== "double") return Math.max(0, current - 1);
    return current >= 2 ? current - 2 : 0;
  };

  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      const spreadCount = visiblePages.length === 2 ? 2 : 1;
      const stageW = spreadCount === 2 ? PAGE_W * 2 + SPREAD_GAP : PAGE_W;
      const w = wrapRef.current.clientWidth - 48;
      const h = wrapRef.current.clientHeight - 48;
      setScale(Math.max(0.28, Math.min(1.3, w / stageW, h / PAGE_H)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PAGE_W, PAGE_H, pageView, idx, pages.length]);

  useEffect(() => {
    return () => {
      if (speechAvailable()) window.speechSynthesis.cancel();
      if (lineHoverTimer.current) clearTimeout(lineHoverTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!themeMenuOpen) return;
    const onDocClick = (e) => {
      if (themeBoxRef.current && !themeBoxRef.current.contains(e.target))
        setThemeMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [themeMenuOpen]);

  const stop = () => {
    if (speechAvailable()) window.speechSynthesis.cancel();
    setReading(null);
  };

  const readSpread = (auto = false) => {
    if (!speechAvailable()) return;
    window.speechSynthesis.cancel();
    const targets = visiblePages.flatMap((p) =>
      (p?.layers || []).filter((l) => l.type === "text" && l.text?.trim()),
    );
    if (!targets.length) {
      setReading(null);
      if (auto) autoAdvance();
      return;
    }
    let i = 0;
    const step = () => {
      if (i >= targets.length) {
        setReading(null);
        if (auto) autoAdvance();
        return;
      }
      const layer = targets[i];
      speakText(layer.text, {
        onWord: (wi) => setReading({ layerId: layer.id, wordIndex: wi }),
        onEnd: () => {
          i += 1;
          step();
        },
      });
    };
    step();
  };

  const autoAdvance = () => {
    setDirection("next");
    setIdx((current) => {
      const next = nextGroupStart(current);
      if (next === current) {
        setAutoPlay(false);
        return current;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!autoPlay) return;
    readSpread(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, idx, pageView]);

  useEffect(() => {
    if (!autoPlay) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const onLineHover = (layer) => {
    if (reading || !speechAvailable() || !layer.text?.trim()) return;
    if (lineHoverTimer.current) clearTimeout(lineHoverTimer.current);
    lineHoverTimer.current = setTimeout(() => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(layer.text);
      utter.lang = "vi-VN";
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }, 260);
  };
  const onLineLeave = () => {
    if (lineHoverTimer.current) {
      clearTimeout(lineHoverTimer.current);
      lineHoverTimer.current = null;
    }
  };

  const askAboutText = (text) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    window.dispatchEvent(
      new CustomEvent("eira:ask", {
        detail: {
          text: `Trong sách mình đang đọc có đoạn: "${clean}". Bạn giải thích/kể thêm giúp mình với nhé.`,
        },
      }),
    );
  };

  const goPrev = () => {
    const target = prevGroupStart(idx);
    if (target === idx) return;
    if (!autoPlay) stop();
    setDirection("prev");
    setIdx(target);
  };
  const goNext = () => {
    const target = nextGroupStart(idx);
    if (target === idx) return;
    if (!autoPlay) stop();
    setDirection("next");
    setIdx(target);
  };
  const goToPageId = (pageId) => {
    const target = pages.findIndex((p) => p.id === pageId);
    if (target === -1) return;
    setAutoPlay(false);
    stop();
    setDirection(target >= idx ? "next" : "prev");
    setIdx(groupStartFor(target));
  };
  const togglePageView = () => {
    setPageView((v) => {
      const next = v === "double" ? "single" : "double";
      setIdx((i) => groupStartFor(i, next));
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") {
        stop();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, pageView, autoPlay]);

  const stageW = visiblePages.length === 2 ? PAGE_W * 2 + SPREAD_GAP : PAGE_W;
  const pageLabel =
    visiblePages.length === 2
      ? `Trang ${idx + 1}–${idx + 2} / ${pages.length}`
      : `Trang ${idx + 1} / ${pages.length}`;
  const canGoNext = nextGroupStart(idx) !== idx;
  const canGoPrev = idx !== 0;

  return (
    <div className={`er-shell er-theme-${theme}`}>
      <style>{`
        .bb-qr-tap { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease; will-change: transform; }
        .bb-qr-tap:hover { transform: scale(1.06); box-shadow: 0 10px 24px rgba(26,92,71,0.28); }
        .bb-qr-tap:active { transform: scale(0.94); transition-duration: 0.08s; }
        .bb-qr-pulse { animation: bb-qr-pulse-ring 2.4s ease-in-out infinite; }
        .bb-qr-pulse:hover { animation-play-state: paused; }
        @keyframes bb-qr-pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,92,71,0.32); }
          50% { box-shadow: 0 0 0 9px rgba(26,92,71,0); }
        }
      `}</style>

      <div className="er-topbar">
        <button
          className="er-icon-btn"
          title="Đóng"
          onClick={() => {
            stop();
            onClose();
          }}
        >
          <X size={18} />
        </button>

        <div className="er-title">
          <span className="er-title-page">{pageLabel}</span>
          {page?.title && <span className="er-title-name">{page.title}</span>}
        </div>

        <div className="er-tools">
          <button
            className={`er-tool-btn ${infoOpen ? "active" : ""}`}
            title="Thông tin sách"
            onClick={() => setInfoOpen((v) => !v)}
          >
            <Info size={15} />
            <span className="er-tool-label">Thông tin</span>
          </button>

          <div className="er-tool-group" ref={themeBoxRef}>
            <button
              className={`er-tool-btn ${themeMenuOpen ? "active" : ""}`}
              title="Đổi màu nền"
              onClick={() => setThemeMenuOpen((v) => !v)}
            >
              <Palette size={15} />
              <span className="er-tool-label">Màu nền</span>
            </button>
            {themeMenuOpen && (
              <div className="er-popover">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    className={`er-swatch ${theme === key ? "active" : ""}`}
                    onClick={() => {
                      setTheme(key);
                      setThemeMenuOpen(false);
                    }}
                  >
                    <span className={`er-swatch-dot er-swatch-dot--${key}`} />
                    <span className="er-swatch-label">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="er-font-group">
            <button
              className="er-tool-btn"
              title="Chữ nhỏ hơn"
              onClick={() =>
                setFontScale((s) => Math.max(0.85, +(s - 0.05).toFixed(2)))
              }
            >
              <Minus size={14} />
            </button>
            <span className="er-font-value">{Math.round(fontScale * 100)}%</span>
            <button
              className="er-tool-btn"
              title="Chữ lớn hơn"
              onClick={() =>
                setFontScale((s) => Math.min(1.35, +(s + 0.05).toFixed(2)))
              }
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            className="er-tool-btn"
            title={pageView === "double" ? "Xem 1 trang" : "Xem 2 trang"}
            onClick={togglePageView}
          >
            <BookOpen size={15} />
            <span className="er-tool-label">
              {pageView === "double" ? "2 trang" : "1 trang"}
            </span>
          </button>

          <button
            className={`er-tool-btn ${autoPlay ? "active" : ""}`}
            title="Tự động đọc cả sách"
            onClick={() => setAutoPlay((v) => !v)}
          >
            {autoPlay ? <Square size={14} /> : <Volume2 size={15} />}
            <span className="er-tool-label">Tự đọc</span>
          </button>

          <button
            className={`er-tool-btn ${isFullscreen ? "active" : ""}`}
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            onClick={toggleFullscreen}
          >
            <Maximize2 size={15} />
            <span className="er-tool-label">Toàn màn hình</span>
          </button>
        </div>
      </div>

      <div ref={wrapRef} className="er-stage">
        <div
          style={{ width: stageW * scale, height: PAGE_H * scale, perspective: 1600 }}
        >
          <div key={idx} className={`er-flip er-flip--${direction}`}>
            <div
              className="er-spread"
              style={{
                width: stageW,
                height: PAGE_H,
                transform: `scale(${scale})`,
                gap: SPREAD_GAP,
              }}
            >
            {visiblePages.map((p, i) => {
              const globalIndex = idx + i;
              return (
                <div
                  key={p.id}
                  className="er-page"
                  style={{ width: PAGE_W, height: PAGE_H, background: p.background }}
                >
                  {p.layers.map((layer) => (
                    <LayerView
                      key={layer.id}
                      layer={layer}
                      selected={false}
                      readOnly
                      fontScale={fontScale}
                      isReadingThis={reading?.layerId === layer.id}
                      readingWordIndex={reading?.wordIndex}
                      onSelect={() => {}}
                      onDragStart={() => {}}
                      onResizeStart={() => {}}
                      onLineHover={onLineHover}
                      onLineLeave={onLineLeave}
                      onAskAI={askAboutText}
                      onLayerClick={goToPageId}
                    />
                  ))}
                  {!(globalIndex === 0 && hidePageNumberOnCover) && (
                    <PageNumberBadge
                      page={p}
                      number={globalIndex + 1}
                      pos={pageNumberPos}
                      showTitle={showTitleWithPageNumber}
                    />
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="er-bottombar">
        <button className="er-nav-btn" onClick={goPrev} disabled={!canGoPrev}>
          <ChevronLeft size={18} />
        </button>
        {reading ? (
          <button
            className="er-read-btn danger"
            onClick={() => {
              setAutoPlay(false);
              stop();
            }}
          >
            <Square size={14} />
            Dừng
          </button>
        ) : (
          <button className="er-read-btn" onClick={() => readSpread(false)}>
            <Play size={14} />
            Đọc trang này
          </button>
        )}
        <button className="er-nav-btn" onClick={goNext} disabled={!canGoNext}>
          <ChevronRight size={18} />
        </button>
      </div>

      {infoOpen && (
        <div className="er-info-backdrop" onClick={() => setInfoOpen(false)}>
          <div className="er-info-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="er-icon-btn er-info-close"
              onClick={() => setInfoOpen(false)}
            >
              <X size={16} />
            </button>
            {bookInfo ? (
              <>
                {bookInfo.coverImage && (
                  <img
                    className="er-info-cover"
                    src={bookInfo.coverImage}
                    alt={bookInfo.title || ""}
                  />
                )}
                <div className="er-info-body">
                  <h2 className="er-info-title">{bookInfo.title}</h2>
                  {bookInfo.authors?.length > 0 && (
                    <div className="er-info-authors">
                      <User size={13} /> {bookInfo.authors.join(", ")}
                    </div>
                  )}
                  {bookInfo.description && (
                    <p className="er-info-desc">{bookInfo.description}</p>
                  )}
                  <div className="er-info-meta">
                    {bookInfo.categoryName && (
                      <span className="er-info-tag">{bookInfo.categoryName}</span>
                    )}
                    {(bookInfo.ageMin || bookInfo.ageMax) && (
                      <span className="er-info-tag">
                        {bookInfo.ageMin && bookInfo.ageMax
                          ? `${bookInfo.ageMin}-${bookInfo.ageMax} tuổi`
                          : bookInfo.ageMin
                            ? `Từ ${bookInfo.ageMin} tuổi`
                            : `Đến ${bookInfo.ageMax} tuổi`}
                      </span>
                    )}
                    {bookInfo.publisher && (
                      <span className="er-info-tag">NXB {bookInfo.publisher}</span>
                    )}
                    {bookInfo.publishYear && (
                      <span className="er-info-tag">{bookInfo.publishYear}</span>
                    )}
                    {bookInfo.pages ? (
                      <span className="er-info-tag">{bookInfo.pages} trang</span>
                    ) : null}
                    {bookInfo.language && (
                      <span className="er-info-tag">
                        {bookInfo.language === "VI" ? "Tiếng Việt" : bookInfo.language}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="er-info-body">
                <h2 className="er-info-title">{page?.title || "Sách điện tử"}</h2>
                <p className="er-info-desc">Chưa có thông tin chi tiết cho sách này.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookBuilder() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const bookIdFromQuery = searchParams.get("bookId");

  const [ebookId, setEbookId] = useState(routeId || null);
  const [bookId, setBookId] = useState(bookIdFromQuery || null);
  const [bookTitle, setBookTitle] = useState("");
  const [ebookTitle, setEbookTitle] = useState("");
  const [orientation, setOrientation] = useState("LANDSCAPE");
  const [loadError, setLoadError] = useState(null);
  const [bookLinkables, setBookLinkables] = useState({
    slug: "",
    arCodes: [],
    games: [],
  });
  const [pageNumberPos, setPageNumberPos] = useState({
    v: "bottom",
    h: "center",
  });
  const [showTitleWithPageNumber, setShowTitleWithPageNumber] = useState(false);
  const [hidePageNumberOnCover, setHidePageNumberOnCover] = useState(false);

  const PAGE_W = orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
  const PAGE_H = orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;

  const [pages, setPages] = useState([
    defaultPage({
      title: "Bìa sách",
      layers: [
        defaultTextLayer({
          text: "Tên sách",
          x: 50,
          y: 40,
          width: 400,
          color: "#1a5c47",
          bold: true,
          fontSize: 40,
          fontFamily: FONTS[1].value,
        }),
      ],
    }),
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [multiIds, setMultiIds] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [reading, setReading] = useState(null);
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [ttsOk, setTtsOk] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [logoError, setLogoError] = useState(false);
  const [, bump] = useState(0);

  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [bgRemoveTolerance, setBgRemoveTolerance] = useState(20);
  const [bgRemoving, setBgRemoving] = useState(false);

  const [dragLayerId, setDragLayerId] = useState(null);
  const [dragOverLayerId, setDragOverLayerId] = useState(null);
  const [dragPageId, setDragPageId] = useState(null);
  const [dragOverPageId, setDragOverPageId] = useState(null);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const lastHoverWord = useRef(null);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const editSnapshotRef = useRef(null);
  const saveTimerRef = useRef(null);
  const clipboardRef = useRef(null);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const ebookIdRef = useRef(ebookId);
  ebookIdRef.current = ebookId;
  const ebookTitleRef = useRef(ebookTitle);
  ebookTitleRef.current = ebookTitle;
  const orientationRef = useRef(orientation);
  orientationRef.current = orientation;
  const pageNumberPosRef = useRef(pageNumberPos);
  pageNumberPosRef.current = pageNumberPos;
  const showTitleWithPageNumberRef = useRef(showTitleWithPageNumber);
  showTitleWithPageNumberRef.current = showTitleWithPageNumber;
  const hidePageNumberOnCoverRef = useRef(hidePageNumberOnCover);
  hidePageNumberOnCoverRef.current = hidePageNumberOnCover;

  const currentPage = pages[pageIndex] || pages[0];

  useEffect(() => setTtsOk(speechAvailable()), []);
  useEffect(() => {
    if (pageIndex > pages.length - 1)
      setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (routeId) {
          const res = await ebookService.getById(routeId);
          const eb = res.data.data;
          if (cancelled) return;
          setEbookId(eb.id);
          setBookId(eb.bookId);
          setBookTitle(eb.book?.title || "");
          setEbookTitle(eb.title || "");
          setOrientation(
            eb.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE",
          );
          if (eb.pageNumberPos && eb.pageNumberPos.v && eb.pageNumberPos.h)
            setPageNumberPos(eb.pageNumberPos);
          if (typeof eb.showTitleWithPageNumber === "boolean")
            setShowTitleWithPageNumber(eb.showTitleWithPageNumber);
          if (typeof eb.hidePageNumberOnCover === "boolean")
            setHidePageNumberOnCover(eb.hidePageNumberOnCover);
          if (Array.isArray(eb.pages) && eb.pages.length) setPages(eb.pages);
        } else if (bookIdFromQuery) {
          try {
            const bookRes = await ebookService.getForBook(bookIdFromQuery);
            if (
              !cancelled &&
              Array.isArray(bookRes.data.data) &&
              bookRes.data.data.length
            ) {
              navigate(`/dashboard/ebooks/${bookRes.data.data[0].id}`, {
                replace: true,
              });
              return;
            }
          } catch (e) {}
          if (!cancelled) setEbookTitle("Sách điện tử mới");
        } else {
          if (!cancelled)
            setLoadError(
              "Chưa chọn sách để gắn nội dung điện tử. Vui lòng quay lại và chọn một sách trước.",
            );
        }
      } catch (e) {
        if (!cancelled)
          setLoadError(
            e?.response?.data?.message || "Không tải được sách điện tử.",
          );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId, bookIdFromQuery]);

  useEffect(() => {
    if (!bookId) {
      setBookLinkables({ slug: "", arCodes: [], games: [] });
      return;
    }
    let cancelled = false;
    api
      .get(`/admin/products/${bookId}`)
      .then((res) => {
        if (cancelled) return;
        const b = res.data.data || {};
        setBookLinkables({
          slug: b.slug || "",
          arCodes: b.arCodes || [],
          games: b.games || [],
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const persist = async ({ silent } = {}) => {
    if (loadError) return;
    if (!ebookId && !bookId) return;
    if (!silent) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }
    setSaveStatus("saving");
    try {
      const payload = {
        title:
          (ebookTitleRef.current || "Sách điện tử mới").trim() ||
          "Sách điện tử mới",
        pages: pagesRef.current,
        orientation: orientationRef.current,
        pageNumberPos: pageNumberPosRef.current,
        showTitleWithPageNumber: showTitleWithPageNumberRef.current,
        hidePageNumberOnCover: hidePageNumberOnCoverRef.current,
      };
      if (ebookIdRef.current) {
        await ebookService.update(ebookIdRef.current, payload);
      } else {
        const res = await ebookService.create(bookId, payload);
        const created = res.data.data;
        ebookIdRef.current = created.id;
        setEbookId(created.id);
        navigate(`/dashboard/ebooks/${created.id}`, { replace: true });
      }
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      toast.error(
        e?.response?.data?.message || "Lưu thất bại, vui lòng thử lại.",
      );
    }
  };

  const saveNow = () => persist();

  useEffect(() => {
    if (!loaded || loadError) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persist({ silent: true });
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [
    pages,
    ebookTitle,
    orientation,
    pageNumberPos,
    showTitleWithPageNumber,
    hidePageNumberOnCover,
    loaded,
    loadError,
  ]);

  useEffect(() => {
    if (!autoFit) return;
    const measure = () => {
      if (!wrapRef.current) return;
      setScale(Math.min(1, wrapRef.current.clientWidth / PAGE_W));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [autoFit]);

  const zoomIn = () => {
    setAutoFit(false);
    setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)));
  };
  const zoomOut = () => {
    setAutoFit(false);
    setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)));
  };
  const zoomFit = () => setAutoFit(true);

  const selectLayer = (id, additive) => {
    if (additive) {
      setSelectedId(null);
      setMultiIds((prev) => {
        const base = prev.length ? prev : selectedId ? [selectedId] : [];
        return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      });
      setActivePanel("format");
      return;
    }
    setMultiIds([]);
    setSelectedId(id);
    if (id) setActivePanel("format");
  };
  const toggleRailPanel = (key) =>
    setActivePanel((prev) => (prev === key ? null : key));

  const pushHistory = (snapshotPages) => {
    pastRef.current.push(snapshotPages);
    if (pastRef.current.length > 60) pastRef.current.shift();
    futureRef.current = [];
    bump((n) => n + 1);
  };
  const setPagesCommit = (updater) =>
    setPages((prev) => {
      pushHistory(clone(prev));
      return updater(prev);
    });
  const setPagesLive = (updater) => setPages((prev) => updater(prev));

  const beginEdit = () => {
    editSnapshotRef.current = clone(pages);
  };
  const endEdit = () => {
    if (editSnapshotRef.current) {
      pushHistory(editSnapshotRef.current);
      editSnapshotRef.current = null;
    }
  };

  const undo = () => {
    if (pastRef.current.length === 0) return;
    const prevSnap = pastRef.current.pop();
    futureRef.current.push(clone(pages));
    setPages(prevSnap);
    setSelectedId(null);
    bump((n) => n + 1);
  };
  const redo = () => {
    if (futureRef.current.length === 0) return;
    const nextSnap = futureRef.current.pop();
    pastRef.current.push(clone(pages));
    setPages(nextSnap);
    setSelectedId(null);
    bump((n) => n + 1);
  };

  const updateLayer = (id, patch, opts = {}) => {
    const updater = (prev) =>
      prev.map((p, i) =>
        i === pageIndex
          ? {
              ...p,
              layers: p.layers.map((l) =>
                l.id === id ? { ...l, ...patch } : l,
              ),
            }
          : p,
      );
    opts.commit ? setPagesCommit(updater) : setPagesLive(updater);
  };

  const addTextLayer = () => {
    const layer = defaultTextLayer();
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    );
    selectLayer(layer.id);
  };
  const addImageLayer = () => {
    const layer = defaultImageLayer();
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    );
    selectLayer(layer.id);
  };
  const addShapeLayer = () => {
    const layer = defaultShapeLayer();
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    );
    selectLayer(layer.id);
  };
  const addQrLayer = (linkType, item) => {
    const layer = defaultQrLayer({
      linkType,
      refId: item.id,
      code: item.code,
      bookSlug: bookLinkables.slug,
      label: linkType === "GAME" ? item.title : item.label,
    });
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    );
    selectLayer(layer.id);
    setActivePanel("format");
  };
  const removeLayer = (id) => {
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex
          ? { ...p, layers: p.layers.filter((l) => l.id !== id) }
          : p,
      ),
    );
    if (selectedId === id) setSelectedId(null);
  };
  const duplicateLayer = (id) => {
    const layer = currentPage.layers.find((l) => l.id === id);
    if (!layer) return;
    const copy = {
      ...clone(layer),
      id: uid(),
      x: layer.x + 16,
      y: layer.y + 16,
    };
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, copy] } : p,
      ),
    );
    selectLayer(copy.id);
  };

  const applyImageFile = async (file, layerId) => {
    if (!file || !layerId || !file.type?.startsWith("image/")) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      beginEdit();
      updateLayer(layerId, { src: dataUrl });
      endEdit();
    } catch (err) {
      toast.error(err?.message || "Không tải được ảnh lên, vui lòng thử lại.");
    }
  };
  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !selectedId) return;
    applyImageFile(file, selectedId);
  };
  const handleImageDropOnLayer = (e, layerId) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) applyImageFile(file, layerId);
  };

  const handleRemoveBackground = async () => {
    if (!selectedId || bgRemoving) return;
    const layer = currentPage.layers.find((l) => l.id === selectedId);
    if (!layer || !layer.src) return;
    setBgRemoving(true);
    try {
      const result = await removeBackgroundByColor(
        layer.src,
        bgRemoveColor,
        bgRemoveTolerance,
      );
      beginEdit();
      updateLayer(selectedId, { src: result });
      endEdit();
    } catch (err) {
      if (err?.message === "CORS") {
        toast.error(
          "Ảnh từ link ngoài không cho phép xoá nền. Hãy tải ảnh lên từ máy rồi thử lại.",
        );
      } else {
        toast.error("Không xoá được nền ảnh, vui lòng thử lại.");
      }
    } finally {
      setBgRemoving(false);
    }
  };
  const moveLayer = (id, dir) => {
    setPagesCommit((prev) =>
      prev.map((p, i) => {
        if (i !== pageIndex) return p;
        const idx = p.layers.findIndex((l) => l.id === id);
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= p.layers.length) return p;
        const copy = [...p.layers];
        const [item] = copy.splice(idx, 1);
        copy.splice(target, 0, item);
        return { ...p, layers: copy };
      }),
    );
  };

  const reorderLayer = (draggedId, targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setPagesCommit((prev) =>
      prev.map((p, i) => {
        if (i !== pageIndex) return p;
        const layersArr = [...p.layers];
        const fromIdx = layersArr.findIndex((l) => l.id === draggedId);
        const toIdx = layersArr.findIndex((l) => l.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return p;
        const [item] = layersArr.splice(fromIdx, 1);
        const insertAt = fromIdx < toIdx ? toIdx : toIdx;
        layersArr.splice(insertAt, 0, item);
        return { ...p, layers: layersArr };
      }),
    );
  };

  const addPage = () => {
    const page = defaultPage();
    setPagesCommit((prev) => {
      const copy = [...prev];
      copy.splice(pageIndex + 1, 0, page);
      return copy;
    });
    setPageIndex(pageIndex + 1);
    setSelectedId(null);
    setActivePanel("page");
  };
  const duplicatePage = () => {
    const copy = {
      ...clone(currentPage),
      id: uid(),
      layers: currentPage.layers.map((l) => ({ ...l, id: uid() })),
    };
    setPagesCommit((prev) => {
      const arr = [...prev];
      arr.splice(pageIndex + 1, 0, copy);
      return arr;
    });
    setPageIndex(pageIndex + 1);
    setSelectedId(null);
  };
  const deletePage = () => {
    if (pages.length <= 1) return;
    setPagesCommit((prev) => prev.filter((_, i) => i !== pageIndex));
    setPageIndex(Math.max(0, pageIndex - 1));
    setSelectedId(null);
  };
  const movePage = (dir) => {
    const target = pageIndex + dir;
    if (target < 0 || target >= pages.length) return;
    setPagesCommit((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(pageIndex, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setPageIndex(target);
  };
  const reorderPages = (draggedId, targetId) => {
    if (!draggedId || draggedId === targetId) return;
    let newIndex = pageIndex;
    setPagesCommit((prev) => {
      const copy = [...prev];
      const fromIdx = copy.findIndex((p) => p.id === draggedId);
      const toIdx = copy.findIndex((p) => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const currentId = copy[pageIndex]?.id;
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      newIndex = copy.findIndex((p) => p.id === currentId);
      return copy;
    });
    setPageIndex((i) => (newIndex >= 0 ? newIndex : i));
  };
  const setPageBackground = (color) =>
    setPagesLive((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, background: color } : p)),
    );
  const setPageTitle = (title) =>
    setPagesLive((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, title } : p)),
    );

  const changeOrientation = (next) => {
    if (next === orientation) return;
    const oldW = PAGE_W,
      oldH = PAGE_H;
    const newW = next === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
    const newH = next === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;
    const rx = newW / oldW,
      ry = newH / oldH;
    setPagesCommit((prev) =>
      prev.map((p) => ({
        ...p,
        layers: p.layers.map((l) => ({
          ...l,
          x: l.x * rx,
          y: l.y * ry,
          width: l.width * rx,
          ...(l.type === "image" || l.type === "qr"
            ? { height: l.height * ry }
            : {}),
        })),
      })),
    );
    setOrientation(next);
  };

  const generateToc = () => {
    const entries = [];
    pages.forEach((p, i) => {
      if (p.isToc) return;
      p.layers.forEach((l) => {
        if (
          l.type === "text" &&
          l.headingLevel > 0 &&
          l.text &&
          l.text.trim()
        ) {
          entries.push({
            text: l.text.trim(),
            level: l.headingLevel,
            pageId: p.id,
            pageNumber: i + 1,
          });
        }
      });
    });

    if (entries.length === 0) {
      toast.error(
        "Chưa có tiêu đề mục nào. Hãy vào bảng Định dạng, chọn một dòng chữ và đánh dấu là tiêu đề mục trước.",
      );
      return;
    }

    const layers = [
      defaultTextLayer({
        text: "Mục lục",
        x: 40,
        y: 26,
        width: PAGE_W - 80,
        fontSize: 32,
        bold: true,
        color: "#1a5c47",
        fontFamily: FONTS[1].value,
        align: "center",
        headingLevel: 0,
      }),
    ];
    let y = 84;
    entries.forEach((entry) => {
      const indent = (entry.level - 1) * 26;
      const fontSize = entry.level === 1 ? 18 : entry.level === 2 ? 15 : 13;
      layers.push(
        defaultTextLayer({
          text: `${entry.text}  .....  ${entry.pageNumber}`,
          x: 40 + indent,
          y,
          width: PAGE_W - 80 - indent,
          fontSize,
          bold: entry.level === 1,
          color: "#2c3b34",
          align: "left",
          headingLevel: 0,
          tocTargetPageId: entry.pageId,
        }),
      );
      y += fontSize + 16;
    });

    setPagesCommit((prev) => {
      const existingIdx = prev.findIndex((p) => p.isToc);
      const tocPage = defaultPage({
        title: "Mục lục",
        background: "#fffdf8",
        isToc: true,
        layers,
      });
      const copy = [...prev];
      if (existingIdx !== -1) {
        copy[existingIdx] = { ...tocPage, id: prev[existingIdx].id };
      } else {
        copy.splice(1, 0, tocPage);
      }
      return copy;
    });
    setActivePanel(null);
    toast.success("Đã tạo / cập nhật mục lục.");
  };

  const exportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );

      const pdf = new jsPDF({
        orientation: PAGE_W >= PAGE_H ? "landscape" : "portrait",
        unit: "px",
        format: [PAGE_W, PAGE_H],
      });

      for (let i = 0; i < pages.length; i++) {
        const node = document.getElementById(`bb-export-page-${i}`);
        if (!node) continue;
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: pages[i].background || "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0)
          pdf.addPage(
            [PAGE_W, PAGE_H],
            PAGE_W >= PAGE_H ? "landscape" : "portrait",
          );
        pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W, PAGE_H);
      }

      pdf.save(
        `${(ebookTitle || "sach-dien-tu").trim() || "sach-dien-tu"}.pdf`,
      );
    } catch (e) {
      toast.error("Xuất PDF thất bại, vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const onLayerDragStart = (e, layer) => {
    e.stopPropagation();
    const isGroupDrag = multiIds.includes(layer.id) && multiIds.length > 1;
    if (!isGroupDrag) selectLayer(layer.id);
    beginEdit();
    const rect = canvasRef.current.getBoundingClientRect();
    const groupIds = isGroupDrag
      ? multiIds.filter(
          (id) => !currentPage.layers.find((l) => l.id === id)?.locked,
        )
      : [layer.id];
    const startPositions = {};
    currentPage.layers.forEach((l) => {
      if (groupIds.includes(l.id)) startPositions[l.id] = { x: l.x, y: l.y };
    });
    setDragging({
      id: layer.id,
      groupIds,
      startPositions,
      offsetX: (e.clientX - rect.left) / scale - layer.x,
      offsetY: (e.clientY - rect.top) / scale - layer.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const layerMeta = currentPage.layers.find((l) => l.id === dragging.id);
    const isGroup = dragging.groupIds && dragging.groupIds.length > 1;
    const onMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) / scale - dragging.offsetX;
      let y = (e.clientY - rect.top) / scale - dragging.offsetY;
      let gx = false,
        gy = false;
      if (layerMeta && !isGroup) {
        const w = layerMeta.width || 0;
        const centerX = x + w / 2;
        if (Math.abs(centerX - PAGE_W / 2) < 6) {
          x = PAGE_W / 2 - w / 2;
          gx = true;
        }
        if (layerMeta.type === "image") {
          const h = layerMeta.height || 0;
          const centerY = y + h / 2;
          if (Math.abs(centerY - PAGE_H / 2) < 6) {
            y = PAGE_H / 2 - h / 2;
            gy = true;
          }
        }
      }
      setGuides({ x: gx, y: gy });
      x = Math.max(-60, Math.min(x, PAGE_W - 20));
      y = Math.max(-20, Math.min(y, PAGE_H - 10));
      if (isGroup) {
        const baseStart = dragging.startPositions[dragging.id];
        const dx = x - baseStart.x;
        const dy = y - baseStart.y;
        setPagesLive((prev) =>
          prev.map((p, i) =>
            i === pageIndex
              ? {
                  ...p,
                  layers: p.layers.map((l) =>
                    dragging.groupIds.includes(l.id)
                      ? {
                          ...l,
                          x: dragging.startPositions[l.id].x + dx,
                          y: dragging.startPositions[l.id].y + dy,
                        }
                      : l,
                  ),
                }
              : p,
          ),
        );
      } else {
        updateLayer(dragging.id, { x, y });
      }
    };
    const onUp = () => {
      setDragging(null);
      setGuides({ x: false, y: false });
      endEdit();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, scale]);

  const onLayerResizeStart = (e, layer) => {
    e.stopPropagation();
    beginEdit();
    setResizing({
      id: layer.id,
      type: layer.type,
      hasHeight: layer.height != null,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startW: layer.width,
      startH: layer.height || 0,
    });
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const dx = (e.clientX - resizing.startClientX) / scale;
      const dy = (e.clientY - resizing.startClientY) / scale;
      if (resizing.type === "image" || resizing.type === "shape") {
        updateLayer(resizing.id, {
          width: Math.max(30, resizing.startW + dx),
          height: Math.max(30, resizing.startH + dy),
        });
      } else if (resizing.type === "text" && resizing.hasHeight) {
        updateLayer(resizing.id, {
          width: Math.max(60, resizing.startW + dx),
          height: Math.max(30, resizing.startH + dy),
        });
      } else {
        updateLayer(resizing.id, { width: Math.max(60, resizing.startW + dx) });
      }
    };
    const onUp = () => {
      setResizing(null);
      endEdit();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizing, scale]);

  const removeLayers = (ids) => {
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex
          ? { ...p, layers: p.layers.filter((l) => !ids.includes(l.id)) }
          : p,
      ),
    );
    setSelectedId(null);
    setMultiIds([]);
  };
  const duplicateLayers = (ids) => {
    const copies = currentPage.layers
      .filter((l) => ids.includes(l.id))
      .map((l) => ({ ...clone(l), id: uid(), x: l.x + 16, y: l.y + 16 }));
    if (!copies.length) return;
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, ...copies] } : p,
      ),
    );
    if (copies.length === 1) {
      setMultiIds([]);
      selectLayer(copies[0].id);
    } else {
      setSelectedId(null);
      setMultiIds(copies.map((c) => c.id));
      setActivePanel("layers");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const meta = e.ctrlKey || e.metaKey;
      const activeIds = multiIds.length
        ? multiIds
        : selectedId
          ? [selectedId]
          : [];

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        return;
      }

      if (typing) return;

      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const ids = currentPage.layers.map((l) => l.id);
        setSelectedId(null);
        setMultiIds(ids);
        if (ids.length) setActivePanel("layers");
        return;
      }
      if (meta && e.key.toLowerCase() === "c" && activeIds.length) {
        e.preventDefault();
        clipboardRef.current = currentPage.layers
          .filter((l) => activeIds.includes(l.id))
          .map((l) => clone(l));
        return;
      }
      if (
        meta &&
        e.key.toLowerCase() === "v" &&
        clipboardRef.current &&
        clipboardRef.current.length
      ) {
        e.preventDefault();
        const pasted = clipboardRef.current.map((l) => ({
          ...clone(l),
          id: uid(),
          x: l.x + 20,
          y: l.y + 20,
        }));
        setPagesCommit((prev) =>
          prev.map((p, i) =>
            i === pageIndex ? { ...p, layers: [...p.layers, ...pasted] } : p,
          ),
        );
        if (pasted.length === 1) {
          setMultiIds([]);
          selectLayer(pasted[0].id);
        } else {
          setSelectedId(null);
          setMultiIds(pasted.map((p2) => p2.id));
          setActivePanel("layers");
        }
        return;
      }
      const movableIds = activeIds.filter(
        (id) => !currentPage.layers.find((l) => l.id === id)?.locked,
      );
      if ((e.key === "Delete" || e.key === "Backspace") && movableIds.length) {
        e.preventDefault();
        removeLayers(movableIds);
        return;
      }
      if (meta && e.key.toLowerCase() === "d" && activeIds.length) {
        e.preventDefault();
        duplicateLayers(activeIds);
        return;
      }
      if (e.key === "Escape" && (selectedId || multiIds.length)) {
        setSelectedId(null);
        setMultiIds([]);
        return;
      }
      if (
        movableIds.length &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setPagesCommit((prev) =>
          prev.map((p, i) =>
            i === pageIndex
              ? {
                  ...p,
                  layers: p.layers.map((l) =>
                    movableIds.includes(l.id)
                      ? { ...l, x: l.x + dx, y: l.y + dy }
                      : l,
                  ),
                }
              : p,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, multiIds, pages, pageIndex]);

  const onWordHover = (wordObj) => {
    if (!speechAvailable() || !wordObj.word.trim()) return;
    if (lastHoverWord.current === wordObj.word) return;
    lastHoverWord.current = wordObj.word;
    window.speechSynthesis.cancel();
    setReading(null);
    const utter = new SpeechSynthesisUtterance(wordObj.word);
    utter.lang = "vi-VN";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };
  const onWordLeave = () => {
    lastHoverWord.current = null;
  };

  const readLayer = (layer) => {
    speakText(layer.text, {
      onWord: (idx) => setReading({ layerId: layer.id, wordIndex: idx }),
      onEnd: () => setReading(null),
    });
  };

  const readPage = () => {
    if (!speechAvailable()) return;
    window.speechSynthesis.cancel();
    const textLayers = currentPage.layers.filter(
      (l) => l.type === "text" && l.text.trim(),
    );
    let i = 0;
    const next = () => {
      if (i >= textLayers.length) {
        setReading(null);
        return;
      }
      const layer = textLayers[i];
      speakText(layer.text, {
        onWord: (idx) => setReading({ layerId: layer.id, wordIndex: idx }),
        onEnd: () => {
          i += 1;
          next();
        },
      });
    };
    next();
  };

  const stopReading = () => {
    if (speechAvailable()) window.speechSynthesis.cancel();
    setReading(null);
  };

  const selected = currentPage.layers.find((l) => l.id === selectedId) || null;
  const layersFrontFirst = [...currentPage.layers].reverse();

  if (loadError) {
    return (
      <div
        style={{
          fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
          minHeight: "100vh",
          background: "#f7f4ee",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 24,
          textAlign: "center",
        }}
      >
        <BookOpen size={32} color="#4a9e3f" />
        <p style={{ color: "#3a4a42", maxWidth: 420 }}>{loadError}</p>
        <button
          onClick={() => navigate("/dashboard/ebooks")}
          style={{
            background: "#1a5c47",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Quay lại danh sách sách điện tử
        </button>
      </div>
    );
  }

  return (
    <div className="bb-root">
      <style>{`
        * { box-sizing: border-box; }
        .bb-root { font-family: 'Be Vietnam Pro', system-ui, sans-serif; background: #f7f4ee; color: #1f2a24; min-height: 100vh; padding: 18px; }
        .bb-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 4px; }
        .bb-brand { display: flex; align-items: center; gap: 10px; }
        .bb-brand-mark { height: 40px; width: auto; max-width: 220px; object-fit: contain; flex-shrink: 0; }
        .bb-brand-mark-fallback { width: 38px; height: 38px; border-radius: 9px; background: linear-gradient(135deg, #1a5c47, #4a9e3f); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(26,92,71,0.28); }
        .bb-title { font-family: Georgia, serif; font-size: 19px; font-weight: 700; color: #14332a; margin: 0; display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; line-height: 1.25; }
        .bb-title em { color: #4a9e3f; font-style: normal; }
        .bb-save-status { font-family: 'Be Vietnam Pro', system-ui, sans-serif; font-size: 11.5px; font-weight: 600; color: #6b7a72; display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; white-space: nowrap; }
        .bb-save-dot { width: 6px; height: 6px; border-radius: 50%; background: #b7bfb9; }
        .bb-save-dot.ok { background: #4a9e3f; box-shadow: 0 0 0 3px rgba(74,158,63,0.18); }
        .bb-save-dot.busy { background: #e0a83f; animation: bb-pulse 1s ease-in-out infinite; }
        .bb-save-dot.error, .bb-save-status.error { background: #d94f4f; }
        @keyframes bb-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .bb-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: #fff; padding: 6px; border-radius: 14px; box-shadow: 0 2px 10px rgba(20,51,42,0.06); border: 1px solid rgba(20,51,42,0.06); flex: 0 0 auto; }
        .bb-divider-v { width: 1px; align-self: stretch; background: rgba(20,51,42,0.10); margin: 2px 2px; }

        .bb-meta-bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: #fff; border-radius: 14px; padding: 10px 14px; margin: 12px 0; box-shadow: 0 2px 10px rgba(20,51,42,0.06); border: 1px solid rgba(20,51,42,0.06); }
        .bb-meta-field { display: flex; flex-direction: column; gap: 4px; flex: 1 1 320px; max-width: 640px; }
        .bb-meta-field label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #8a978f; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .bb-meta-book-tag { font-size: 10.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: #4a9e3f; }
        .bb-meta-input-row { display: flex; align-items: center; gap: 10px; }
        .bb-ebook-title-input { font-family: 'Be Vietnam Pro', system-ui, sans-serif; font-size: 13px; border: 1px solid #dde4de; border-radius: 9px; padding: 8px 10px; width: 100%; flex: 1 1 auto; min-width: 0; color: #14332a; background: #fbfaf7; transition: border-color 0.12s ease, box-shadow 0.12s ease; }
        .bb-ebook-title-input:focus { outline: none; border-color: #4a9e3f; box-shadow: 0 0 0 3px rgba(74,158,63,0.14); background: #fff; }
        .bb-meta-price-btn { flex: 0 0 auto; margin-left: auto; }

        .bb-btn { border: 1px solid rgba(20,51,42,0.14); background: #fff; color: #14332a; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 10px; cursor: pointer; transition: background 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease, border-color 0.15s ease; display: inline-flex; align-items: center; gap: 6px; }
        .bb-btn:hover { background: #eef6ec; border-color: rgba(74,158,63,0.35); }
        .bb-btn:active { transform: scale(0.96); }
        .bb-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
        .bb-btn:disabled:hover { background: #fff; border-color: rgba(20,51,42,0.14); }
        .bb-btn-primary { background: linear-gradient(135deg, #1f6c53, #1a5c47); color: #fff; border-color: #1a5c47; box-shadow: 0 3px 10px rgba(26,92,71,0.28); }
        .bb-btn-primary:hover { background: linear-gradient(135deg, #226f56, #14483a); box-shadow: 0 4px 14px rgba(26,92,71,0.36); }
        .bb-btn-danger { background: #fff; color: #b3432f; border-color: rgba(179,67,47,0.3); }
        .bb-btn-danger:hover { background: #fdf1ee; border-color: rgba(179,67,47,0.5); }
        .bb-btn-ghost { background: rgba(255,255,255,0.10); color: #fff; border-color: rgba(255,255,255,0.28); backdrop-filter: blur(6px); }
        .bb-btn-ghost:hover { background: rgba(255,255,255,0.20); }
        .bb-btn-icon { padding: 8px 10px; }
        .bb-btn.active { background: linear-gradient(135deg, #55ac48, #4a9e3f); color: #fff; border-color: #4a9e3f; box-shadow: 0 2px 8px rgba(74,158,63,0.32); }
        .bb-current-page-label { font-size: 12px; color: #6b7a72; margin: 10px 2px 10px; display: flex; align-items: center; gap: 6px; }
        .bb-current-page-label strong { color: #14332a; }

        .bb-pages-strip { display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin-bottom: 14px; background: #fff; border-radius: 16px; box-shadow: 0 2px 10px rgba(20,51,42,0.06); border: 1px solid rgba(20,51,42,0.06); }
        .bb-pages-strip-scroll { display: flex; align-items: flex-start; gap: 12px; overflow-x: auto; overflow-y: hidden; flex: 1 1 auto; min-width: 0; padding: 2px 2px 4px; }
        .bb-page-item { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .bb-page-thumb { width: 60px; height: 42px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #45524b; position: relative; box-shadow: 0 2px 6px rgba(20,51,42,0.10); transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease; }
        .bb-page-thumb:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(20,51,42,0.16); }
        .bb-page-thumb.active { border-color: #4a9e3f; box-shadow: 0 0 0 3px rgba(74,158,63,0.20), 0 4px 10px rgba(20,51,42,0.14); }
        .bb-page-thumb.drag-over { border-color: #4a9e3f; transform: translateY(-3px); }
        .bb-page-thumb.dragging-self { opacity: 0.4; }
        .bb-page-thumb::after { content: ""; position: absolute; top: 3px; right: 3px; width: 8px; height: 8px; border-radius: 2px 0 6px 0; background: rgba(20,51,42,0.08); }
        .bb-page-title-input { width: 68px; font-size: 10px; text-align: center; border: none; background: transparent; color: #6b7a72; padding: 1px 0; border-bottom: 1px dashed transparent; }
        .bb-page-title-input:focus { outline: none; border-bottom-color: #4a9e3f; }
        .bb-page-strip-actions { display: inline-flex; align-items: center; justify-content: center; gap: 2px; flex: 0 0 auto; }
        .bb-pill-btn { width: 34px; min-width: 34px; height: 34px; padding: 0; border-radius: 9px; border: 1px solid transparent; background: transparent; color: #45524b; cursor: pointer; display: flex; align-items: center; justify-content: center; flex: 0 0 34px; transition: background 0.14s ease, color 0.14s ease, transform 0.08s ease; box-sizing: border-box; }
        .bb-pill-btn svg { display: block; }
        .bb-pill-btn:hover { background: #eef6ec; color: #1a5c47; }
        .bb-pill-btn:active { transform: scale(0.92); }
        .bb-pill-btn:disabled { opacity: 0.32; cursor: not-allowed; }
        .bb-pill-btn:disabled:hover { background: transparent; color: #45524b; }
        .bb-pill-sep { width: 1px; height: 18px; background: rgba(20,51,42,0.12); margin: 0 4px; flex-shrink: 0; }
        .bb-strip-divider { width: 1px; align-self: stretch; background: rgba(20,51,42,0.08); flex: 0 0 auto; }
        .bb-qr-pick-btn { width: 100%; flex-direction: column; align-items: flex-start; gap: 3px; padding: 10px 12px; margin-bottom: 6px; text-align: left; }
        .bb-qr-pick-label { display: flex; align-items: center; gap: 6px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bb-qr-pick-code { width: 100%; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 11px; font-weight: 400; color: #6b7a72; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .bb-workspace { position: relative; display: flex; border-radius: 18px; overflow: hidden; background: #eae7dd; border: 1px solid rgba(20,51,42,0.10); box-shadow: 0 16px 40px rgba(20,51,42,0.12); min-height: 560px; }
        .bb-rail { flex: 0 0 64px; background: #fff; border-right: 1px solid rgba(20,51,42,0.08); display: flex; flex-direction: column; align-items: center; padding: 14px 0; gap: 10px; z-index: 6; }
        .bb-rail-btn { width: 46px; height: 46px; border-radius: 12px; border: none; background: transparent; cursor: pointer; font-size: 17px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7a72; gap: 3px; transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease; }
        .bb-rail-btn span { font-size: 8px; font-weight: 700; letter-spacing: 0.02em; }
        .bb-rail-btn:hover { background: #f4f1ea; transform: translateY(-1px); }
        .bb-rail-btn.active { background: linear-gradient(160deg, #eef6ec, #e2f2de); color: #1a5c47; box-shadow: inset 0 0 0 1px rgba(74,158,63,0.25); }
        .bb-rail-sep { width: 30px; height: 1px; background: rgba(20,51,42,0.10); margin: 2px 0; }

        .bb-flyout { position: absolute; left: 64px; top: 0; bottom: 0; width: 290px; background: #fff; border-right: 1px solid rgba(20,51,42,0.08); box-shadow: 10px 0 30px rgba(0,0,0,0.10); z-index: 5; padding: 18px; overflow-y: auto; animation: bb-slide-in 0.16s ease; }
        @keyframes bb-slide-in { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .bb-flyout-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(20,51,42,0.08); }
        .bb-flyout-head h3 { margin: 0; font-size: 12.5px; letter-spacing: 0.05em; text-transform: uppercase; color: #14332a; font-weight: 800; }
        .bb-flyout-close { border: none; background: transparent; cursor: pointer; color: #8a978f; font-size: 15px; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.12s ease; }
        .bb-flyout-close:hover { background: #f4f1ea; color: #14332a; }

        .bb-canvas-area { flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 16px; }
        .bb-zoom-bar { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
        .bb-zoom-bar span { font-size: 12px; color: #6b7a72; min-width: 42px; text-align: center; font-weight: 600; }
        .bb-canvas-frame { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; background-image: radial-gradient(circle, rgba(20,51,42,0.06) 1px, transparent 1px); background-size: 18px 18px; border-radius: 14px; }

        .bb-layer-row { display: flex; align-items: center; gap: 4px; padding: 7px 8px; border-radius: 9px; cursor: grab; font-size: 13px; transition: background 0.12s ease, box-shadow 0.12s ease; border: 1.5px solid transparent; }
        .bb-layer-row:active { cursor: grabbing; }
        .bb-layer-row.selected { background: #eef6ec; box-shadow: inset 0 0 0 1px rgba(74,158,63,0.3); }
        .bb-layer-row:hover { background: #f4f1ea; }
        .bb-layer-row.drag-over { border-color: #4a9e3f; background: #e2f2de; }
        .bb-layer-row.dragging-self { opacity: 0.4; }
        .bb-drag-handle { color: #b7bfb9; flex-shrink: 0; display: flex; align-items: center; }
        .bb-heading-badge { font-size: 9px; font-weight: 800; color: #1a5c47; background: #e2f2de; border-radius: 4px; padding: 1px 5px; flex-shrink: 0; }
        .bb-layer-type { font-size: 11px; color: #8a978f; width: 18px; text-align: center; flex-shrink: 0; display: flex; align-items: center; }
        .bb-layer-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bb-mini-btn { border: none; background: transparent; color: #6b7a72; cursor: pointer; font-size: 12px; width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 0.12s ease, color 0.12s ease; }
        .bb-mini-btn:hover { background: rgba(20,51,42,0.08); color: #14332a; }

        .bb-field { margin-bottom: 14px; }
        .bb-field label { display: block; font-size: 12px; font-weight: 700; color: #45524b; margin-bottom: 6px; }
        .bb-field input[type="text"], .bb-field textarea, .bb-field select { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 9px; border: 1px solid rgba(20,51,42,0.16); font-size: 13px; font-family: inherit; background: #fbfaf7; transition: border-color 0.12s ease, box-shadow 0.12s ease; }
        .bb-field input[type="text"]:focus, .bb-field textarea:focus, .bb-field select:focus { outline: none; border-color: #4a9e3f; box-shadow: 0 0 0 3px rgba(74,158,63,0.14); background: #fff; }
        .bb-field textarea { resize: vertical; min-height: 58px; }
        .bb-field input[type="range"] { width: 100%; accent-color: #4a9e3f; }
        .bb-row3 { display: flex; gap: 6px; }
        .bb-row3 .bb-btn { flex: 1; padding: 8px 0; justify-content: center; }
        .bb-color-size { display: flex; gap: 10px; align-items: center; }
        .bb-color-size input[type="color"] { width: 40px; height: 34px; border: 1px solid rgba(20,51,42,0.14); border-radius: 8px; padding: 2px; cursor: pointer; background: #fff; }
        .bb-color-size input[type="number"] { width: 72px; padding: 7px 9px; border-radius: 9px; border: 1px solid rgba(20,51,42,0.16); font-size: 13px; }
        .bb-color-size input[type="number"]:focus { outline: none; border-color: #4a9e3f; box-shadow: 0 0 0 3px rgba(74,158,63,0.14); }
        .bb-checkbox-field { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600; color: #45524b; }
        .bb-checkbox-field input { width: 16px; height: 16px; accent-color: #4a9e3f; cursor: pointer; }
        .bb-hint { font-size: 12px; color: #6b7a72; background: #f4f1ea; border-radius: 10px; padding: 10px 12px; margin-top: 12px; line-height: 1.5; }
        .bb-empty { font-size: 13px; color: #8a978f; padding: 10px 4px; text-align: center; }

        .bb-resize-handle { position: absolute; right: -8px; bottom: -8px; width: 15px; height: 15px; border-radius: 50%; background: #4a9e3f; border: 2.5px solid #fff; touch-action: none; box-shadow: 0 2px 5px rgba(20,51,42,0.3); }
        .bb-guide { position: absolute; background: #4a9e3f; opacity: 0.85; pointer-events: none; box-shadow: 0 0 6px rgba(74,158,63,0.6); }
        .bb-float-toolbar { position: absolute; display: flex; gap: 3px; background: #14332a; border-radius: 10px; padding: 5px; box-shadow: 0 10px 24px rgba(0,0,0,0.30); z-index: 30; }
        .bb-float-toolbar button { border: none; background: transparent; color: #fff; cursor: pointer; font-size: 13px; width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; transition: background 0.12s ease; }
        .bb-float-toolbar button:hover { background: rgba(255,255,255,0.16); }


        @media (max-width: 720px) { .bb-flyout { width: calc(100% - 64px); } }
      `}</style>

      <div className="bb-header">
        <div className="bb-brand">
          {logoError ? (
            <div className="bb-brand-mark bb-brand-mark-fallback">
              <BookOpen size={19} color="#fff" strokeWidth={2.2} />
            </div>
          ) : (
            <img
              src="/logo/logo-mau/lg-m-studio.png"
              alt=""
              className="bb-brand-mark"
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="bb-title">
            <span>
              Trình <em>tạo sách</em>
            </span>
          </h1>
        </div>
        <div className="bb-actions">
          <button
            className="bb-btn bb-btn-icon"
            title="Hoàn tác (Ctrl+Z)"
            onClick={undo}
            disabled={pastRef.current.length === 0}
          >
            <Undo2 size={15} />
          </button>
          <button
            className="bb-btn bb-btn-icon"
            title="Làm lại (Ctrl+Shift+Z)"
            onClick={redo}
            disabled={futureRef.current.length === 0}
          >
            <Redo2 size={15} />
          </button>
          <div className="bb-divider-v" />
          <button
            className="bb-btn"
            title="Lưu ngay (Ctrl+S)"
            onClick={saveNow}
          >
            <Save size={14} />
            Lưu
          </button>
          <div className="bb-divider-v" />
          {reading ? (
            <button className="bb-btn bb-btn-danger" onClick={stopReading}>
              <Square size={14} />
              Dừng đọc
            </button>
          ) : (
            <button className="bb-btn" onClick={readPage}>
              <Play size={14} />
              Đọc trang
            </button>
          )}
          <button
            className="bb-btn bb-btn-primary"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={14} />
            Xem trước
          </button>
          <button className="bb-btn" onClick={exportPdf} disabled={exporting}>
            <Folder size={14} />
            {exporting ? "Đang xuất..." : "Xuất PDF"}
          </button>
        </div>
      </div>

      <div className="bb-meta-bar">
        <div className="bb-meta-field">
          <label>
            Tên sách điện tử
            {bookTitle && (
              <span className="bb-meta-book-tag">
                · thuộc sách: {bookTitle}
              </span>
            )}
          </label>
          <div className="bb-meta-input-row">
            <input
              className="bb-ebook-title-input"
              value={ebookTitle}
              placeholder="VD: Chú Gấu Đi Rừng - bản điện tử"
              onFocus={beginEdit}
              onBlur={endEdit}
              onChange={(e) => setEbookTitle(e.target.value)}
            />
            <span className="bb-save-status">
              <span
                className={`bb-save-dot ${saveStatus === "saving" ? "busy" : saveStatus === "saved" ? "ok" : ""}`}
              />
              {saveStatus === "saving"
                ? "đang lưu…"
                : saveStatus === "saved"
                  ? "đã lưu"
                  : saveStatus === "error"
                    ? "lỗi lưu"
                    : "chưa lưu"}
            </span>
          </div>
        </div>
        {bookId && (
          <button
            className="bb-btn bb-meta-price-btn"
            onClick={() => navigate(`/dashboard/products/${bookId}`)}
            title="Mở trang sửa sản phẩm để thêm/điều chỉnh giá bán biến thể Sách điện tử"
          >
            <Tag size={14} />
            Sửa giá bán sản phẩm
          </button>
        )}
      </div>

      <div className="bb-current-page-label">
        <Sparkles size={13} color="#4a9e3f" />
        Đang chỉnh: <strong>Trang {pageIndex + 1}</strong>
        {currentPage.title ? ` — ${currentPage.title}` : ""} · {pages.length}{" "}
        trang
      </div>

      {!ttsOk && (
        <div className="bb-hint" style={{ marginBottom: 12 }}>
          Trình duyệt này không hỗ trợ đọc thành tiếng (Web Speech API) — phần
          soạn nội dung vẫn hoạt động bình thường, chỉ không có âm thanh.
        </div>
      )}

      <div className="bb-pages-strip">
        <div className="bb-pages-strip-scroll">
          {pages.map((p, i) => (
            <div
              className="bb-page-item"
              key={p.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                setDragPageId(p.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragPageId && dragPageId !== p.id) setDragOverPageId(p.id);
              }}
              onDragLeave={() =>
                setDragOverPageId((id) => (id === p.id ? null : id))
              }
              onDrop={(e) => {
                e.preventDefault();
                reorderPages(dragPageId, p.id);
                setDragPageId(null);
                setDragOverPageId(null);
              }}
              onDragEnd={() => {
                setDragPageId(null);
                setDragOverPageId(null);
              }}
            >
              <div
                className={`bb-page-thumb${i === pageIndex ? " active" : ""}${dragOverPageId === p.id ? " drag-over" : ""}${dragPageId === p.id ? " dragging-self" : ""}`}
                style={{ background: p.background, cursor: "grab" }}
                onClick={() => {
                  setPageIndex(i);
                  setSelectedId(null);
                }}
              >
                {i + 1}
              </div>
              {i === pageIndex ? (
                <input
                  className="bb-page-title-input"
                  value={p.title}
                  placeholder="Tên trang"
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => setPageTitle(e.target.value)}
                />
              ) : (
                <span
                  className="bb-page-title-input"
                  style={{ color: "#b7bfb9" }}
                >
                  {p.title || "\u00A0"}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="bb-strip-divider" />

        <div className="bb-page-strip-actions">
          <button
            className="bb-pill-btn"
            title="Thêm trang mới"
            onClick={addPage}
          >
            <Plus size={15} />
          </button>
          <button
            className="bb-pill-btn"
            title="Nhân đôi trang"
            onClick={duplicatePage}
          >
            <Copy size={15} />
          </button>
          <button
            className="bb-pill-btn"
            title="Xoá trang"
            onClick={deletePage}
            disabled={pages.length <= 1}
          >
            <Trash2 size={15} />
          </button>
          <div className="bb-pill-sep" />
          <button
            className="bb-pill-btn"
            title="Chuyển trang sang trái"
            onClick={() => movePage(-1)}
            disabled={pageIndex === 0}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="bb-pill-btn"
            title="Chuyển trang sang phải"
            onClick={() => movePage(1)}
            disabled={pageIndex === pages.length - 1}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="bb-strip-divider" />

        <div className="bb-zoom-bar">
          <button className="bb-btn bb-btn-icon" onClick={zoomOut}>
            <Minus size={14} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="bb-btn bb-btn-icon" onClick={zoomIn}>
            <ZoomIn size={14} />
          </button>
          <button className="bb-btn" onClick={zoomFit}>
            <Maximize2 size={14} />
            Vừa khung
          </button>
        </div>
      </div>

      <div className="bb-workspace">
        <div className="bb-rail">
          <button
            className="bb-rail-btn"
            onClick={addTextLayer}
            title="Thêm chữ"
          >
            <Type size={18} />
            <span>Chữ</span>
          </button>
          <button
            className="bb-rail-btn"
            onClick={addImageLayer}
            title="Thêm ảnh"
          >
            <Image size={18} />
            <span>Ảnh</span>
          </button>
          <button
            className="bb-rail-btn"
            onClick={addShapeLayer}
            title="Thêm hình khối"
          >
            <Square size={18} />
            <span>Hình</span>
          </button>
          <button
            className={`bb-rail-btn${activePanel === "qr" ? " active" : ""}`}
            onClick={() => toggleRailPanel("qr")}
            title="Thêm mã QR AR/Game"
          >
            <QrCode size={18} />
            <span>QR</span>
          </button>
          <div className="bb-rail-sep" />
          <button
            className={`bb-rail-btn${activePanel === "layers" ? " active" : ""}`}
            onClick={() => toggleRailPanel("layers")}
            title="Các lớp"
          >
            <Layers size={18} />
            <span>Lớp</span>
          </button>
          <button
            className={`bb-rail-btn${activePanel === "format" ? " active" : ""}`}
            onClick={() => toggleRailPanel("format")}
            title="Định dạng"
          >
            <Palette size={18} />
            <span>Chỉnh</span>
          </button>
          <button
            className={`bb-rail-btn${activePanel === "page" ? " active" : ""}`}
            onClick={() => toggleRailPanel("page")}
            title="Trang"
          >
            <Folder size={18} />
            <span>Trang</span>
          </button>
        </div>

        {activePanel === "page" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Trang {pageIndex + 1}</h3>
              <button
                className="bb-flyout-close"
                onClick={() => setActivePanel(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="bb-field">
              <label>Tên trang (không bắt buộc)</label>
              <input
                type="text"
                value={currentPage.title}
                onFocus={beginEdit}
                onBlur={endEdit}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="VD: Bìa sách"
              />
            </div>
            <div className="bb-field">
              <label>Màu nền trang</label>
              <div className="bb-color-size">
                <input
                  type="color"
                  value={currentPage.background}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => setPageBackground(e.target.value)}
                />
              </div>
            </div>
            <div className="bb-field">
              <label>Khổ sách (áp dụng cho toàn bộ sách)</label>
              <div className="bb-row3">
                <button
                  className={`bb-btn${orientation === "LANDSCAPE" ? " active" : ""}`}
                  onClick={() => changeOrientation("LANDSCAPE")}
                >
                  Ngang
                </button>
                <button
                  className={`bb-btn${orientation === "PORTRAIT" ? " active" : ""}`}
                  onClick={() => changeOrientation("PORTRAIT")}
                >
                  Dọc
                </button>
              </div>
            </div>

            <div className="bb-field">
              <label>Vị trí số trang (áp dụng cho toàn bộ sách)</label>
              <div className="bb-row3">
                <button
                  className={`bb-btn${pageNumberPos.v === "top" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, v: "top" }))}
                >
                  Phía trên
                </button>
                <button
                  className={`bb-btn${pageNumberPos.v === "bottom" ? " active" : ""}`}
                  onClick={() =>
                    setPageNumberPos((p) => ({ ...p, v: "bottom" }))
                  }
                >
                  Phía dưới
                </button>
              </div>
              <div className="bb-row3" style={{ marginTop: 6 }}>
                <button
                  className={`bb-btn${pageNumberPos.h === "left" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, h: "left" }))}
                >
                  Trái
                </button>
                <button
                  className={`bb-btn${pageNumberPos.h === "center" ? " active" : ""}`}
                  onClick={() =>
                    setPageNumberPos((p) => ({ ...p, h: "center" }))
                  }
                >
                  Giữa
                </button>
                <button
                  className={`bb-btn${pageNumberPos.h === "right" ? " active" : ""}`}
                  onClick={() =>
                    setPageNumberPos((p) => ({ ...p, h: "right" }))
                  }
                >
                  Phải
                </button>
              </div>
            </div>
            <div className="bb-field">
              <label className="bb-checkbox-field" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={showTitleWithPageNumber}
                  onChange={(e) => setShowTitleWithPageNumber(e.target.checked)}
                />
                Hiện tên trang cạnh số trang (nếu trang có đặt tên)
              </label>
            </div>
            <div className="bb-field">
              <label className="bb-checkbox-field" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={hidePageNumberOnCover}
                  onChange={(e) => setHidePageNumberOnCover(e.target.checked)}
                />
                Không hiện số trang ở trang bìa (trang 1)
              </label>
            </div>

            <div className="bb-field">
              <label>Mục lục tự động</label>
              <button
                type="button"
                className="bb-btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={generateToc}
              >
                <BookOpen size={14} />
                Tạo / cập nhật mục lục
              </button>
              <div className="bb-hint">
                Vào bảng <strong>Chỉnh</strong>, chọn một dòng chữ và đặt "Vai
                trò trong mục lục" thành tiêu đề mục. Sau đó bấm nút này để tự
                tạo trang mục lục, liệt kê các tiêu đề kèm số trang (bấm vào
                từng dòng khi Xem trước sẽ nhảy tới trang đó).
              </div>
            </div>

            <div className="bb-hint">
              Số trang được đánh tự động theo thứ tự — không cần chỉnh tay.
            </div>
          </div>
        )}

        {activePanel === "qr" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Thêm mã QR</h3>
              <button
                className="bb-flyout-close"
                onClick={() => setActivePanel(null)}
              >
                <X size={14} />
              </button>
            </div>
            {!bookId ? (
              <div className="bb-empty">
                Sách điện tử chưa gắn với sách nào.
              </div>
            ) : (
              <>
                <div className="bb-field">
                  <label>Mã AR của sách này</label>
                  {bookLinkables.arCodes.length === 0 ? (
                    <div className="bb-hint">
                      Sách chưa có mã AR nào. Tạo ở mục "Quản lý mã QR" trước.
                    </div>
                  ) : (
                   bookLinkables.arCodes.map((ac) => (
                      <button key={ac.id} type="button" className="bb-btn bb-qr-pick-btn"
                        onClick={() => addQrLayer("AR", ac)}>
                        <span className="bb-qr-pick-label"><Sparkles size={13} />{ac.label}</span>
                        <span className="bb-qr-pick-code">{ac.code}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="bb-field">
                  <label>Trò chơi của sách này</label>
                  {bookLinkables.games.length === 0 ? (
                    <div className="bb-hint">
                      Sách chưa có trò chơi nào. Tạo ở mục "Studio trò chơi"
                      trước.
                    </div>
                  ) : (
                   bookLinkables.games.map((g) => (
                      <button key={g.id} type="button" className="bb-btn bb-qr-pick-btn"
                        onClick={() => addQrLayer("GAME", g)}>
                        <span className="bb-qr-pick-label"><Play size={13} />{g.title}</span>
                        <span className="bb-qr-pick-code">{g.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === "layers" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Các lớp ({currentPage.layers.length})</h3>
              <button
                className="bb-flyout-close"
                onClick={() => setActivePanel(null)}
              >
                <X size={14} />
              </button>
            </div>
            {layersFrontFirst.length === 0 && (
              <div className="bb-empty">Chưa có lớp nào trên trang này.</div>
            )}
            {layersFrontFirst.length > 0 && (
              <div
                className="bb-hint"
                style={{ marginTop: 0, marginBottom: 10 }}
              >
                Kéo <GripVertical size={11} style={{ verticalAlign: "-2px" }} />{" "}
                để sắp xếp thứ tự lớp trước / sau.
              </div>
            )}
            {layersFrontFirst.map((layer) => (
              <div
                key={layer.id}
                className={`bb-layer-row${layer.id === selectedId || multiIds.includes(layer.id) ? " selected" : ""}${dragOverLayerId === layer.id ? " drag-over" : ""}${dragLayerId === layer.id ? " dragging-self" : ""}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragLayerId(layer.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragLayerId && dragLayerId !== layer.id)
                    setDragOverLayerId(layer.id);
                }}
                onDragLeave={() =>
                  setDragOverLayerId((id) => (id === layer.id ? null : id))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  reorderLayer(dragLayerId, layer.id);
                  setDragLayerId(null);
                  setDragOverLayerId(null);
                }}
                onDragEnd={() => {
                  setDragLayerId(null);
                  setDragOverLayerId(null);
                }}
                onClick={() => selectLayer(layer.id)}
              >
                <span className="bb-drag-handle" title="Kéo để sắp xếp">
                  <GripVertical size={13} />
                </span>
                <span className="bb-layer-type">
                  {layer.type === "image" ? (
                    <Image size={12} />
                  ) : layer.type === "qr" ? (
                    <QrCode size={12} />
                  ) : (
                    <Type size={12} />
                  )}
                </span>
                {layer.headingLevel > 0 && (
                  <span className="bb-heading-badge">
                    Tiêu đề {layer.headingLevel}
                  </span>
                )}
                <span className="bb-layer-label">
                  {layer.type === "image"
                    ? layer.src || "(chưa có ảnh)"
                    : layer.type === "qr"
                      ? layer.label || "(chưa gắn liên kết)"
                      : layer.text || "(trống)"}
                </span>
                <button
                  className="bb-mini-btn"
                  title="Lên trước"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 1);
                  }}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  className="bb-mini-btn"
                  title="Xuống sau"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, -1);
                  }}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  className="bb-mini-btn"
                  title={layer.locked ? "Mở khoá" : "Khoá vị trí"}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(
                      layer.id,
                      { locked: !layer.locked },
                      { commit: true },
                    );
                  }}
                >
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button
                  className="bb-mini-btn"
                  title="Nhân đôi"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                >
                  <Copy size={12} />
                </button>
                {layer.type === "text" && (
                  <button
                    className="bb-mini-btn"
                    title="Đọc lớp này"
                    onClick={(e) => {
                      e.stopPropagation();
                      readLayer(layer);
                    }}
                  >
                    <Volume2 size={12} />
                  </button>
                )}
                <button
                  className="bb-mini-btn"
                  title="Xoá"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activePanel === "format" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Định dạng</h3>
              <button
                className="bb-flyout-close"
                onClick={() => setActivePanel(null)}
              >
                <X size={14} />
              </button>
            </div>
            {!selected ? (
              <div className="bb-empty">Chọn một lớp trên trang để chỉnh.</div>
            ) : selected.type === "shape" ? (
              <>
                <div className="bb-field">
                  <label>Kiểu hình</label>
                  <div className="bb-row3">
                    <button
                      className={`bb-btn${selected.shapeType === "rect" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "rect" },
                          { commit: true },
                        )
                      }
                    >
                      Chữ nhật
                    </button>
                    <button
                      className={`bb-btn${selected.shapeType === "circle" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "circle" },
                          { commit: true },
                        )
                      }
                    >
                      Tròn
                    </button>
                    <button
                      className={`bb-btn${selected.shapeType === "triangle" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "triangle" },
                          { commit: true },
                        )
                      }
                    >
                      <Triangle size={14} />
                    </button>
                  </div>
                  <div className="bb-row3" style={{ marginTop: 6 }}>
                    <button
                      className={`bb-btn${selected.shapeType === "line" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "line" },
                          { commit: true },
                        )
                      }
                    >
                      <LineIcon size={14} />
                      Đường
                    </button>
                    <button
                      className={`bb-btn${selected.shapeType === "arrow" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "arrow" },
                          { commit: true },
                        )
                      }
                    >
                      <ArrowRight size={14} />
                      Mũi tên
                    </button>
                    <button
                      className={`bb-btn${selected.shapeType === "star" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { shapeType: "star" },
                          { commit: true },
                        )
                      }
                    >
                      <Star size={14} />
                      Sao
                    </button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input
                      type="number"
                      value={Math.round(selected.width)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          width: Number(e.target.value) || 20,
                        })
                      }
                    />
                    <input
                      type="number"
                      value={Math.round(selected.height)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          height: Number(e.target.value) || 20,
                        })
                      }
                    />
                  </div>
                </div>
                {selected.shapeType !== "circle" && (
                  <div className="bb-field">
                    <label>Bo góc ({selected.borderRadius}px)</label>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      value={selected.borderRadius}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          borderRadius: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div className="bb-field">
                  <label>Màu nền &amp; viền</label>
                  <div className="bb-color-size">
                    <input
                      type="color"
                      value={selected.fill}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, { fill: e.target.value })
                      }
                    />
                    <input
                      type="color"
                      value={selected.strokeColor}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          strokeColor: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={selected.strokeWidth}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          strokeWidth: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selected.opacity}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            ) : selected.type === "qr" ? (
              <>
                <div className="bb-field">
                  <label>Liên kết đang gắn</label>
                  {selected.code ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        border: "1px solid #e1e7e0",
                        borderRadius: 10,
                      }}
                    >
                      <QRCodeCanvas
                        value={qrLayerUrl(selected)}
                        size={56}
                        level="M"
                        includeMargin
                        bgColor="#ffffff"
                        fgColor="#1a5c47"
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#14332a",
                          }}
                        >
                          {selected.linkType === "GAME" ? "Trò chơi" : "AR"}:{" "}
                          {selected.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7a72",
                            wordBreak: "break-all",
                          }}
                        >
                          {qrLayerUrl(selected)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bb-hint">
                      Chưa gắn liên kết nào cho mã QR này.
                    </div>
                  )}
                  <button
                    type="button"
                    className="bb-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                    onClick={() => setActivePanel("qr")}
                  >
                    <QrCode size={14} />
                    Đổi liên kết
                  </button>
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input
                      type="number"
                      value={Math.round(selected.width)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          width: Number(e.target.value) || 40,
                          height: Number(e.target.value) || 40,
                        })
                      }
                    />
                    <input
                      type="number"
                      value={Math.round(selected.height)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          height: Number(e.target.value) || 40,
                        })
                      }
                    />
                  </div>
                  <div className="bb-hint">
                    Nên để rộng = cao để mã QR không bị méo.
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selected.opacity}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            ) : selected.type === "image" ? (
              <>
                <div className="bb-field">
                  <label>Ảnh</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleImageDropOnLayer(e, selected.id)}
                    onClick={() =>
                      imageFileInputRef.current &&
                      imageFileInputRef.current.click()
                    }
                    style={{
                      border: "1.5px dashed #c7d0c9",
                      borderRadius: 10,
                      padding: "16px 10px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#fbfaf7",
                      color: "#6b7a72",
                      fontSize: 12.5,
                    }}
                  >
                    <Upload size={16} style={{ marginBottom: 4 }} />
                    <div>Kéo ảnh vào đây hoặc bấm để chọn ảnh từ máy</div>
                  </div>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageFileChange}
                  />
                </div>
                <div className="bb-field">
                  <label>Xoá nền theo màu ({bgRemoveTolerance}%)</label>
                  <div className="bb-color-size">
                    <input
                      type="color"
                      value={bgRemoveColor}
                      onChange={(e) => setBgRemoveColor(e.target.value)}
                      title="Chọn màu nền cần xoá"
                    />
                    <input
                      type="range"
                      min={2}
                      max={60}
                      value={bgRemoveTolerance}
                      style={{ flex: 1 }}
                      onChange={(e) =>
                        setBgRemoveTolerance(Number(e.target.value))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="bb-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                    onClick={handleRemoveBackground}
                    disabled={!selected.src || bgRemoving}
                  >
                    <Wand2 size={14} />
                    {bgRemoving ? "Đang xoá nền..." : "Xoá nền"}
                  </button>
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input
                      type="number"
                      value={Math.round(selected.width)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          width: Number(e.target.value) || 30,
                        })
                      }
                    />
                    <input
                      type="number"
                      value={Math.round(selected.height)}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          height: Number(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selected.opacity}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bb-field">
                  <label>Nội dung</label>
                  <textarea
                    value={selected.text}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, { text: e.target.value })
                    }
                  />
                </div>
                <div className="bb-field">
                  <label className="bb-checkbox-field">
                    <input
                      type="checkbox"
                      checked={selected.height != null}
                      onChange={(e) =>
                        updateLayer(
                          selected.id,
                          { height: e.target.checked ? 120 : null },
                          { commit: true },
                        )
                      }
                    />
                    Đặt chiều cao cố định (để căn giữa chữ theo chiều dọc)
                  </label>
                  {selected.height != null && (
                    <div className="bb-color-size" style={{ marginTop: 8 }}>
                      <input
                        type="number"
                        min={20}
                        value={Math.round(selected.height)}
                        onFocus={beginEdit}
                        onBlur={endEdit}
                        onChange={(e) =>
                          updateLayer(selected.id, {
                            height: Number(e.target.value) || 20,
                          })
                        }
                      />
                      <span style={{ fontSize: 12, color: "#6b7a72" }}>
                        px chiều cao
                      </span>
                    </div>
                  )}
                </div>
                {selected.height != null && (
                  <div className="bb-field">
                    <label>Căn dọc trong khung</label>
                    <div className="bb-row3">
                      <button
                        className={`bb-btn${selected.verticalAlign === "top" ? " active" : ""}`}
                        onClick={() =>
                          updateLayer(
                            selected.id,
                            { verticalAlign: "top" },
                            { commit: true },
                          )
                        }
                      >
                        Trên
                      </button>
                      <button
                        className={`bb-btn${selected.verticalAlign === "middle" ? " active" : ""}`}
                        onClick={() =>
                          updateLayer(
                            selected.id,
                            { verticalAlign: "middle" },
                            { commit: true },
                          )
                        }
                      >
                        Giữa
                      </button>
                      <button
                        className={`bb-btn${selected.verticalAlign === "bottom" ? " active" : ""}`}
                        onClick={() =>
                          updateLayer(
                            selected.id,
                            { verticalAlign: "bottom" },
                            { commit: true },
                          )
                        }
                      >
                        Dưới
                      </button>
                    </div>
                  </div>
                )}
                <div className="bb-field">
                  <label>Vai trò trong mục lục</label>
                  <select
                    value={selected.headingLevel || 0}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        headingLevel: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Không phải tiêu đề mục</option>
                    <option value={1}>Tiêu đề lớn (cấp 1)</option>
                    <option value={2}>Tiêu đề vừa (cấp 2)</option>
                    <option value={3}>Tiêu đề nhỏ (cấp 3)</option>
                  </select>
                  <div className="bb-hint">
                    Đánh dấu tiêu đề để đưa vào mục lục tự động (bấm "Tạo / cập
                    nhật mục lục" ở bảng Trang).
                  </div>
                </div>
                <div className="bb-field">
                  <label>Kiểu chữ</label>
                  <div className="bb-row3">
                    <button
                      className={`bb-btn${selected.bold ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { bold: !selected.bold },
                          { commit: true },
                        )
                      }
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.italic ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { italic: !selected.italic },
                          { commit: true },
                        )
                      }
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.underline ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { underline: !selected.underline },
                          { commit: true },
                        )
                      }
                    >
                      <Underline size={14} />
                    </button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Căn chữ</label>
                  <div className="bb-row3">
                    <button
                      className={`bb-btn${selected.align === "left" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { align: "left" },
                          { commit: true },
                        )
                      }
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.align === "center" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { align: "center" },
                          { commit: true },
                        )
                      }
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.align === "right" ? " active" : ""}`}
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { align: "right" },
                          { commit: true },
                        )
                      }
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Font chữ</label>
                  <select
                    value={selected.fontFamily}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, { fontFamily: e.target.value })
                    }
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bb-field">
                  <label>Màu chữ &amp; cỡ chữ</label>
                  <div className="bb-color-size">
                    <input
                      type="color"
                      value={selected.color}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, { color: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      min={10}
                      max={96}
                      value={selected.fontSize}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          fontSize: Number(e.target.value) || 10,
                        })
                      }
                    />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Viền chữ (màu &amp; độ dày)</label>
                  <div className="bb-color-size">
                    <input
                      type="color"
                      value={selected.strokeColor}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          strokeColor: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      max={6}
                      step={0.5}
                      value={selected.strokeWidth}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        updateLayer(selected.id, {
                          strokeWidth: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selected.opacity}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="bb-canvas-area">
          <div className="bb-canvas-frame" ref={wrapRef}>
            <div
              ref={canvasRef}
              onPointerDown={() => {
                setSelectedId(null);
                setMultiIds([]);
              }}
              style={{
                width: PAGE_W * scale,
                height: PAGE_H * scale,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "relative",
                  background: currentPage.background,
                  borderRadius: 10,
                  boxShadow:
                    "0 8px 26px rgba(20,51,42,0.16), 0 2px 6px rgba(20,51,42,0.08)",
                }}
              >
                {currentPage.layers.map((layer) => (
                  <LayerView
                    key={layer.id}
                    layer={layer}
                    selected={
                      layer.id === selectedId || multiIds.includes(layer.id)
                    }
                    readOnly={false}
                    isReadingThis={reading?.layerId === layer.id}
                    readingWordIndex={reading?.wordIndex}
                    onSelect={selectLayer}
                    onDragStart={onLayerDragStart}
                    onResizeStart={onLayerResizeStart}
                    onWordHover={onWordHover}
                    onWordLeave={onWordLeave}
                    onImageDrop={handleImageDropOnLayer}
                  />
                ))}

                {selected && !dragging && !resizing && (
                  <div
                    className="bb-float-toolbar"
                    style={{
                      left: selected.x,
                      top: Math.max(0, selected.y - 36),
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {selected.type === "text" && (
                      <button
                        title="Đọc lớp này"
                        onClick={() => readLayer(selected)}
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                    <button
                      title="Nhân đôi (Ctrl+D)"
                      onClick={() => duplicateLayer(selected.id)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      title="Xoá (Delete)"
                      onClick={() => removeLayer(selected.id)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {guides.x && (
                  <div
                    className="bb-guide"
                    style={{
                      left: PAGE_W / 2 - 0.5,
                      top: 0,
                      bottom: 0,
                      width: 1,
                    }}
                  />
                )}
                {guides.y && (
                  <div
                    className="bb-guide"
                    style={{
                      top: PAGE_H / 2 - 0.5,
                      left: 0,
                      right: 0,
                      height: 1,
                    }}
                  />
                )}

                {!(pageIndex === 0 && hidePageNumberOnCover) && (
                  <PageNumberBadge
                    page={currentPage}
                    number={pageIndex + 1}
                    pos={pageNumberPos}
                    showTitle={showTitleWithPageNumber}
                  />
                )}
              </div>
            </div>
          </div>

          <div
            className="bb-hint"
            style={{ textAlign: "center", color: "#a9b3ac" }}
          >
            Power by earthoria, Ver2.1.2
          </div>
        </div>
      </div>

      {previewOpen && (
        <PreviewOverlay
          pages={pages}
          startIndex={pageIndex}
          orientation={orientation}
          pageNumberPos={pageNumberPos}
          showTitleWithPageNumber={showTitleWithPageNumber}
          hidePageNumberOnCover={hidePageNumberOnCover}
          bookInfo={{ title: bookTitle }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {exporting && (
        <div
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
          }}
        >
          {pages.map((p, i) => (
            <div
              key={p.id}
              id={`bb-export-page-${i}`}
              style={{
                width: PAGE_W,
                height: PAGE_H,
                position: "relative",
                background: p.background,
              }}
            >
              {p.layers.map((layer) => (
                <LayerView
                  key={layer.id}
                  layer={layer}
                  selected={false}
                  readOnly
                  onSelect={() => {}}
                  onDragStart={() => {}}
                  onResizeStart={() => {}}
                  onWordHover={() => {}}
                  onWordLeave={() => {}}
                />
              ))}
              {!(i === 0 && hidePageNumberOnCover) && (
                <PageNumberBadge
                  page={p}
                  number={i + 1}
                  pos={pageNumberPos}
                  showTitle={showTitleWithPageNumber}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}