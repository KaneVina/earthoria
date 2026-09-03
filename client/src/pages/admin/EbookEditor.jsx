import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ebookService } from "../../services/ebookService";
import api from "../../services/api";
import { QRCodeCanvas } from "qrcode.react";
import "../../components/assets/css/ebookPreview.css";
import "../../components/assets/css/bookBuilder.css";
import {
  Undo2,
  Redo2,
  Plus,
  Image as ImageIcon,
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
  AlignJustify,
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
  VolumeX,
  MousePointer,
  List,
  Bookmark,
  BookmarkCheck,
  SwatchBook,
  Menu,
  Clock,
  Calendar,
  Globe,
  Building2,
  Users,
} from "lucide-react";
import ColorPaletteStudio from "../../pages/admin/colorPalette/ColorPaletteStudio";

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

function resizeImageFileIfNeeded(file, maxDim = 1600, quality = 0.86) {
  return new Promise((resolve) => {
    if (!file.type?.startsWith("image/") || file.type === "image/gif") {
      // GIF (có thể animated) resize qua canvas sẽ làm mất animation — bỏ qua, upload nguyên bản.
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxDim && img.height <= maxDim) {
          resolve(file); // Ảnh đã đủ nhỏ, không cần resize — giữ nguyên chất lượng gốc.
          return;
        }
        const ratio = Math.min(maxDim / img.width, maxDim / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Resize thất bại vì lý do nào đó — vẫn upload file gốc thay vì chặn hẳn.
              return;
            }
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeRichHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html || "";
  const ALLOWED_TAGS = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "FONT",
    "SPAN",
    "BR",
    "DIV",
  ]);
  const clean = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) {
        node.removeChild(child);
        return;
      }
      if (!ALLOWED_TAGS.has(child.tagName)) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (child.tagName === "FONT" && name === "color") return;
        if (name === "style") {
          const m = /color\s*:\s*[^;]+/i.exec(attr.value);
          if (m) {
            child.setAttribute("style", m[0]);
            return;
          }
        }
        child.removeAttribute(attr.name);
      });
      clean(child);
    });
  };
  clean(container);
  return container.innerHTML;
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

// Tách 1 đoạn văn thành từng "câu" theo dấu chấm/chấm than/chấm hỏi/phẩy/
// chấm phẩy/hai chấm, trả về từng câu kèm khoảng chỉ số từ (word index)
// mà nó chiếm — dùng để khi rê chuột vào 1 từ, biết cần đọc to đúng câu
// chứa từ đó, thay vì đọc lại toàn bộ đoạn văn (gây trùng với chế độ
// Tự động đọc).
function splitSentenceWordRanges(text) {
  const words = (text || "").split(" ");
  if (!words.length || (words.length === 1 && !words[0])) return [];
  const ranges = [];
  let start = 0;
  words.forEach((w, i) => {
    const isBoundary = /[.!?,;:…]+["'”’)]*$/.test(w);
    if (isBoundary || i === words.length - 1) {
      ranges.push({
        start,
        end: i,
        text: words
          .slice(start, i + 1)
          .join(" ")
          .trim(),
      });
      start = i + 1;
    }
  });
  return ranges;
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
    html: null,
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
    borderRadius: 0,
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
    backgroundImage: "",
    bgImageSize: "cover",
    bgImagePosition: { x: 50, y: 50 },
    width: BASE_PAGE_W,
    height: BASE_PAGE_H,
    borderRadius: 10,
    layers: [],
    ...overrides,
  };
}

// Style nền trang: màu nền + (tuỳ chọn) ảnh nền có thể canh vị trí / kiểu hiển thị.
function pageBackgroundStyle(page) {
  const style = { background: page?.background || "#fffdf8" };
  if (page?.backgroundImage) {
    const pos = page.bgImagePosition || { x: 50, y: 50 };
    style.backgroundImage = `url("${page.backgroundImage}")`;
    style.backgroundRepeat = "no-repeat";
    style.backgroundPosition = `${pos.x}% ${pos.y}%`;
    style.backgroundSize =
      page.bgImageSize === "stretch"
        ? "100% 100%"
        : page.bgImageSize === "contain"
          ? "contain"
          : "cover";
  }
  return style;
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
  isUploading,
  onSelect,
  onDragStart,
  onResizeStart,
  onWordHover,
  onWordLeave,
  onLayerClick,
  onImageDrop,
  onOpenFilePicker,
  onLineHover,
  onLineLeave,
  onSentenceHover,
  onSentenceLeave,
  forceWordSpans,
  onAskAI,
  isEditingText,
  editableRef,
  onStartEditText,
  onCommitText,
  onSelectionChange,
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
    const empty = !layer.src;
    const canEdit = !readOnly && !layer.locked;

    const openPicker = (e) => {
      e.stopPropagation();
      if (canEdit && onOpenFilePicker) onOpenFilePicker(layer.id);
    };

    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={handleDragStart}
        onClick={handleClick}
        onDoubleClick={canEdit ? openPicker : undefined}
        onDragOver={(e) => {
          if (!readOnly) e.preventDefault();
        }}
        onDrop={(e) =>
          !readOnly && !layer.locked && onImageDrop && onImageDrop(e, layer.id)
        }
      >
        <div
          className={empty && canEdit ? "bb-image-dropzone" : undefined}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            outline:
              !readOnly && selected
                ? "2px solid #4a9e3f"
                : "2px solid transparent",
            outlineOffset: 4,
            borderRadius: layer.borderRadius ?? 0,
            overflow: "hidden",
            cursor: readOnly ? "default" : empty ? "pointer" : "grab",
            touchAction: "none",
            boxShadow:
              !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
            transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
          }}
        >
          {layer.src ? (
            <>
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
                  opacity: isUploading ? 0.4 : 1,
                  transition: "opacity 0.15s ease",
                }}
              />
              {canEdit && !isUploading && selected && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={openPicker}
                  title="Thay ảnh khác (hoặc nhấp đúp vào ảnh)"
                  className="bb-image-replace-btn"
                >
                  <Upload size={12} />
                  Thay ảnh
                </button>
              )}
            </>
          ) : (
            <div
              onClick={canEdit ? openPicker : undefined}
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
                fontSize: 11.5,
                textAlign: "center",
                padding: 8,
              }}
            >
              {!readOnly && !isUploading && (
                <>
                  <ImageIcon size={18} strokeWidth={1.6} />
                  <span>
                    Bấm hoặc kéo ảnh vào đây
                    <br />
                    <span style={{ opacity: 0.75 }}>(hoặc dán Ctrl+V)</span>
                  </span>
                </>
              )}
            </div>
          )}
          {isUploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "rgba(255,255,255,0.55)",
                color: "#3f6b52",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span className="bb-spinner" />
              Đang tải lên…
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
  const isRich = !!layer.html;
  // Trong trải nghiệm ĐỌC (reader) luôn tách văn bản theo từng từ (dù là
  // rich-text) để tính năng "rê chuột đọc theo câu" + tô sáng từ đang đọc
  // hoạt động đúng cho mọi đoạn văn — dữ liệu thật hầu như đoạn nào cũng
  // có sẵn `html` (do trình soạn thảo luôn lưu html khi gõ) nên nếu vẫn ưu
  // tiên hiển thị rich-html thì coi như không có đoạn nào tách được từ,
  // khiến chế độ rê chuột buộc phải đọc nguyên khối. Chỗ khác (đang biên
  // soạn / xuất PDF) vẫn giữ nguyên định dạng rich-text như cũ.
  const useWordSpans = forceWordSpans || !isRich;
  const editingNow = !readOnly && !!isEditingText;

  const textInnerStyle = {
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
    outline: "none",
  };

  return (
    <div
      style={{
        ...wrapStyle,
        width: layer.width,
        height: hasFixedHeight ? layer.height : undefined,
      }}
      onPointerDown={(e) => {
        if (readOnly) return;
        if (editingNow) {
          e.stopPropagation();
          return;
        }
        onDragStart(e, layer);
      }}
      onClick={handleClick}
      onDoubleClick={
        !readOnly && !layer.locked && onStartEditText
          ? (e) => {
              e.stopPropagation();
              onStartEditText(layer.id);
            }
          : undefined
      }
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
          cursor: readOnly
            ? isTocLink
              ? "pointer"
              : "default"
            : editingNow
              ? "text"
              : "grab",
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
        {editingNow ? (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onPointerDown={(e) => e.stopPropagation()}
            onMouseUp={onSelectionChange}
            onKeyUp={onSelectionChange}
            onBlur={() => onCommitText && onCommitText(layer.id)}
            style={textInnerStyle}
            dangerouslySetInnerHTML={{
              __html: layer.html || escapeHtml(layer.text || ""),
            }}
          />
        ) : isRich && !useWordSpans ? (
          <div
            style={textInnerStyle}
            dangerouslySetInnerHTML={{ __html: layer.html }}
          />
        ) : (
          <div style={textInnerStyle}>
            {words.map((w, i) => (
              <React.Fragment key={i}>
                <span
                  onMouseEnter={
                    !readOnly
                      ? (e) => {
                          e.stopPropagation();
                          onWordHover({ word: w });
                        }
                      : onSentenceHover
                        ? (e) => {
                            e.stopPropagation();
                            onSentenceHover(layer, i);
                          }
                        : undefined
                  }
                  onMouseLeave={
                    !readOnly
                      ? onWordLeave
                      : onSentenceLeave
                        ? onSentenceLeave
                        : undefined
                  }
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
        )}
        {!readOnly && selected && !editingNow && (
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
  storageKey,
  resumeFromStorage,
  onProgress,
  // { dailyLimitMinutes, todayMinutes } — chỉ truyền khi đang ở link đọc
  // riêng của bé, dùng để hiện "giờ đọc còn lại" do ba mẹ thiết lập.
  kidTimeInfo,
}) {
  const THEMES = {
    forest: { label: "Rừng đêm" },
    dark: { label: "Tối" },
    light: { label: "Sáng" },
    sepia: { label: "Ấm áp" },
  };
  const SPREAD_GAP = 26;

  const firstPage = pages && pages[0];
  const PAGE_W =
    firstPage?.width ||
    (orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W);
  const PAGE_H =
    firstPage?.height ||
    (orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H);
  const PAGE_RADIUS = firstPage?.borderRadius ?? 10;

  const STORAGE_PREFIX = `earthoria:reader:${storageKey || "preview"}`;

  const [idx, setIdx] = useState(() => {
    if (resumeFromStorage) {
      try {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}:lastPage`);
        const n = saved != null ? parseInt(saved, 10) : NaN;
        if (!Number.isNaN(n)) return Math.max(0, Math.min(pages.length - 1, n));
      } catch {
        // localStorage không khả dụng — bỏ qua, dùng startIndex mặc định
      }
    }
    return Math.max(0, Math.min(pages.length - 1, startIndex));
  });
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}:bookmarks`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [tocOpen, setTocOpen] = useState(false);
  const [reading, setReading] = useState(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState("forest");
  const [pageView, setPageView] = useState("single");
  const [readMode, setReadMode] = useState("off"); // "off" | "auto" | "hover"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [direction, setDirection] = useState("next");
  // Header thu gọn: mặc định chỉ hiện nút Đóng + Hamburger, bấm Hamburger
  // mới hiện các nút chức năng (giúp thấy sách nhiều hơn).
  const [toolsOpen, setToolsOpen] = useState(false);
  const [timeInfoOpen, setTimeInfoOpen] = useState(false);
  // Thanh số trang dưới cùng: mặc định ẩn/trong suốt, chỉ hiện khi rê
  // chuột / chạm vào vùng dưới màn hình.
  const [bottomBarActive, setBottomBarActive] = useState(false);
  // 2 nút điều hướng 2 bên: cùng kiểu ẩn/hiện như thanh số trang, để
  // không phải kéo xuống dưới mới chuyển được trang.
  const [leftNavActive, setLeftNavActive] = useState(false);
  const [rightNavActive, setRightNavActive] = useState(false);

  const autoPlay = readMode === "auto";

  const wrapRef = useRef(null);
  const timeBoxRef = useRef(null);
  const activeDotRef = useRef(null);
  const bottomHideTimer = useRef(null);
  const leftNavHideTimer = useRef(null);
  const rightNavHideTimer = useRef(null);
  const lineHoverTimer = useRef(null);
  const hoverSentenceKeyRef = useRef(null);
  const zoomRef = useRef(1);
  const pinchStateRef = useRef({ startDist: 0, startZoom: 1 });
  const swipeStateRef = useRef({ x: 0, y: 0, t: 0, active: false });
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  const toggleFullscreen = () => {
    const el = document.documentElement;
    const request =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen;
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
      // .er-stage giờ có padding CSS riêng để chừa chỗ cho topbar/bottombar
      // nổi phía trên (tránh trang sách bị 2 thanh đó che/tràn ra ngoài).
      // Đọc padding thực tế thay vì số cố định để 2 bên luôn khớp nhau.
      const cs = window.getComputedStyle(wrapRef.current);
      const padX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const w = wrapRef.current.clientWidth - padX - 16;
      const h = wrapRef.current.clientHeight - padY - 16;
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

  // Đóng popover giờ đọc còn lại khi bấm ra ngoài
  useEffect(() => {
    if (!timeInfoOpen) return;
    const onDocClick = (e) => {
      if (timeBoxRef.current && !timeBoxRef.current.contains(e.target))
        setTimeInfoOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [timeInfoOpen]);

  // Tự cuộn dãy số trang phía dưới để trang đang active luôn lọt vào
  // vùng nhìn thấy (trước đây chỉ đổi màu active nhưng không cuộn tới).
  useEffect(() => {
    activeDotRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [idx, pageView]);

  // Hiện/ẩn thanh số trang dưới cùng khi rê chuột / chạm vào vùng dưới
  const showBottomBar = () => {
    if (bottomHideTimer.current) clearTimeout(bottomHideTimer.current);
    setBottomBarActive(true);
  };
  const scheduleHideBottomBar = (delay = 1600) => {
    if (bottomHideTimer.current) clearTimeout(bottomHideTimer.current);
    bottomHideTimer.current = setTimeout(
      () => setBottomBarActive(false),
      delay,
    );
  };
  useEffect(() => {
    return () => {
      if (bottomHideTimer.current) clearTimeout(bottomHideTimer.current);
    };
  }, []);

  // Hiện/ẩn 2 nút điều hướng 2 bên khi rê chuột / chạm vào vùng đó
  const showLeftNav = () => {
    if (leftNavHideTimer.current) clearTimeout(leftNavHideTimer.current);
    setLeftNavActive(true);
  };
  const scheduleHideLeftNav = (delay = 1400) => {
    if (leftNavHideTimer.current) clearTimeout(leftNavHideTimer.current);
    leftNavHideTimer.current = setTimeout(() => setLeftNavActive(false), delay);
  };
  const showRightNav = () => {
    if (rightNavHideTimer.current) clearTimeout(rightNavHideTimer.current);
    setRightNavActive(true);
  };
  const scheduleHideRightNav = (delay = 1400) => {
    if (rightNavHideTimer.current) clearTimeout(rightNavHideTimer.current);
    rightNavHideTimer.current = setTimeout(
      () => setRightNavActive(false),
      delay,
    );
  };
  useEffect(() => {
    return () => {
      if (leftNavHideTimer.current) clearTimeout(leftNavHideTimer.current);
      if (rightNavHideTimer.current) clearTimeout(rightNavHideTimer.current);
    };
  }, []);

  // Luôn giữ giá trị zoom mới nhất trong ref để dùng trong listener chạm
  // (tránh closure cũ khi bắt đầu chụm 2 ngón).
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Chụm/mở 2 ngón tay (pinch) trên sân khấu để phóng to/thu nhỏ trang.
  // Gắn listener gốc (không phải React synthetic) để có thể preventDefault
  // và chặn trình duyệt tự cuộn/zoom trang web khi đang chụm.
  // Chụm/mở 2 ngón tay (pinch) để phóng to/thu nhỏ trang, vuốt ngang 1
  // ngón để chuyển trang, và chạm đúp để phóng to nhanh 1 vùng (chạm đúp
  // lần nữa để về bình thường). Gắn listener gốc (không phải React
  // synthetic) để có thể preventDefault và chặn trình duyệt tự
  // cuộn/zoom trang web khi đang thao tác.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const dist = (touches) => {
      const [a, b] = touches;
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchStateRef.current = {
          startDist: dist(e.touches),
          startZoom: zoomRef.current,
        };
        swipeStateRef.current.active = false;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        swipeStateRef.current = {
          x: t.clientX,
          y: t.clientY,
          t: Date.now(),
          active: true,
        };
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStateRef.current.startDist) {
        e.preventDefault();
        const ratio = dist(e.touches) / pinchStateRef.current.startDist;
        const next = Math.max(
          0.6,
          Math.min(2.5, pinchStateRef.current.startZoom * ratio),
        );
        setZoom(+next.toFixed(2));
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchStateRef.current.startDist = 0;
      if (e.touches.length > 0) return; // còn ngón khác trên màn hình, bỏ qua
      if (!swipeStateRef.current.active || e.changedTouches.length !== 1)
        return;

      const t = e.changedTouches[0];
      const dx = t.clientX - swipeStateRef.current.x;
      const dy = t.clientY - swipeStateRef.current.y;
      const dt = Date.now() - swipeStateRef.current.t;
      swipeStateRef.current.active = false;

      const isZoomedIn = zoomRef.current > 1.05;
      const wasSwipe =
        !isZoomedIn &&
        Math.abs(dx) > 56 &&
        Math.abs(dx) > Math.abs(dy) * 1.4 &&
        dt < 700;

      if (wasSwipe) {
        e.preventDefault();
        if (dx < 0) goNextRef.current();
        else goPrevRef.current();
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        return;
      }

      // Không phải vuốt trang: nếu gần như không di chuyển thì đây là 1
      // cái chạm — kiểm tra có phải chạm đúp (double-tap) để zoom không.
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        const now = Date.now();
        const last = lastTapRef.current;
        const closeEnough =
          Math.abs(t.clientX - last.x) < 40 &&
          Math.abs(t.clientY - last.y) < 40;
        if (now - last.time < 320 && closeEnough) {
          e.preventDefault();
          setZoom((z) => (z > 1.05 ? 1 : 1.8));
          lastTapRef.current = { time: 0, x: 0, y: 0 };
        } else {
          lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  // Tự lưu vị trí đang đọc (chỉ khi resumeFromStorage được bật, tức trang đọc công khai)
  useEffect(() => {
    if (!resumeFromStorage) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:lastPage`, String(idx));
    } catch {
      // localStorage không khả dụng — bỏ qua
    }
    onProgress?.(idx, pages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, resumeFromStorage]);

  const toggleBookmark = (pageId) => {
    setBookmarks((prev) => {
      const next = prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId];
      try {
        localStorage.setItem(
          `${STORAGE_PREFIX}:bookmarks`,
          JSON.stringify(next),
        );
      } catch {
        // localStorage không khả dụng — bỏ qua
      }
      return next;
    });
  };

  const stop = () => {
    if (speechAvailable()) window.speechSynthesis.cancel();
    setReading(null);
    hoverSentenceKeyRef.current = null;
    if (lineHoverTimer.current) {
      clearTimeout(lineHoverTimer.current);
      lineHoverTimer.current = null;
    }
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
        setReadMode("off");
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

  // Fix: trước đây khi chuyển "Đọc to nội dung" sang Tắt trong lúc đang
  // đọc (chế độ rê chuột), tiếng vẫn không tắt vì effect trên chỉ theo
  // dõi autoPlay (chỉ đúng cho chế độ Tự động đọc). Thêm effect riêng để
  // LUÔN dừng đọc ngay khi người dùng chọn "Tắt", bất kể đang ở chế độ nào.
  useEffect(() => {
    if (readMode === "off") stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readMode]);

  // Rê chuột vào 1 từ trong văn bản: xác định câu (ngăn theo dấu chấm/
  // phẩy/chấm than/chấm hỏi/hai chấm...) chứa từ đó và CHỈ đọc to đúng
  // câu này — không đọc nguyên cả đoạn (tránh trùng với Tự động đọc).
  // Đồng thời tô sáng đúng từ đang được đọc, khớp với giọng đọc.
  const onSentenceHover = (layer, wordIndex) => {
    if (readMode !== "hover" || !speechAvailable() || !layer.text?.trim())
      return;
    const ranges = splitSentenceWordRanges(layer.text);
    const seg = ranges.find((r) => wordIndex >= r.start && wordIndex <= r.end);
    if (!seg || !seg.text) return;
    const key = `${layer.id}:${seg.start}`;
    if (hoverSentenceKeyRef.current === key) return; // đang đọc đúng câu này rồi
    if (lineHoverTimer.current) clearTimeout(lineHoverTimer.current);
    lineHoverTimer.current = setTimeout(() => {
      hoverSentenceKeyRef.current = key;
      window.speechSynthesis.cancel();
      const segWords = splitWords(seg.text);
      const utter = new SpeechSynthesisUtterance(seg.text);
      utter.lang = "vi-VN";
      utter.rate = 0.95;
      utter.onboundary = (ev) => {
        if (ev.charIndex === undefined) return;
        const localIdx = wordIndexForCharIndex(segWords, ev.charIndex);
        setReading({ layerId: layer.id, wordIndex: seg.start + localIdx });
      };
      utter.onend = () => {
        if (hoverSentenceKeyRef.current === key) {
          hoverSentenceKeyRef.current = null;
          setReading(null);
        }
      };
      window.speechSynthesis.speak(utter);
    }, 200);
  };
  const onSentenceLeave = () => {
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
  // Ref giữ bản mới nhất của goPrev/goNext để dùng trong listener chạm
  // gốc bên dưới (gắn 1 lần lúc mount, tránh closure cũ).
  const goPrevRef = useRef(goPrev);
  const goNextRef = useRef(goNext);
  goPrevRef.current = goPrev;
  goNextRef.current = goNext;
  const goToPageId = (pageId) => {
    const target = pages.findIndex((p) => p.id === pageId);
    if (target === -1) return;
    if (readMode === "auto") setReadMode("off");
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
      if (
        e.key === "Escape" &&
        (infoOpen || tocOpen || toolsOpen || timeInfoOpen)
      ) {
        setInfoOpen(false);
        setTocOpen(false);
        setToolsOpen(false);
        setTimeInfoOpen(false);
        return;
      }
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
  }, [idx, pageView, autoPlay, infoOpen, tocOpen, toolsOpen, timeInfoOpen]);

  const stageW = visiblePages.length === 2 ? PAGE_W * 2 + SPREAD_GAP : PAGE_W;
  const effectiveScale = scale * zoom;
  const pageLabel =
    visiblePages.length === 2
      ? `Trang ${idx + 1}–${idx + 2} / ${pages.length}`
      : `Trang ${idx + 1} / ${pages.length}`;
  const canGoNext = nextGroupStart(idx) !== idx;
  const canGoPrev = idx !== 0;

  const hasKidTimeLimit =
    !!kidTimeInfo && Number(kidTimeInfo.dailyLimitMinutes) > 0;
  const remainingMinutes = hasKidTimeLimit
    ? Math.max(
        0,
        Math.round(
          kidTimeInfo.dailyLimitMinutes - (kidTimeInfo.todayMinutes || 0),
        ),
      )
    : null;
  const usedPct = hasKidTimeLimit
    ? Math.min(
        100,
        Math.round(
          ((kidTimeInfo.todayMinutes || 0) / kidTimeInfo.dailyLimitMinutes) *
            100,
        ),
      )
    : 0;
  const timeIsLow = remainingMinutes != null && remainingMinutes <= 10;

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

        <div className="er-topbar-spacer" />

        {hasKidTimeLimit && (
          <div className="er-tool-group" ref={timeBoxRef}>
            <button
              className={`er-tool-btn er-time-btn ${timeInfoOpen ? "active" : ""} ${
                timeIsLow ? "warn" : ""
              }`}
              title="Giờ đọc còn lại hôm nay (ba mẹ thiết lập)"
              onClick={() => setTimeInfoOpen((v) => !v)}
            >
              <Clock size={15} />
              <span className="er-tool-label">Còn {remainingMinutes} phút</span>
            </button>
            {timeInfoOpen && (
              <div className="er-popover er-time-popover">
                <div className="er-time-popover-row">
                  <span>Đã đọc hôm nay</span>
                  <strong>{kidTimeInfo.todayMinutes || 0} phút</strong>
                </div>
                <div className="er-time-bar">
                  <div
                    className={`er-time-bar-fill ${timeIsLow ? "warn" : ""}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <div className="er-time-popover-row">
                  <span>Ba mẹ cho phép</span>
                  <strong>{kidTimeInfo.dailyLimitMinutes} phút/ngày</strong>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="er-tool-group">
          <button
            className={`er-icon-btn er-hamburger-btn ${toolsOpen ? "active" : ""}`}
            title={toolsOpen ? "Ẩn công cụ" : "Công cụ"}
            onClick={() => setToolsOpen((v) => !v)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="er-stage"
        onDoubleClick={() => setZoom((z) => (z > 1.05 ? 1 : 1.8))}
      >
        <div
          style={{
            width: stageW * effectiveScale,
            height: PAGE_H * effectiveScale,
            perspective: 1600,
          }}
        >
          <div
            key={idx}
            className={`er-flip er-flip--${direction} ${
              visiblePages.length === 2 ? "er-flip--spread" : ""
            }`}
          >
            <div
              className="er-spread"
              style={{
                width: stageW,
                height: PAGE_H,
                transform: `scale(${effectiveScale})`,
                gap: SPREAD_GAP,
              }}
            >
              {visiblePages.map((p, i) => {
                const globalIndex = idx + i;
                return (
                  <div
                    key={p.id}
                    className="er-page"
                    style={{
                      width: p.width || PAGE_W,
                      height: p.height || PAGE_H,
                      borderRadius: p.borderRadius ?? PAGE_RADIUS,
                      ...pageBackgroundStyle(p),
                    }}
                  >
                    {p.layers.map((layer) => (
                      <LayerView
                        key={layer.id}
                        layer={layer}
                        selected={false}
                        readOnly
                        isReadingThis={reading?.layerId === layer.id}
                        readingWordIndex={reading?.wordIndex}
                        onSelect={() => {}}
                        onDragStart={() => {}}
                        onResizeStart={() => {}}
                        onSentenceHover={onSentenceHover}
                        onSentenceLeave={onSentenceLeave}
                        forceWordSpans
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

      <div
        className={`er-side-hotspot er-side-hotspot--left ${
          leftNavActive ? "er-side-hotspot--visible" : ""
        }`}
        onMouseEnter={showLeftNav}
        onMouseMove={showLeftNav}
        onMouseLeave={() => scheduleHideLeftNav()}
        onTouchStart={() => {
          showLeftNav();
          scheduleHideLeftNav(2000);
        }}
      >
        <button
          className="er-side-nav-btn"
          onClick={goPrev}
          disabled={!canGoPrev}
          title="Trang trước"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div
        className={`er-side-hotspot er-side-hotspot--right ${
          rightNavActive ? "er-side-hotspot--visible" : ""
        }`}
        onMouseEnter={showRightNav}
        onMouseMove={showRightNav}
        onMouseLeave={() => scheduleHideRightNav()}
        onTouchStart={() => {
          showRightNav();
          scheduleHideRightNav(2000);
        }}
      >
        <button
          className="er-side-nav-btn"
          onClick={goNext}
          disabled={!canGoNext}
          title="Trang sau"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div
        className={`er-bottom-hotspot ${
          bottomBarActive ? "er-bottom-hotspot--visible" : ""
        }`}
        onMouseEnter={showBottomBar}
        onMouseMove={showBottomBar}
        onMouseLeave={() => scheduleHideBottomBar()}
        onTouchStart={() => {
          showBottomBar();
          scheduleHideBottomBar(2200);
        }}
      >
        <span className="er-bottom-hint" />
        <div
          className={`er-bottombar ${
            bottomBarActive ? "er-bottombar--visible" : ""
          }`}
        >
          <button className="er-nav-btn" onClick={goPrev} disabled={!canGoPrev}>
            <ChevronLeft size={18} />
          </button>
          <div className="er-page-dots">
            {pages.map((p, i) => {
              const isActive =
                pageView === "double" ? i === idx || i === idx + 1 : i === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  ref={isActive ? activeDotRef : null}
                  className={`er-page-dot ${isActive ? "active" : ""} ${
                    isActive && reading ? "is-reading" : ""
                  }`}
                  onClick={() => {
                    showBottomBar();
                    scheduleHideBottomBar();
                    if (i === idx) return;
                    if (!autoPlay) stop();
                    setDirection(i >= idx ? "next" : "prev");
                    setIdx(groupStartFor(i));
                  }}
                >
                  {i + 1}
                  {bookmarks.includes(p.id) && (
                    <span className="er-page-dot-mark" />
                  )}
                </button>
              );
            })}
          </div>
          <button className="er-nav-btn" onClick={goNext} disabled={!canGoNext}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {infoOpen && (
        <div className="er-info-backdrop" onClick={() => setInfoOpen(false)}>
          <div className="er-info-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="er-info-drawer-head">
              <h3>Thông tin sách</h3>
              <button
                className="er-icon-btn"
                onClick={() => setInfoOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="er-info-scroll">
              {bookInfo ? (
                <>
                  <div className="er-info-cover-wrap">
                    {bookInfo.coverImage ? (
                      <img
                        className="er-info-cover"
                        src={bookInfo.coverImage}
                        alt={bookInfo.title || ""}
                      />
                    ) : (
                      <div className="er-info-cover er-info-cover--placeholder">
                        <BookOpen size={40} />
                      </div>
                    )}
                    <div className="er-info-cover-fade" />
                  </div>

                  <div className="er-info-body">
                    <h2 className="er-info-title">{bookInfo.title}</h2>

                    {bookInfo.authors?.length > 0 && (
                      <div className="er-info-authors">
                        <span className="er-info-authors-icon">
                          <User size={13} />
                        </span>
                        <span>{bookInfo.authors.join(", ")}</span>
                      </div>
                    )}

                    <div className="er-info-meta">
                      {!!bookInfo.categoryName && (
                        <span className="er-info-tag er-info-tag--accent">
                          <Tag size={12} />
                          {bookInfo.categoryName}
                        </span>
                      )}
                      {!!(bookInfo.ageMin || bookInfo.ageMax) && (
                        <span className="er-info-tag">
                          <Users size={12} />
                          {bookInfo.ageMin != null && bookInfo.ageMax != null
                            ? `${bookInfo.ageMin}-${bookInfo.ageMax} tuổi`
                            : bookInfo.ageMin != null
                              ? `Từ ${bookInfo.ageMin} tuổi`
                              : `Đến ${bookInfo.ageMax} tuổi`}
                        </span>
                      )}
                      {!!bookInfo.pages && (
                        <span className="er-info-tag">
                          <BookOpen size={12} />
                          {bookInfo.pages} trang
                        </span>
                      )}
                      {!!bookInfo.publisher && (
                        <span className="er-info-tag">
                          <Building2 size={12} />
                          NXB {bookInfo.publisher}
                        </span>
                      )}
                      {!!bookInfo.publishYear && (
                        <span className="er-info-tag">
                          <Calendar size={12} />
                          {bookInfo.publishYear}
                        </span>
                      )}
                      {!!bookInfo.language && (
                        <span className="er-info-tag">
                          <Globe size={12} />
                          {bookInfo.language === "VI"
                            ? "Tiếng Việt"
                            : bookInfo.language}
                        </span>
                      )}
                    </div>

                    {!!bookInfo.description && (
                      <>
                        <div className="er-info-divider" />
                        <div className="er-info-section-label">Giới thiệu</div>
                        <p className="er-info-desc">{bookInfo.description}</p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="er-info-body er-info-body--empty">
                  <div className="er-info-empty-icon">
                    <BookOpen size={30} />
                  </div>
                  <h2 className="er-info-title">
                    {page?.title || "Sách điện tử"}
                  </h2>
                  <p className="er-info-desc">
                    Chưa có thông tin chi tiết cho sách này.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tocOpen && (
        <div className="er-info-backdrop" onClick={() => setTocOpen(false)}>
          <div className="er-info-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="er-info-drawer-head">
              <h3>Mục lục</h3>
              <button className="er-icon-btn" onClick={() => setTocOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="er-info-scroll">
              <div className="er-toc-list">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`er-toc-item ${i === idx ? "active" : ""}`}
                    onClick={() => {
                      if (readMode === "auto") setReadMode("off");
                      stop();
                      setDirection(i >= idx ? "next" : "prev");
                      setIdx(groupStartFor(i));
                      setTocOpen(false);
                    }}
                  >
                    <span className="er-toc-num">{i + 1}</span>
                    <span className="er-toc-title">
                      {p.title || `Trang ${i + 1}`}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="er-toc-star"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(p.id);
                      }}
                    >
                      {bookmarks.includes(p.id) ? (
                        <BookmarkCheck size={15} />
                      ) : (
                        <Bookmark size={15} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toolsOpen && (
        <div className="er-info-backdrop" onClick={() => setToolsOpen(false)}>
          <div className="er-tools-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="er-tools-drawer-head">
              <div className="er-tools-drawer-head-text">
                <h3>Công cụ đọc sách</h3>
                <span>{pageLabel}</span>
              </div>
              <button
                className="er-icon-btn"
                onClick={() => setToolsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="er-tools-drawer-scroll">
              <div className="er-tools-section">
                <div className="er-tools-section-label">Điều hướng</div>

                <button
                  className={`er-tools-row ${tocOpen ? "active" : ""}`}
                  onClick={() => {
                    setToolsOpen(false);
                    setInfoOpen(false);
                    setTocOpen(true);
                  }}
                >
                  <span className="er-tools-row-icon">
                    <List size={17} />
                  </span>
                  <span className="er-tools-row-body">
                    <span className="er-tools-row-title">Mục lục</span>
                    <span className="er-tools-row-desc">
                      Xem và nhảy nhanh tới từng trang
                    </span>
                  </span>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </button>

                <button
                  className={`er-tools-row ${
                    page && bookmarks.includes(page.id) ? "active" : ""
                  }`}
                  onClick={() => page && toggleBookmark(page.id)}
                >
                  <span className="er-tools-row-icon">
                    {page && bookmarks.includes(page.id) ? (
                      <BookmarkCheck size={17} />
                    ) : (
                      <Bookmark size={17} />
                    )}
                  </span>
                  <span className="er-tools-row-body">
                    <span className="er-tools-row-title">
                      {page && bookmarks.includes(page.id)
                        ? "Đã đánh dấu trang này"
                        : "Đánh dấu trang này"}
                    </span>
                    <span className="er-tools-row-desc">
                      Lưu lại để quay về nhanh
                    </span>
                  </span>
                </button>

                <button
                  className={`er-tools-row ${infoOpen ? "active" : ""}`}
                  onClick={() => {
                    setToolsOpen(false);
                    setTocOpen(false);
                    setInfoOpen(true);
                  }}
                >
                  <span className="er-tools-row-icon">
                    <Info size={17} />
                  </span>
                  <span className="er-tools-row-body">
                    <span className="er-tools-row-title">Thông tin sách</span>
                    <span className="er-tools-row-desc">
                      Tác giả, NXB, độ tuổi phù hợp...
                    </span>
                  </span>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </button>
              </div>

              <div className="er-tools-section">
                <div className="er-tools-section-label">Hiển thị</div>

                <div className="er-tools-swatch-grid">
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      className={`er-tools-swatch ${theme === key ? "active" : ""}`}
                      onClick={() => setTheme(key)}
                    >
                      <span className={`er-swatch-dot er-swatch-dot--${key}`} />
                      <span className="er-tools-swatch-label">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="er-tools-inline-row" style={{ marginTop: 8 }}>
                  <span className="er-tools-inline-label">
                    <span className="er-tools-row-icon">
                      <ZoomIn size={15} />
                    </span>
                    Cỡ trang
                  </span>
                  <div className="er-zoom-group">
                    <button
                      className="er-tool-btn"
                      title="Thu nhỏ trang"
                      onClick={() =>
                        setZoom((s) => Math.max(0.6, +(s - 0.15).toFixed(2)))
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span className="er-font-value">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      className="er-tool-btn"
                      title="Phóng to trang"
                      onClick={() =>
                        setZoom((s) => Math.min(2.2, +(s + 0.15).toFixed(2)))
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button className="er-tools-row" onClick={togglePageView}>
                  <span className="er-tools-row-icon">
                    <BookOpen size={17} />
                  </span>
                  <span className="er-tools-row-body">
                    <span className="er-tools-row-title">Kiểu xem</span>
                    <span className="er-tools-row-desc">
                      Bấm để đổi cách hiển thị trang
                    </span>
                  </span>
                  <span className="er-tools-row-trailing">
                    {pageView === "double" ? "2 trang" : "1 trang"}
                  </span>
                </button>

                <button
                  className={`er-tools-row ${isFullscreen ? "active" : ""}`}
                  onClick={toggleFullscreen}
                >
                  <span className="er-tools-row-icon">
                    <Maximize2 size={17} />
                  </span>
                  <span className="er-tools-row-body">
                    <span className="er-tools-row-title">Toàn màn hình</span>
                    <span className="er-tools-row-desc">
                      {isFullscreen ? "Đang bật" : "Xem sách lớn hơn"}
                    </span>
                  </span>
                </button>
              </div>

              <div className="er-tools-section">
                <div className="er-tools-section-label">Đọc to nội dung</div>
                <div className="er-tools-segmented">
                  <button
                    className={readMode === "off" ? "active" : ""}
                    onClick={() => setReadMode("off")}
                  >
                    <VolumeX size={16} />
                    Tắt
                  </button>
                  <button
                    className={readMode === "auto" ? "active" : ""}
                    onClick={() => setReadMode("auto")}
                  >
                    <Volume2 size={16} />
                    Tự động
                  </button>
                  <button
                    className={`${readMode === "hover" ? "active" : ""} listening`}
                    onClick={() => setReadMode("hover")}
                  >
                    <MousePointer size={16} />
                    Khi rê chuột
                  </button>
                </div>
              </div>
            </div>
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
  const [hoverSpeakMuted, setHoverSpeakMuted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [colorStudioOpen, setColorStudioOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [logoError, setLogoError] = useState(false);
  const [, bump] = useState(0);

  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [bgRemoveTolerance, setBgRemoveTolerance] = useState(20);
  const [bgRemoving, setBgRemoving] = useState(false);

  // Set các layer ảnh đang trong quá trình upload lên Cloudinary — không lưu vào
  // `pages` (tránh polluting payload autosave), chỉ là state UI thuần tuý.
  const [uploadingLayerIds, setUploadingLayerIds] = useState(() => new Set());
  const [imageDropActive, setImageDropActive] = useState(false);

  const [dragLayerId, setDragLayerId] = useState(null);
  const [dragOverLayerId, setDragOverLayerId] = useState(null);
  const [dragPageId, setDragPageId] = useState(null);
  const [dragOverPageId, setDragOverPageId] = useState(null);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const imageUploadTargetIdRef = useRef(null);
  const multiImageInputRef = useRef(null);
  const pageBgFileInputRef = useRef(null);
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

  const PAGE_W =
    currentPage?.width ||
    (orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W);
  const PAGE_H =
    currentPage?.height ||
    (orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H);
  const PAGE_RADIUS = currentPage?.borderRadius ?? 10;

  // ─ Soạn thảo chữ theo từng đoạn (tô đậm/tô màu 1 phần trong câu) ─
  const [editingTextId, setEditingTextId] = useState(null);
  const editableRef = useRef(null);
  const savedRangeRef = useRef(null);

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
    // Chờ 1 khung hình để layout (panel bên mở/đóng) ổn định trước khi đo lại.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [autoFit, activePanel, PAGE_W, PAGE_H]);

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

  // Bắt đầu sửa 1 lớp chữ trực tiếp trên trang (nhấp đúp) để có thể bôi đen 1 phần
  // và chỉ đổi định dạng (đậm/màu) của phần đó, thay vì áp dụng cho cả dòng.
  const startEditText = (id) => {
    if (selectedId !== id) selectLayer(id);
    savedRangeRef.current = null;
    setEditingTextId(id);
  };

  const commitEditText = (id) => {
    const el = editableRef.current;
    setEditingTextId(null);
    savedRangeRef.current = null;
    if (!el) return;
    const html = sanitizeRichHtml(el.innerHTML);
    const text = el.innerText || el.textContent || "";
    updateLayer(id, { html, text }, { commit: true });
  };

  // Ghi nhớ vùng bôi đen hiện tại trong lúc soạn thảo — cần thiết vì khi người dùng
  // bấm nút Đậm/Nghiêng/Màu chữ ở bảng bên, ô soạn thảo có thể tạm mất focus.
  const handleTextSelectionChange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSavedSelection = () => {
    const el = editableRef.current;
    if (!el || !savedRangeRef.current) return null;
    el.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
    return sel;
  };

  // Áp dụng đậm / nghiêng / gạch chân: nếu đang bôi đen 1 đoạn chữ thì chỉ đổi đoạn đó,
  // ngược lại (không có vùng chọn) thì giữ hành vi cũ — đổi định dạng mặc định cả lớp chữ.
  const applyTextFormat = (command) => {
    if (!selected) return;
    if (editingTextId === selected.id && editableRef.current) {
      const sel = restoreSavedSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        document.execCommand(command, false, null);
        const newSel = window.getSelection();
        if (newSel && newSel.rangeCount > 0) {
          savedRangeRef.current = newSel.getRangeAt(0).cloneRange();
        }
        const html = sanitizeRichHtml(editableRef.current.innerHTML);
        const text =
          editableRef.current.innerText ||
          editableRef.current.textContent ||
          "";
        updateLayer(selected.id, { html, text }, { commit: true });
        return;
      }
    }
    if (command === "bold")
      updateLayer(selected.id, { bold: !selected.bold }, { commit: true });
    if (command === "italic")
      updateLayer(selected.id, { italic: !selected.italic }, { commit: true });
    if (command === "underline")
      updateLayer(
        selected.id,
        { underline: !selected.underline },
        { commit: true },
      );
  };

  // Đổi màu chữ: nếu đang bôi đen 1 đoạn thì chỉ tô màu đoạn đó, còn không thì đổi màu
  // mặc định của cả lớp chữ như trước.
  const applyTextColor = (color) => {
    if (!selected) return;
    if (
      editingTextId === selected.id &&
      editableRef.current &&
      savedRangeRef.current
    ) {
      const sel = restoreSavedSelection();
      if (sel && !sel.isCollapsed) {
        document.execCommand("foreColor", false, color);
        const newSel = window.getSelection();
        if (newSel && newSel.rangeCount > 0) {
          savedRangeRef.current = newSel.getRangeAt(0).cloneRange();
        }
        const html = sanitizeRichHtml(editableRef.current.innerHTML);
        const text =
          editableRef.current.innerText ||
          editableRef.current.textContent ||
          "";
        updateLayer(selected.id, { html, text }, { commit: true });
        return;
      }
    }
    updateLayer(selected.id, { color });
  };

  useEffect(() => {
    if (!editingTextId) return;
    const el = editableRef.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editingTextId]);

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
    multiImageInputRef.current?.click();
  };
  const handleMultiImageInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    applyMultipleImageFiles(files);
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

  const MAX_IMAGE_MB = 15;

  // Upload 1 ảnh lên Cloudinary và gán vào layer đã tồn tại (thêm mới hoặc thay ảnh cũ).
  // Khác bản cũ (nhúng base64 trực tiếp vào `pages`): giờ chỉ lưu URL Cloudinary — payload
  // autosave nhẹ hơn nhiều, ảnh có CDN + cache trình duyệt, và có thể xoá khỏi Cloudinary
  // khi không còn dùng (tránh rác lưu trữ tích luỹ qua nhiều lần chỉnh sửa).
  const applyImageFile = async (file, layerId) => {
    if (!file || !layerId || !file.type?.startsWith("image/")) {
      if (file && !file.type?.startsWith("image/")) {
        toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, WebP...).");
      }
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(
        `Ảnh quá lớn (tối đa ${MAX_IMAGE_MB}MB), vui lòng chọn ảnh nhỏ hơn.`,
      );
      return;
    }

    const prevSrc = currentPage.layers.find((l) => l.id === layerId)?.src || "";
    setUploadingLayerIds((prev) => new Set(prev).add(layerId));
    try {
      // Resize trước khi upload — giảm dung lượng thật sự (không chỉ chặn cứng theo MB), ảnh
      // chụp điện thoại/máy ảnh hiện đại thường 3000-4000px trong khi khung hiển thị ebook nhỏ hơn nhiều.
      const optimized = await resizeImageFileIfNeeded(file);
      const res = await ebookService.uploadImage(optimized, ebookIdRef.current);
      const url = res.data?.data?.url;
      if (!url) throw new Error("Không nhận được URL ảnh từ máy chủ");
      beginEdit();
      updateLayer(layerId, { src: url });
      endEdit();
      // Xoá ảnh cũ trên Cloudinary sau khi đã gán ảnh mới thành công (thay ảnh) — không
      // chặn UI chờ việc này, và không báo lỗi nếu xoá thất bại (ảnh cũ mồ côi chấp nhận được,
      // còn hơn để lỗi xoá làm gián đoạn luồng chính là "đổi ảnh mới").
      if (prevSrc && prevSrc.includes("cloudinary")) {
        ebookService.deleteImage(prevSrc).catch(() => {});
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không tải được ảnh lên, vui lòng thử lại.",
      );
    } finally {
      setUploadingLayerIds((prev) => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
    }
  };

  // Đặt ảnh nền cho trang hiện tại (khác với ảnh dạng layer — ảnh nền luôn nằm dưới cùng và
  // có thể canh vị trí / kiểu hiển thị riêng).
  const applyPageBackgroundImage = async (file) => {
    if (!file || !file.type?.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, WebP...).");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(
        `Ảnh quá lớn (tối đa ${MAX_IMAGE_MB}MB), vui lòng chọn ảnh nhỏ hơn.`,
      );
      return;
    }
    const prevUrl = currentPage.backgroundImage;
    try {
      const optimized = await resizeImageFileIfNeeded(file);
      const res = await ebookService.uploadImage(optimized, ebookIdRef.current);
      const url = res.data?.data?.url;
      if (!url) throw new Error("Không nhận được URL ảnh từ máy chủ");
      setPagesCommit((prev) =>
        prev.map((p, i) =>
          i === pageIndex ? { ...p, backgroundImage: url } : p,
        ),
      );
      if (prevUrl && prevUrl.includes("cloudinary")) {
        ebookService.deleteImage(prevUrl).catch(() => {});
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không tải được ảnh nền lên, vui lòng thử lại.",
      );
    }
  };
  const removePageBackgroundImage = () => {
    const prevUrl = currentPage.backgroundImage;
    setPagesCommit((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, backgroundImage: "" } : p)),
    );
    if (prevUrl && prevUrl.includes("cloudinary")) {
      ebookService.deleteImage(prevUrl).catch(() => {});
    }
  };
  const setPageBgImagePosition = (axis, value) =>
    setPagesLive((prev) =>
      prev.map((p, i) =>
        i === pageIndex
          ? {
              ...p,
              bgImagePosition: {
                ...(p.bgImagePosition || { x: 50, y: 50 }),
                [axis]: value,
              },
            }
          : p,
      ),
    );
  const setPageBgImageSize = (size) =>
    setPagesLive((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, bgImageSize: size } : p)),
    );

  // Dùng luôn ảnh của layer ảnh đang chọn để làm nền cho trang — không cần tải lên lại,
  // chỉ gán URL ảnh (đã có sẵn trên Cloudinary) vào ảnh nền của trang.
  const setLayerImageAsPageBackground = (src) => {
    if (!src) return;
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, backgroundImage: src } : p,
      ),
    );
    toast.success(
      "Đã đặt làm ảnh nền trang. Vào tab Trang để chỉnh vị trí/kiểu hiển thị nếu cần.",
    );
  };

  // Nhiều ảnh cùng lúc (chọn nhiều file, kéo-thả nhiều file, hoặc dán nhiều ảnh) — mỗi ảnh
  // tạo 1 layer mới, xếp lệch nhau 1 chút để không đè hoàn toàn lên nhau, và tự chọn ảnh cuối.
  const applyMultipleImageFiles = (files) => {
    const list = Array.from(files || []).filter((f) =>
      f.type?.startsWith("image/"),
    );
    if (!list.length) {
      toast.error("Không tìm thấy file ảnh hợp lệ.");
      return;
    }
    const newLayers = list.map((_, i) =>
      defaultImageLayer({
        x: defaultImageLayer().x + i * 18,
        y: defaultImageLayer().y + i * 18,
      }),
    );
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, ...newLayers] } : p,
      ),
    );
    list.forEach((file, i) => applyImageFile(file, newLayers[i].id));
    if (newLayers.length === 1) {
      selectLayer(newLayers[0].id);
    } else {
      setSelectedId(null);
      setMultiIds(newLayers.map((l) => l.id));
      setActivePanel("layers");
    }
  };

  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const targetId = imageUploadTargetIdRef.current || selectedId;
    imageUploadTargetIdRef.current = null;
    if (!files.length || !targetId) return;
    applyImageFile(files[0], targetId);
  };
  const openFilePickerForLayer = (layerId) => {
    imageUploadTargetIdRef.current = layerId;
    selectLayer(layerId);
    imageFileInputRef.current?.click();
  };
  const handleImageDropOnLayer = (e, layerId) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDropActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) applyImageFile(file, layerId);
  };
  // Thả ảnh vào vùng trống của canvas (không trúng layer nào) — tự tạo layer mới tại đúng
  // vị trí con trỏ thả xuống, quy đổi từ toạ độ màn hình sang toạ độ trang theo `scale` hiện tại.
  const handleImageDropOnCanvas = (e) => {
    e.preventDefault();
    setImageDropActive(false);
    const files = e.dataTransfer.files;
    if (!files || !files.length) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type?.startsWith("image/"),
    );
    if (!imageFiles.length) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const dropX = rect
      ? (e.clientX - rect.left) / scale
      : defaultImageLayer().x;
    const dropY = rect ? (e.clientY - rect.top) / scale : defaultImageLayer().y;

    const newLayers = imageFiles.map((_, i) =>
      defaultImageLayer({
        x: Math.max(0, dropX - 80) + i * 18,
        y: Math.max(0, dropY - 60) + i * 18,
      }),
    );
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, ...newLayers] } : p,
      ),
    );
    imageFiles.forEach((file, i) => applyImageFile(file, newLayers[i].id));
    if (newLayers.length === 1) {
      selectLayer(newLayers[0].id);
    } else {
      setSelectedId(null);
      setMultiIds(newLayers.map((l) => l.id));
      setActivePanel("layers");
    }
  };
  // Dán ảnh từ clipboard (Ctrl+V sau khi copy ảnh từ nơi khác, hoặc screenshot). Nếu đang chọn
  // sẵn 1 layer ảnh, dán để THAY ảnh layer đó; nếu không, tạo layer mới ở giữa trang.
  const handleImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = Array.from(items).find((it) =>
      it.type?.startsWith("image/"),
    );
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();

    const selectedLayer = currentPage.layers.find((l) => l.id === selectedId);
    if (selectedLayer && selectedLayer.type === "image") {
      applyImageFile(file, selectedId);
      return;
    }
    const layer = defaultImageLayer();
    setPagesCommit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    );
    selectLayer(layer.id);
    applyImageFile(file, layer.id);
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

  // Đổi khổ giấy (rộng × cao, tính bằng px) cho TOÀN BỘ sách — co giãn lại vị trí & kích
  // thước mọi lớp nội dung theo đúng tỉ lệ mới, để bố cục không bị vỡ khi đổi khổ.
  const resizeAllPagesTo = (newW, newH) => {
    const oldW = PAGE_W,
      oldH = PAGE_H;
    if (newW === oldW && newH === oldH) return;
    const rx = newW / oldW,
      ry = newH / oldH;
    setPagesCommit((prev) =>
      prev.map((p) => ({
        ...p,
        width: newW,
        height: newH,
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
  };

  const changeOrientation = (next) => {
    if (next === orientation) return;
    resizeAllPagesTo(PAGE_H, PAGE_W);
    setOrientation(next);
  };

  // Người dùng tự đặt chiều rộng / chiều cao khổ giấy theo pixel (áp dụng cho toàn bộ sách).
  const setCustomPageWidth = (w) =>
    resizeAllPagesTo(Math.max(200, Math.round(w) || PAGE_W), PAGE_H);
  const setCustomPageHeight = (h) =>
    resizeAllPagesTo(PAGE_W, Math.max(200, Math.round(h) || PAGE_H));

  // Độ bo góc trang (áp dụng cho toàn bộ sách, giống khổ giấy).
  const setAllPagesBorderRadius = (radius) =>
    setPagesLive((prev) =>
      prev.map((p) => ({ ...p, borderRadius: Math.max(0, radius) })),
    );

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
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        !!document.activeElement?.isContentEditable;
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

  useEffect(() => {
    const onPaste = (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (typing) return;
      handleImagePaste(e);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pages, pageIndex]);

  const onWordHover = (wordObj) => {
    if (hoverSpeakMuted) return;
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

  // Áp dụng 1 màu từ Bảng phối màu vào đúng chỗ đang thao tác:
  // đang chọn hình khối -> tô nền hình; đang chọn chữ -> đổi màu chữ;
  // không chọn gì -> đổi màu nền trang hiện tại.
  const handleApplyPaletteColor = (hex) => {
    if (selected && selected.type === "shape") {
      updateLayer(selected.id, { fill: hex }, { commit: true });
      toast.success(`Đã tô ${hex.toUpperCase()} vào hình khối đang chọn`);
    } else if (selected && selected.type === "text") {
      updateLayer(selected.id, { color: hex }, { commit: true });
      toast.success(`Đã đổi màu chữ thành ${hex.toUpperCase()}`);
    } else {
      beginEdit();
      setPageBackground(hex);
      endEdit();
      toast.success(`Đã đặt ${hex.toUpperCase()} làm màu nền trang`);
    }
  };

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
      <div className="bb-header">
        <div className="bb-brand">
          {logoError ? (
            <div className="bb-brand-mark bb-brand-mark-fallback">
              <BookOpen size={19} color="#fff" strokeWidth={2.2} />
            </div>
          ) : (
            <img
              src="/logo/logo-mau/lg-m-chinh.png"
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
          <button
            className="bb-btn"
            title={
              hoverSpeakMuted
                ? "Bật đọc từ khi rê chuột"
                : "Tắt đọc từ khi rê chuột"
            }
            onClick={() => {
              setHoverSpeakMuted((prev) => {
                const next = !prev;
                if (next) {
                  lastHoverWord.current = null;
                  if (speechAvailable()) window.speechSynthesis.cancel();
                }
                return next;
              });
            }}
          >
            {hoverSpeakMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {hoverSpeakMuted ? "Đã tắt rê đọc" : "Rê đọc: Bật"}
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
            <ImageIcon size={18} />
            <span>Ảnh</span>
          </button>
          <input
            ref={multiImageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleMultiImageInputChange}
          />
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageFileChange}
          />
          <input
            ref={pageBgFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              e.target.value = "";
              if (file) applyPageBackgroundImage(file);
            }}
          />
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
          <button
            className={`bb-rail-btn${colorStudioOpen ? " active" : ""}`}
            onClick={() => setColorStudioOpen(true)}
            title="Bảng phối màu"
          >
            <SwatchBook size={18} />
            <span>Màu</span>
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
              <label>Ảnh nền trang</label>
              {currentPage.backgroundImage ? (
                <>
                  <div className="bb-bgimg-preview">
                    <img src={currentPage.backgroundImage} alt="" />
                  </div>
                  <div className="bb-row3" style={{ marginTop: 8 }}>
                    <button
                      className="bb-btn"
                      onClick={() => pageBgFileInputRef.current?.click()}
                    >
                      <Upload size={14} /> Đổi ảnh
                    </button>
                    <button
                      className="bb-btn"
                      onClick={removePageBackgroundImage}
                    >
                      <Trash2 size={14} /> Xoá ảnh nền
                    </button>
                  </div>
                  <div className="bb-field" style={{ marginTop: 10 }}>
                    <label>Kiểu hiển thị</label>
                    <div className="bb-row3">
                      <button
                        className={`bb-btn${(currentPage.bgImageSize || "cover") === "cover" ? " active" : ""}`}
                        onClick={() => setPageBgImageSize("cover")}
                      >
                        Lấp đầy
                      </button>
                      <button
                        className={`bb-btn${currentPage.bgImageSize === "contain" ? " active" : ""}`}
                        onClick={() => setPageBgImageSize("contain")}
                      >
                        Vừa khung
                      </button>
                      <button
                        className={`bb-btn${currentPage.bgImageSize === "stretch" ? " active" : ""}`}
                        onClick={() => setPageBgImageSize("stretch")}
                      >
                        Kéo giãn
                      </button>
                    </div>
                  </div>
                  <div className="bb-field" style={{ marginTop: 10 }}>
                    <label>
                      Vị trí ngang (
                      {Math.round(currentPage.bgImagePosition?.x ?? 50)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentPage.bgImagePosition?.x ?? 50}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        setPageBgImagePosition("x", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="bb-field">
                    <label>
                      Vị trí dọc (
                      {Math.round(currentPage.bgImagePosition?.y ?? 50)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentPage.bgImagePosition?.y ?? 50}
                      onFocus={beginEdit}
                      onBlur={endEdit}
                      onChange={(e) =>
                        setPageBgImagePosition("y", Number(e.target.value))
                      }
                    />
                  </div>
                </>
              ) : (
                <button
                  className="bb-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => pageBgFileInputRef.current?.click()}
                >
                  <ImageIcon size={14} /> Chọn ảnh nền
                </button>
              )}
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
              <div className="bb-color-size" style={{ marginTop: 8 }}>
                <input
                  type="number"
                  min={200}
                  max={4000}
                  value={Math.round(PAGE_W)}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => setCustomPageWidth(Number(e.target.value))}
                />
                <span style={{ fontSize: 12, color: "#6b7a72" }}>×</span>
                <input
                  type="number"
                  min={200}
                  max={4000}
                  value={Math.round(PAGE_H)}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => setCustomPageHeight(Number(e.target.value))}
                />
                <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
              </div>
              <div className="bb-hint">
                Tự đặt chiều rộng &amp; chiều cao theo pixel nếu không muốn dùng
                khổ Ngang/Dọc mặc định.
              </div>
            </div>
            <div className="bb-field">
              <label>Độ bo góc trang ({Math.round(PAGE_RADIUS)}px)</label>
              <input
                type="range"
                min={0}
                max={80}
                value={PAGE_RADIUS}
                onFocus={beginEdit}
                onBlur={endEdit}
                onChange={(e) =>
                  setAllPagesBorderRadius(Number(e.target.value))
                }
              />
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
                      <button
                        key={ac.id}
                        type="button"
                        className="bb-btn bb-qr-pick-btn"
                        onClick={() => addQrLayer("AR", ac)}
                      >
                        <span className="bb-qr-pick-label">
                          <Sparkles size={13} />
                          {ac.label}
                        </span>
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
                      <button
                        key={g.id}
                        type="button"
                        className="bb-btn bb-qr-pick-btn"
                        onClick={() => addQrLayer("GAME", g)}
                      >
                        <span className="bb-qr-pick-label">
                          <Play size={13} />
                          {g.title}
                        </span>
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
                    layer.src ? (
                      <img
                        src={layer.src}
                        alt=""
                        className="bb-layer-thumb"
                        style={{
                          opacity: uploadingLayerIds.has(layer.id) ? 0.4 : 1,
                        }}
                      />
                    ) : (
                      <ImageIcon size={12} />
                    )
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
                    ? uploadingLayerIds.has(layer.id)
                      ? "Đang tải ảnh lên…"
                      : layer.src
                        ? "Hình ảnh"
                        : "(chưa có ảnh)"
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
                </div>
                <div className="bb-field">
                  <button
                    type="button"
                    className="bb-btn"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={!selected.src}
                    onClick={() => setLayerImageAsPageBackground(selected.src)}
                  >
                    <ImageIcon size={14} /> Đặt ảnh này làm nền trang
                  </button>
                </div>
                <div className="bb-field">
                  <label>Bo góc ({selected.borderRadius ?? 0}px)</label>
                  <input
                    type="range"
                    min={0}
                    max={120}
                    value={selected.borderRadius ?? 0}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChange={(e) =>
                      updateLayer(selected.id, {
                        borderRadius: Number(e.target.value),
                      })
                    }
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
                      updateLayer(selected.id, {
                        text: e.target.value,
                        html: null,
                      })
                    }
                  />
                  <div className="bb-hint">
                    Muốn tô đậm hoặc đổi màu riêng 1 vài chữ trong câu? Nhấp đúp
                    vào dòng chữ đó trên trang, bôi đen phần muốn đổi rồi dùng
                    các nút Đậm / Nghiêng / Màu chữ bên dưới.
                  </div>
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
                      title="Đậm (bôi đen 1 đoạn để chỉ đổi đoạn đó)"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyTextFormat("bold")}
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.italic ? " active" : ""}`}
                      title="Nghiêng (bôi đen 1 đoạn để chỉ đổi đoạn đó)"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyTextFormat("italic")}
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      className={`bb-btn${selected.underline ? " active" : ""}`}
                      title="Gạch chân (bôi đen 1 đoạn để chỉ đổi đoạn đó)"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyTextFormat("underline")}
                    >
                      <Underline size={14} />
                    </button>
                  </div>
                  {editingTextId === selected.id && (
                    <div className="bb-hint">
                      Đang sửa trực tiếp trên trang: bôi đen phần chữ muốn đổi
                      rồi bấm nút ở trên — chỉ phần được bôi đen sẽ thay đổi.
                    </div>
                  )}
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
                    <button
                      className={`bb-btn${selected.align === "justify" ? " active" : ""}`}
                      title="Canh đều 2 bên"
                      onClick={() =>
                        updateLayer(
                          selected.id,
                          { align: "justify" },
                          { commit: true },
                        )
                      }
                    >
                      <AlignJustify size={14} />
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
                      onChange={(e) => applyTextColor(e.target.value)}
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
                if (editingTextId) commitEditText(editingTextId);
                setSelectedId(null);
                setMultiIds([]);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (
                  Array.from(e.dataTransfer.items || []).some(
                    (it) => it.kind === "file",
                  )
                ) {
                  setImageDropActive(true);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setImageDropActive(false);
              }}
              onDrop={handleImageDropOnCanvas}
              style={{
                width: PAGE_W * scale,
                height: PAGE_H * scale,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {imageDropActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(74,158,63,0.10)",
                    border: "2.5px dashed #4a9e3f",
                    borderRadius: 10,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      background: "#14332a",
                      color: "#fff",
                      padding: "10px 18px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <ImageIcon size={16} />
                    Thả ảnh vào đây để thêm vào trang
                  </div>
                </div>
              )}
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "relative",
                  ...pageBackgroundStyle(currentPage),
                  borderRadius: PAGE_RADIUS,
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
                    isUploading={uploadingLayerIds.has(layer.id)}
                    onSelect={selectLayer}
                    onDragStart={onLayerDragStart}
                    onResizeStart={onLayerResizeStart}
                    onWordHover={onWordHover}
                    onWordLeave={onWordLeave}
                    onImageDrop={handleImageDropOnLayer}
                    isEditingText={editingTextId === layer.id}
                    editableRef={
                      editingTextId === layer.id ? editableRef : undefined
                    }
                    onStartEditText={startEditText}
                    onCommitText={commitEditText}
                    onSelectionChange={handleTextSelectionChange}
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

      {colorStudioOpen && (
        <div
          className="cp-modal-overlay"
          onClick={() => setColorStudioOpen(false)}
        >
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div>
                <h3>Bảng phối màu</h3>
                <p className="cp-modal-hint">
                  Bấm 1 ô màu để copy mã · bấm dấu ✓ ở góc để{" "}
                  {selected &&
                  (selected.type === "shape" || selected.type === "text")
                    ? "áp dụng vào lớp đang chọn"
                    : "áp dụng làm nền trang"}
                </p>
              </div>
              <button
                className="cp-modal-close"
                onClick={() => setColorStudioOpen(false)}
                aria-label="Đóng bảng phối màu"
              >
                <X size={16} />
              </button>
            </div>
            <div className="cp-modal-body">
              <ColorPaletteStudio onApplyColor={handleApplyPaletteColor} />
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <PreviewOverlay
          pages={pages}
          startIndex={pageIndex}
          orientation={orientation}
          pageNumberPos={pageNumberPos}
          showTitleWithPageNumber={showTitleWithPageNumber}
          hidePageNumberOnCover={hidePageNumberOnCover}
          bookInfo={{ title: bookTitle }}
          storageKey={ebookId || bookId || "draft"}
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
                width: p.width || PAGE_W,
                height: p.height || PAGE_H,
                position: "relative",
                ...pageBackgroundStyle(p),
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
