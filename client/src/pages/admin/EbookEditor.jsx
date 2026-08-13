import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ebookService } from "../../services/ebookService";
import {
  Undo2, Redo2, Plus, Image, Play, Square, Eye, Folder, Layers, Palette,
  X, ChevronUp, ChevronDown, Copy, Volume2, Trash2, ChevronLeft, ChevronRight,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Minus, ZoomIn, ZoomOut, Maximize2,
  BookOpen, Type, Sparkles, Save, Upload, Wand2, Tag, GripVertical
} from "lucide-react";

const FONTS = [
  { label: "Be Vietnam Pro", value: "'Be Vietnam Pro', system-ui, sans-serif" },
  { label: "Georgia (nghiêm túc)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Comic Sans (vui nhộn)", value: "'Comic Sans MS', 'Comic Sans', cursive" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier (máy chữ)", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const BASE_PAGE_W = 680;
const BASE_PAGE_H = 440;

const uid = () => `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));
const speechAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

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
        const dist = Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb);
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
    id: uid(), type: "text", text: "Nhập chữ...",
    x: BASE_PAGE_W / 2 - 110, y: BASE_PAGE_H / 2 - 20, width: 220,
    align: "left", color: "#1f4d3f", bold: false, italic: false, underline: false,
    fontSize: 24, fontFamily: FONTS[0].value, strokeColor: "#000000", strokeWidth: 0, opacity: 100,
    headingLevel: 0,
    ...overrides,
  };
}

function defaultImageLayer(overrides = {}) {
  return {
    id: uid(), type: "image", src: "",
    x: BASE_PAGE_W / 2 - 80, y: BASE_PAGE_H / 2 - 60, width: 160, height: 120, opacity: 100,
    ...overrides,
  };
}

function defaultShapeLayer(overrides = {}) {
  return {
    id: uid(), type: "shape", shapeType: "rect",
    x: BASE_PAGE_W / 2 - 80, y: BASE_PAGE_H / 2 - 60, width: 160, height: 100,
    fill: "#4a9e3f", strokeColor: "#1a5c47", strokeWidth: 0, borderRadius: 12, opacity: 100,
    ...overrides,
  };
}

function defaultPage(overrides = {}) {
  return { id: uid(), title: "", background: "#fffdf8", layers: [], ...overrides };
}

function pageNumberBoxStyle(pos) {
  const p = pos || { v: "bottom", h: "center" };
  const style = {
    position: "absolute", display: "flex", flexDirection: "column", gap: 2,
    alignItems: p.h === "left" ? "flex-start" : p.h === "right" ? "flex-end" : "center",
    fontFamily: "Georgia, serif", fontSize: 12, color: "rgba(31,42,36,0.45)",
    pointerEvents: "none", userSelect: "none", zIndex: 2,
  };
  if (p.v === "top") style.top = 10; else style.bottom = 10;
  if (p.h === "left") style.left = 14;
  else if (p.h === "right") style.right = 14;
  else { style.left = "50%"; style.transform = "translateX(-50%)"; }
  return style;
}

function PageNumberBadge({ page, number, pos, showTitle }) {
  return (
    <div style={pageNumberBoxStyle(pos)}>
      {showTitle && page?.title ? (
        <span style={{ fontSize: 10, opacity: 0.85, whiteSpace: "nowrap" }}>{page.title}</span>
      ) : null}
      <span>{number}</span>
    </div>
  );
}

function LayerView({
  layer, selected, readOnly, isReadingThis, readingWordIndex,
  onSelect, onDragStart, onResizeStart, onWordHover, onWordLeave, onLayerClick, onImageDrop,
}) {
  const wrapStyle = { position: "absolute", left: layer.x, top: layer.y, opacity: (layer.opacity ?? 100) / 100 };
  const isTocLink = readOnly && !!layer.tocTargetPageId;

  const handleClick = (e) => {
    e.stopPropagation();
    if (readOnly) {
      if (layer.tocTargetPageId) onLayerClick && onLayerClick(layer.tocTargetPageId);
      return;
    }
    onSelect(layer.id);
  };

  if (layer.type === "shape") {
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
        onClick={handleClick}
      >
        <div style={{
          width: "100%", height: "100%", boxSizing: "border-box",
          background: layer.fill,
          border: layer.strokeWidth > 0 ? `${layer.strokeWidth}px solid ${layer.strokeColor}` : "none",
          borderRadius: layer.shapeType === "circle" ? "50%" : layer.borderRadius,
          outline: !readOnly && selected ? "2px solid #4a9e3f" : "2px solid transparent",
          outlineOffset: 4, cursor: readOnly ? "default" : "grab", touchAction: "none",
          boxShadow: !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
        }} />
        {!readOnly && selected && (
          <div onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, layer); }}
            className="bb-resize-handle" style={{ cursor: "nwse-resize" }} />
        )}
      </div>
    );
  }

  if (layer.type === "image") {
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
        onClick={handleClick}
        onDragOver={(e) => !readOnly && e.preventDefault()}
        onDrop={(e) => !readOnly && onImageDrop && onImageDrop(e, layer.id)}
      >
        <div style={{
          position: "relative", width: "100%", height: "100%",
          outline: !readOnly && selected ? "2px solid #4a9e3f" : "2px solid transparent",
          outlineOffset: 4, borderRadius: 10, overflow: "hidden",
          cursor: readOnly ? "default" : "grab", touchAction: "none",
          boxShadow: !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
          transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
        }}>
          {layer.src ? (
            <img src={layer.src} alt="" draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "repeating-linear-gradient(135deg, #eef1ee, #eef1ee 10px, #e5e9e4 10px, #e5e9e4 20px)",
              border: "1.5px dashed #c7d0c9", borderRadius: 10, boxSizing: "border-box",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              color: "#8a978f", fontSize: 12, textAlign: "center", padding: 8,
            }}>
              {!readOnly && <Image size={18} strokeWidth={1.6} />}
              {readOnly ? "" : "Dán link ảnh ở bảng Định dạng"}
            </div>
          )}
        </div>
        {!readOnly && selected && (
          <div onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, layer); }}
            className="bb-resize-handle" style={{ cursor: "nwse-resize" }} />
        )}
      </div>
    );
  }

  const words = (layer.text || "").split(" ");
  return (
    <div
      style={{ ...wrapStyle, width: layer.width }}
      onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
      onClick={handleClick}
    >
      <div style={{
        position: "relative", padding: "4px 6px", borderRadius: 8,
        outline: !readOnly && selected ? "2px solid #4a9e3f" : "2px solid transparent",
        outlineOffset: 4, cursor: readOnly ? (isTocLink ? "pointer" : "default") : "grab", touchAction: "none",
        boxShadow: !readOnly && selected ? "0 0 0 4px rgba(74,158,63,0.14)" : "none",
        transition: "outline-color 0.12s ease, box-shadow 0.12s ease",
      }}>
        <div style={{
          fontFamily: layer.fontFamily, fontSize: layer.fontSize,
          fontWeight: layer.bold ? 700 : 400, fontStyle: layer.italic ? "italic" : "normal",
          textDecoration: layer.underline ? "underline" : (isTocLink ? "underline dotted" : "none"), color: layer.color,
          textAlign: layer.align || "left",
          WebkitTextStroke: layer.strokeWidth > 0 ? `${layer.strokeWidth}px ${layer.strokeColor}` : undefined,
          lineHeight: 1.35, wordBreak: "break-word",
        }}>
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span
                onMouseEnter={(e) => { e.stopPropagation(); onWordHover({ word: w }); }}
                onMouseLeave={onWordLeave}
                style={{
                  padding: "1px 2px", borderRadius: 4, cursor: "pointer",
                  background: isReadingThis && readingWordIndex === i ? "rgba(255,196,61,0.55)" : "transparent",
                  transition: "background 0.12s ease",
                }}
              >{w}</span>
              {i < words.length - 1 ? " " : ""}
            </React.Fragment>
          ))}
        </div>
        {!readOnly && selected && (
          <div onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, layer); }}
            className="bb-resize-handle" style={{ cursor: "ew-resize" }} />
        )}
      </div>
    </div>
  );
}

function PreviewOverlay({ pages, startIndex, onClose, orientation, pageNumberPos, showTitleWithPageNumber, hidePageNumberOnCover }) {
  const [idx, setIdx] = useState(startIndex);
  const [reading, setReading] = useState(null);
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const lastHoverWord = useRef(null);
  const PAGE_W = orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
  const PAGE_H = orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;

  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth - 40;
      const h = wrapRef.current.clientHeight - 40;
      setScale(Math.max(0.3, Math.min(1.3, w / PAGE_W, h / PAGE_H)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [PAGE_W, PAGE_H]);

  useEffect(() => () => speechAvailable() && window.speechSynthesis.cancel(), []);

  const page = pages[idx];

  const stop = () => {
    if (speechAvailable()) window.speechSynthesis.cancel();
    setReading(null);
  };

  const onWordHover = (wordObj) => {
    if (!speechAvailable() || !wordObj.word.trim()) return;
    if (lastHoverWord.current === wordObj.word) return;
    lastHoverWord.current = wordObj.word;
    window.speechSynthesis.cancel();
    setReading(null);
    const utter = new SpeechSynthesisUtterance(wordObj.word);
    utter.lang = "vi-VN"; utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };
  const onWordLeave = () => { lastHoverWord.current = null; };

  const readThisPage = () => {
    if (!speechAvailable()) return;
    window.speechSynthesis.cancel();
    const textLayers = page.layers.filter((l) => l.type === "text" && l.text.trim());
    let i = 0;
    const next = () => {
      if (i >= textLayers.length) { setReading(null); return; }
      const layer = textLayers[i];
      speakText(layer.text, {
        onWord: (wi) => setReading({ layerId: layer.id, wordIndex: wi }),
        onEnd: () => { i += 1; next(); },
      });
    };
    next();
  };

  const goPrev = () => { stop(); setIdx((i) => Math.max(0, i - 1)); };
  const goNext = () => { stop(); setIdx((i) => Math.min(pages.length - 1, i + 1)); };
  const goToPageId = (pageId) => {
    const target = pages.findIndex((p) => p.id === pageId);
    if (target !== -1) { stop(); setIdx(target); }
  };

  return (
    <div className="bb-preview">
      <div className="bb-preview-top">
        <span className="bb-preview-page-label">
          Trang {idx + 1} / {pages.length}{page.title ? ` — ${page.title}` : ""}
        </span>
        <button className="bb-btn bb-btn-ghost" onClick={() => { stop(); onClose(); }}>
          <X size={14} style={{ marginRight: 4 }} />Đóng
        </button>
      </div>
      <div ref={wrapRef} className="bb-preview-stage">
        <div style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
          <div className="bb-preview-page" style={{
            width: PAGE_W, height: PAGE_H,
            transform: `scale(${scale})`, background: page.background,
          }}>
            {page.layers.map((layer) => (
              <LayerView key={layer.id} layer={layer} selected={false} readOnly
                isReadingThis={reading?.layerId === layer.id} readingWordIndex={reading?.wordIndex}
                onSelect={() => {}} onDragStart={() => {}} onResizeStart={() => {}}
                onWordHover={onWordHover} onWordLeave={onWordLeave} onLayerClick={goToPageId} />
            ))}
            {!(idx === 0 && hidePageNumberOnCover) && (
              <PageNumberBadge page={page} number={idx + 1} pos={pageNumberPos} showTitle={showTitleWithPageNumber} />
            )}
          </div>
        </div>
      </div>
      <div className="bb-preview-bottom">
        <button className="bb-btn bb-btn-ghost" onClick={goPrev} disabled={idx === 0}>
          <ChevronLeft size={16} />Trước
        </button>
        {reading ? (
          <button className="bb-btn bb-btn-danger" onClick={stop}>
            <Square size={14} style={{ marginRight: 4 }} />Dừng
          </button>
        ) : (
          <button className="bb-btn bb-btn-primary" onClick={readThisPage}>
            <Play size={14} style={{ marginRight: 4 }} />Đọc trang này
          </button>
        )}
        <button className="bb-btn bb-btn-ghost" onClick={goNext} disabled={idx === pages.length - 1}>
          Sau<ChevronRight size={16} />
        </button>
      </div>
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
  const [pageNumberPos, setPageNumberPos] = useState({ v: "bottom", h: "center" });
  const [showTitleWithPageNumber, setShowTitleWithPageNumber] = useState(false);
  const [hidePageNumberOnCover, setHidePageNumberOnCover] = useState(false);

  const PAGE_W = orientation === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
  const PAGE_H = orientation === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;

  const [pages, setPages] = useState([
    defaultPage({
      title: "Bìa sách",
      layers: [
        defaultTextLayer({ text: "Tên sách", x: 50, y: 40, width: 400, color: "#1a5c47", bold: true, fontSize: 40, fontFamily: FONTS[1].value }),
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
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
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
          setOrientation(eb.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE");
          if (eb.pageNumberPos && eb.pageNumberPos.v && eb.pageNumberPos.h) setPageNumberPos(eb.pageNumberPos);
          if (typeof eb.showTitleWithPageNumber === "boolean") setShowTitleWithPageNumber(eb.showTitleWithPageNumber);
          if (typeof eb.hidePageNumberOnCover === "boolean") setHidePageNumberOnCover(eb.hidePageNumberOnCover);
          if (Array.isArray(eb.pages) && eb.pages.length) setPages(eb.pages);
        } else if (bookIdFromQuery) {
          try {
            const bookRes = await ebookService.getForBook(bookIdFromQuery);
            if (!cancelled && Array.isArray(bookRes.data.data) && bookRes.data.data.length) {
              navigate(`/dashboard/ebooks/${bookRes.data.data[0].id}`, { replace: true });
              return;
            }
          } catch (e) {}
          if (!cancelled) setEbookTitle("Sách điện tử mới");
        } else {
          if (!cancelled) setLoadError("Chưa chọn sách để gắn nội dung điện tử. Vui lòng quay lại và chọn một sách trước.");
        }
      } catch (e) {
        if (!cancelled) setLoadError(e?.response?.data?.message || "Không tải được sách điện tử.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [routeId, bookIdFromQuery]);

  const persist = async ({ silent } = {}) => {
    if (loadError) return;
    if (!ebookId && !bookId) return;
    if (!silent) { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }
    setSaveStatus("saving");
    try {
      const payload = {
        title: (ebookTitleRef.current || "Sách điện tử mới").trim() || "Sách điện tử mới",
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
      toast.error(e?.response?.data?.message || "Lưu thất bại, vui lòng thử lại.");
    }
  };

  const saveNow = () => persist();

  useEffect(() => {
    if (!loaded || loadError) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { persist({ silent: true }); }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [pages, ebookTitle, orientation, pageNumberPos, showTitleWithPageNumber, hidePageNumberOnCover, loaded, loadError]);

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

  const zoomIn = () => { setAutoFit(false); setScale((s) => Math.min(2, +(s + 0.1).toFixed(2))); };
  const zoomOut = () => { setAutoFit(false); setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2))); };
  const zoomFit = () => setAutoFit(true);

  const selectLayer = (id) => { setMultiIds([]); setSelectedId(id); if (id) setActivePanel("format"); };
  const toggleRailPanel = (key) => setActivePanel((prev) => (prev === key ? null : key));

  const pushHistory = (snapshotPages) => {
    pastRef.current.push(snapshotPages);
    if (pastRef.current.length > 60) pastRef.current.shift();
    futureRef.current = [];
    bump((n) => n + 1);
  };
  const setPagesCommit = (updater) => setPages((prev) => { pushHistory(clone(prev)); return updater(prev); });
  const setPagesLive = (updater) => setPages((prev) => updater(prev));

  const beginEdit = () => { editSnapshotRef.current = clone(pages); };
  const endEdit = () => {
    if (editSnapshotRef.current) { pushHistory(editSnapshotRef.current); editSnapshotRef.current = null; }
  };

  const undo = () => {
    if (pastRef.current.length === 0) return;
    const prevSnap = pastRef.current.pop();
    futureRef.current.push(clone(pages));
    setPages(prevSnap); setSelectedId(null); bump((n) => n + 1);
  };
  const redo = () => {
    if (futureRef.current.length === 0) return;
    const nextSnap = futureRef.current.pop();
    pastRef.current.push(clone(pages));
    setPages(nextSnap); setSelectedId(null); bump((n) => n + 1);
  };

  const updateLayer = (id, patch, opts = {}) => {
    const updater = (prev) =>
      prev.map((p, i) => i === pageIndex ? { ...p, layers: p.layers.map((l) => l.id === id ? { ...l, ...patch } : l) } : p);
    opts.commit ? setPagesCommit(updater) : setPagesLive(updater);
  };

  const addTextLayer = () => {
    const layer = defaultTextLayer();
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p));
    selectLayer(layer.id);
  };
  const addImageLayer = () => {
    const layer = defaultImageLayer();
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p));
    selectLayer(layer.id);
  };
  const addShapeLayer = () => {
    const layer = defaultShapeLayer();
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p));
    selectLayer(layer.id);
  };
  const removeLayer = (id) => {
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: p.layers.filter((l) => l.id !== id) } : p));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicateLayer = (id) => {
    const layer = currentPage.layers.find((l) => l.id === id);
    if (!layer) return;
    const copy = { ...clone(layer), id: uid(), x: layer.x + 16, y: layer.y + 16 };
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, copy] } : p));
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
      const result = await removeBackgroundByColor(layer.src, bgRemoveColor, bgRemoveTolerance);
      beginEdit();
      updateLayer(selectedId, { src: result });
      endEdit();
    } catch (err) {
      if (err?.message === "CORS") {
        toast.error("Ảnh từ link ngoài không cho phép xoá nền. Hãy tải ảnh lên từ máy rồi thử lại.");
      } else {
        toast.error("Không xoá được nền ảnh, vui lòng thử lại.");
      }
    } finally {
      setBgRemoving(false);
    }
  };
  const moveLayer = (id, dir) => {
    setPagesCommit((prev) => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      const idx = p.layers.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= p.layers.length) return p;
      const copy = [...p.layers];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return { ...p, layers: copy };
    }));
  };

  const reorderLayer = (draggedId, targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setPagesCommit((prev) => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      const layersArr = [...p.layers];
      const fromIdx = layersArr.findIndex((l) => l.id === draggedId);
      const toIdx = layersArr.findIndex((l) => l.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return p;
      const [item] = layersArr.splice(fromIdx, 1);
      const insertAt = fromIdx < toIdx ? toIdx : toIdx;
      layersArr.splice(insertAt, 0, item);
      return { ...p, layers: layersArr };
    }));
  };

  const addPage = () => {
    const page = defaultPage();
    setPagesCommit((prev) => { const copy = [...prev]; copy.splice(pageIndex + 1, 0, page); return copy; });
    setPageIndex(pageIndex + 1); setSelectedId(null); setActivePanel("page");
  };
  const duplicatePage = () => {
    const copy = { ...clone(currentPage), id: uid(), layers: currentPage.layers.map((l) => ({ ...l, id: uid() })) };
    setPagesCommit((prev) => { const arr = [...prev]; arr.splice(pageIndex + 1, 0, copy); return arr; });
    setPageIndex(pageIndex + 1); setSelectedId(null);
  };
  const deletePage = () => {
    if (pages.length <= 1) return;
    setPagesCommit((prev) => prev.filter((_, i) => i !== pageIndex));
    setPageIndex(Math.max(0, pageIndex - 1)); setSelectedId(null);
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
  const setPageBackground = (color) => setPagesLive((prev) => prev.map((p, i) => i === pageIndex ? { ...p, background: color } : p));
  const setPageTitle = (title) => setPagesLive((prev) => prev.map((p, i) => i === pageIndex ? { ...p, title } : p));

  const changeOrientation = (next) => {
    if (next === orientation) return;
    const oldW = PAGE_W, oldH = PAGE_H;
    const newW = next === "PORTRAIT" ? BASE_PAGE_H : BASE_PAGE_W;
    const newH = next === "PORTRAIT" ? BASE_PAGE_W : BASE_PAGE_H;
    const rx = newW / oldW, ry = newH / oldH;
    setPagesCommit((prev) => prev.map((p) => ({
      ...p,
      layers: p.layers.map((l) => ({
        ...l,
        x: l.x * rx,
        y: l.y * ry,
        width: l.width * (l.type === "image" ? rx : rx),
        ...(l.type === "image" ? { height: l.height * ry } : {}),
      })),
    })));
    setOrientation(next);
  };

  const generateToc = () => {
    const entries = [];
    pages.forEach((p, i) => {
      if (p.isToc) return;
      p.layers.forEach((l) => {
        if (l.type === "text" && l.headingLevel > 0 && l.text && l.text.trim()) {
          entries.push({ text: l.text.trim(), level: l.headingLevel, pageId: p.id, pageNumber: i + 1 });
        }
      });
    });

    if (entries.length === 0) {
      toast.error("Chưa có tiêu đề mục nào. Hãy vào bảng Định dạng, chọn một dòng chữ và đánh dấu là tiêu đề mục trước.");
      return;
    }

    const layers = [
      defaultTextLayer({
        text: "Mục lục", x: 40, y: 26, width: PAGE_W - 80, fontSize: 32, bold: true,
        color: "#1a5c47", fontFamily: FONTS[1].value, align: "center", headingLevel: 0,
      }),
    ];
    let y = 84;
    entries.forEach((entry) => {
      const indent = (entry.level - 1) * 26;
      const fontSize = entry.level === 1 ? 18 : entry.level === 2 ? 15 : 13;
      layers.push(defaultTextLayer({
        text: `${entry.text}  .....  ${entry.pageNumber}`,
        x: 40 + indent, y, width: PAGE_W - 80 - indent, fontSize,
        bold: entry.level === 1, color: "#2c3b34", align: "left",
        headingLevel: 0, tocTargetPageId: entry.pageId,
      }));
      y += fontSize + 16;
    });

    setPagesCommit((prev) => {
      const existingIdx = prev.findIndex((p) => p.isToc);
      const tocPage = defaultPage({ title: "Mục lục", background: "#fffdf8", isToc: true, layers });
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

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const pdf = new jsPDF({
        orientation: PAGE_W >= PAGE_H ? "landscape" : "portrait",
        unit: "px",
        format: [PAGE_W, PAGE_H],
      });

      for (let i = 0; i < pages.length; i++) {
        const node = document.getElementById(`bb-export-page-${i}`);
        if (!node) continue;
        const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: pages[i].background || "#ffffff" });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], PAGE_W >= PAGE_H ? "landscape" : "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W, PAGE_H);
      }

      pdf.save(`${(ebookTitle || "sach-dien-tu").trim() || "sach-dien-tu"}.pdf`);
    } catch (e) {
      toast.error("Xuất PDF thất bại, vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const onLayerDragStart = (e, layer) => {
    e.stopPropagation();
    selectLayer(layer.id);
    beginEdit();
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({ id: layer.id, offsetX: (e.clientX - rect.left) / scale - layer.x, offsetY: (e.clientY - rect.top) / scale - layer.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const layerMeta = currentPage.layers.find((l) => l.id === dragging.id);
    const onMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) / scale - dragging.offsetX;
      let y = (e.clientY - rect.top) / scale - dragging.offsetY;
      let gx = false, gy = false;
      if (layerMeta) {
        const w = layerMeta.width || 0;
        const centerX = x + w / 2;
        if (Math.abs(centerX - PAGE_W / 2) < 6) { x = PAGE_W / 2 - w / 2; gx = true; }
        if (layerMeta.type === "image") {
          const h = layerMeta.height || 0;
          const centerY = y + h / 2;
          if (Math.abs(centerY - PAGE_H / 2) < 6) { y = PAGE_H / 2 - h / 2; gy = true; }
        }
      }
      setGuides({ x: gx, y: gy });
      x = Math.max(-60, Math.min(x, PAGE_W - 20));
      y = Math.max(-20, Math.min(y, PAGE_H - 10));
      updateLayer(dragging.id, { x, y });
    };
    const onUp = () => { setDragging(null); setGuides({ x: false, y: false }); endEdit(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, scale]);

  const onLayerResizeStart = (e, layer) => {
    e.stopPropagation();
    beginEdit();
    setResizing({ id: layer.id, type: layer.type, startClientX: e.clientX, startClientY: e.clientY, startW: layer.width, startH: layer.height || 0 });
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const dx = (e.clientX - resizing.startClientX) / scale;
      const dy = (e.clientY - resizing.startClientY) / scale;
      if (resizing.type === "image") {
        updateLayer(resizing.id, { width: Math.max(30, resizing.startW + dx), height: Math.max(30, resizing.startH + dy) });
      } else {
        updateLayer(resizing.id, { width: Math.max(60, resizing.startW + dx) });
      }
    };
    const onUp = () => { setResizing(null); endEdit(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizing, scale]);

  const removeLayers = (ids) => {
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: p.layers.filter((l) => !ids.includes(l.id)) } : p));
    setSelectedId(null); setMultiIds([]);
  };
  const duplicateLayers = (ids) => {
    const copies = currentPage.layers
      .filter((l) => ids.includes(l.id))
      .map((l) => ({ ...clone(l), id: uid(), x: l.x + 16, y: l.y + 16 }));
    if (!copies.length) return;
    setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, ...copies] } : p));
    if (copies.length === 1) { setMultiIds([]); selectLayer(copies[0].id); }
    else { setSelectedId(null); setMultiIds(copies.map((c) => c.id)); setActivePanel("layers"); }
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const meta = e.ctrlKey || e.metaKey;
      const activeIds = multiIds.length ? multiIds : (selectedId ? [selectedId] : []);

      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (meta && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); saveNow(); return; }

      if (typing) return;

      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const ids = currentPage.layers.map((l) => l.id);
        setSelectedId(null); setMultiIds(ids); if (ids.length) setActivePanel("layers");
        return;
      }
      if (meta && e.key.toLowerCase() === "c" && activeIds.length) {
        e.preventDefault();
        clipboardRef.current = currentPage.layers.filter((l) => activeIds.includes(l.id)).map((l) => clone(l));
        return;
      }
      if (meta && e.key.toLowerCase() === "v" && clipboardRef.current && clipboardRef.current.length) {
        e.preventDefault();
        const pasted = clipboardRef.current.map((l) => ({ ...clone(l), id: uid(), x: l.x + 20, y: l.y + 20 }));
        setPagesCommit((prev) => prev.map((p, i) => i === pageIndex ? { ...p, layers: [...p.layers, ...pasted] } : p));
        if (pasted.length === 1) { setMultiIds([]); selectLayer(pasted[0].id); }
        else { setSelectedId(null); setMultiIds(pasted.map((p2) => p2.id)); setActivePanel("layers"); }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && activeIds.length) { e.preventDefault(); removeLayers(activeIds); return; }
      if (meta && e.key.toLowerCase() === "d" && activeIds.length) { e.preventDefault(); duplicateLayers(activeIds); return; }
      if (e.key === "Escape" && (selectedId || multiIds.length)) { setSelectedId(null); setMultiIds([]); return; }
      if (activeIds.length && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setPagesCommit((prev) => prev.map((p, i) => i === pageIndex
          ? { ...p, layers: p.layers.map((l) => activeIds.includes(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l) }
          : p));
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
    utter.lang = "vi-VN"; utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };
  const onWordLeave = () => { lastHoverWord.current = null; };

  const readLayer = (layer) => {
    speakText(layer.text, {
      onWord: (idx) => setReading({ layerId: layer.id, wordIndex: idx }),
      onEnd: () => setReading(null),
    });
  };

  const readPage = () => {
    if (!speechAvailable()) return;
    window.speechSynthesis.cancel();
    const textLayers = currentPage.layers.filter((l) => l.type === "text" && l.text.trim());
    let i = 0;
    const next = () => {
      if (i >= textLayers.length) { setReading(null); return; }
      const layer = textLayers[i];
      speakText(layer.text, {
        onWord: (idx) => setReading({ layerId: layer.id, wordIndex: idx }),
        onEnd: () => { i += 1; next(); },
      });
    };
    next();
  };

  const stopReading = () => { if (speechAvailable()) window.speechSynthesis.cancel(); setReading(null); };

  const selected = currentPage.layers.find((l) => l.id === selectedId) || null;
  const layersFrontFirst = [...currentPage.layers].reverse();

  if (loadError) {
    return (
      <div style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif", minHeight: "100vh", background: "#f7f4ee",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center",
      }}>
        <BookOpen size={32} color="#4a9e3f" />
        <p style={{ color: "#3a4a42", maxWidth: 420 }}>{loadError}</p>
        <button
          onClick={() => navigate("/dashboard/ebooks")}
          style={{
            background: "#1a5c47", color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
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

        .bb-preview { position: fixed; inset: 0; background: rgba(10,22,18,0.95); z-index: 9999; display: flex; flex-direction: column; backdrop-filter: blur(3px); }
        .bb-preview-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
        .bb-preview-page-label { color: #fff; font-size: 13px; opacity: 0.85; font-weight: 500; }
        .bb-preview-stage { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .bb-preview-page { position: relative; border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.5); transform-origin: top left; }
        .bb-preview-bottom { display: flex; justify-content: center; align-items: center; gap: 14px; padding: 18px 20px 26px; }

        @media (max-width: 720px) { .bb-flyout { width: calc(100% - 64px); } }
      `}</style>

      <div className="bb-header">
        <div className="bb-brand">
          {logoError ? (
            <div className="bb-brand-mark bb-brand-mark-fallback"><BookOpen size={19} color="#fff" strokeWidth={2.2} /></div>
          ) : (
            <img src="/logo/logo-mau/lg-m-studio.png" alt="" className="bb-brand-mark" onError={() => setLogoError(true)} />
          )}
          <h1 className="bb-title">
            <span>Trình <em>tạo sách</em></span>
          </h1>
        </div>
        <div className="bb-actions">
          <button className="bb-btn bb-btn-icon" title="Hoàn tác (Ctrl+Z)" onClick={undo} disabled={pastRef.current.length === 0}>
            <Undo2 size={15} />
          </button>
          <button className="bb-btn bb-btn-icon" title="Làm lại (Ctrl+Shift+Z)" onClick={redo} disabled={futureRef.current.length === 0}>
            <Redo2 size={15} />
          </button>
          <div className="bb-divider-v" />
          <button className="bb-btn" title="Lưu ngay (Ctrl+S)" onClick={saveNow}><Save size={14} />Lưu</button>
          <div className="bb-divider-v" />
          {reading ? (
            <button className="bb-btn bb-btn-danger" onClick={stopReading}><Square size={14} />Dừng đọc</button>
          ) : (
            <button className="bb-btn" onClick={readPage}><Play size={14} />Đọc trang</button>
          )}
          <button className="bb-btn bb-btn-primary" onClick={() => setPreviewOpen(true)}><Eye size={14} />Xem trước</button>
          <button className="bb-btn" onClick={exportPdf} disabled={exporting}>
            <Folder size={14} />{exporting ? "Đang xuất..." : "Xuất PDF"}
          </button>
        </div>
      </div>

      <div className="bb-meta-bar">
        <div className="bb-meta-field">
          <label>
            Tên sách điện tử
            {bookTitle && <span className="bb-meta-book-tag">· thuộc sách: {bookTitle}</span>}
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
              <span className={`bb-save-dot ${saveStatus === "saving" ? "busy" : saveStatus === "saved" ? "ok" : ""}`} />
              {saveStatus === "saving" ? "đang lưu…" : saveStatus === "saved" ? "đã lưu" : saveStatus === "error" ? "lỗi lưu" : "chưa lưu"}
            </span>
          </div>
        </div>
        {bookId && (
          <button
            className="bb-btn bb-meta-price-btn"
            onClick={() => navigate(`/dashboard/products/${bookId}`)}
            title="Mở trang sửa sản phẩm để thêm/điều chỉnh giá bán biến thể Sách điện tử"
          >
            <Tag size={14} />Sửa giá bán sản phẩm
          </button>
        )}
      </div>

      <div className="bb-current-page-label">
        <Sparkles size={13} color="#4a9e3f" />
        Đang chỉnh: <strong>Trang {pageIndex + 1}</strong>
        {currentPage.title ? ` — ${currentPage.title}` : ""} · {pages.length} trang
      </div>

      {!ttsOk && (
        <div className="bb-hint" style={{ marginBottom: 12 }}>
          Trình duyệt này không hỗ trợ đọc thành tiếng (Web Speech API) — phần soạn nội dung vẫn hoạt động bình thường, chỉ không có âm thanh.
        </div>
      )}

      <div className="bb-pages-strip">
        <div className="bb-pages-strip-scroll">
          {pages.map((p, i) => (
            <div
              className="bb-page-item"
              key={p.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragPageId(p.id); }}
              onDragOver={(e) => { e.preventDefault(); if (dragPageId && dragPageId !== p.id) setDragOverPageId(p.id); }}
              onDragLeave={() => setDragOverPageId((id) => (id === p.id ? null : id))}
              onDrop={(e) => { e.preventDefault(); reorderPages(dragPageId, p.id); setDragPageId(null); setDragOverPageId(null); }}
              onDragEnd={() => { setDragPageId(null); setDragOverPageId(null); }}
            >
              <div
                className={`bb-page-thumb${i === pageIndex ? " active" : ""}${dragOverPageId === p.id ? " drag-over" : ""}${dragPageId === p.id ? " dragging-self" : ""}`}
                style={{ background: p.background, cursor: "grab" }}
                onClick={() => { setPageIndex(i); setSelectedId(null); }}
              >{i + 1}</div>
              {i === pageIndex ? (
                <input className="bb-page-title-input" value={p.title} placeholder="Tên trang"
                  onFocus={beginEdit} onBlur={endEdit} onChange={(e) => setPageTitle(e.target.value)} />
              ) : (
                <span className="bb-page-title-input" style={{ color: "#b7bfb9" }}>{p.title || "\u00A0"}</span>
              )}
            </div>
          ))}
        </div>
        <div className="bb-strip-divider" />

        <div className="bb-page-strip-actions">
          <button className="bb-pill-btn" title="Thêm trang mới" onClick={addPage}><Plus size={15} /></button>
          <button className="bb-pill-btn" title="Nhân đôi trang" onClick={duplicatePage}><Copy size={15} /></button>
          <button className="bb-pill-btn" title="Xoá trang" onClick={deletePage} disabled={pages.length <= 1}><Trash2 size={15} /></button>
          <div className="bb-pill-sep" />
          <button className="bb-pill-btn" title="Chuyển trang sang trái" onClick={() => movePage(-1)} disabled={pageIndex === 0}><ChevronLeft size={15} /></button>
          <button className="bb-pill-btn" title="Chuyển trang sang phải" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1}><ChevronRight size={15} /></button>
        </div>

        <div className="bb-strip-divider" />

        <div className="bb-zoom-bar">
          <button className="bb-btn bb-btn-icon" onClick={zoomOut}><Minus size={14} /></button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="bb-btn bb-btn-icon" onClick={zoomIn}><ZoomIn size={14} /></button>
          <button className="bb-btn" onClick={zoomFit}><Maximize2 size={14} />Vừa khung</button>
        </div>
      </div>

      <div className="bb-workspace">
        <div className="bb-rail">
          <button className="bb-rail-btn" onClick={addTextLayer} title="Thêm chữ">
            <Type size={18} /><span>Chữ</span>
          </button>
          <button className="bb-rail-btn" onClick={addImageLayer} title="Thêm ảnh">
            <Image size={18} /><span>Ảnh</span>
          </button>
          <button className="bb-rail-btn" onClick={addShapeLayer} title="Thêm hình khối">
            <Square size={18} /><span>Hình</span>
          </button>
          <div className="bb-rail-sep" />
          <button className={`bb-rail-btn${activePanel === "layers" ? " active" : ""}`} onClick={() => toggleRailPanel("layers")} title="Các lớp">
            <Layers size={18} /><span>Lớp</span>
          </button>
          <button className={`bb-rail-btn${activePanel === "format" ? " active" : ""}`} onClick={() => toggleRailPanel("format")} title="Định dạng">
            <Palette size={18} /><span>Chỉnh</span>
          </button>
          <button className={`bb-rail-btn${activePanel === "page" ? " active" : ""}`} onClick={() => toggleRailPanel("page")} title="Trang">
            <Folder size={18} /><span>Trang</span>
          </button>
        </div>

        {activePanel === "page" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Trang {pageIndex + 1}</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}><X size={14} /></button>
            </div>
            <div className="bb-field">
              <label>Tên trang (không bắt buộc)</label>
              <input type="text" value={currentPage.title} onFocus={beginEdit} onBlur={endEdit}
                onChange={(e) => setPageTitle(e.target.value)} placeholder="VD: Bìa sách" />
            </div>
            <div className="bb-field">
              <label>Màu nền trang</label>
              <div className="bb-color-size">
                <input type="color" value={currentPage.background} onFocus={beginEdit} onBlur={endEdit}
                  onChange={(e) => setPageBackground(e.target.value)} />
              </div>
            </div>
            <div className="bb-field">
              <label>Khổ sách (áp dụng cho toàn bộ sách)</label>
              <div className="bb-row3">
                <button
                  className={`bb-btn${orientation === "LANDSCAPE" ? " active" : ""}`}
                  onClick={() => changeOrientation("LANDSCAPE")}
                >Ngang</button>
                <button
                  className={`bb-btn${orientation === "PORTRAIT" ? " active" : ""}`}
                  onClick={() => changeOrientation("PORTRAIT")}
                >Dọc</button>
              </div>
            </div>

            <div className="bb-field">
              <label>Vị trí số trang (áp dụng cho toàn bộ sách)</label>
              <div className="bb-row3">
                <button className={`bb-btn${pageNumberPos.v === "top" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, v: "top" }))}>Phía trên</button>
                <button className={`bb-btn${pageNumberPos.v === "bottom" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, v: "bottom" }))}>Phía dưới</button>
              </div>
              <div className="bb-row3" style={{ marginTop: 6 }}>
                <button className={`bb-btn${pageNumberPos.h === "left" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, h: "left" }))}>Trái</button>
                <button className={`bb-btn${pageNumberPos.h === "center" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, h: "center" }))}>Giữa</button>
                <button className={`bb-btn${pageNumberPos.h === "right" ? " active" : ""}`}
                  onClick={() => setPageNumberPos((p) => ({ ...p, h: "right" }))}>Phải</button>
              </div>
            </div>
            <div className="bb-field">
              <label className="bb-checkbox-field" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={showTitleWithPageNumber}
                  onChange={(e) => setShowTitleWithPageNumber(e.target.checked)} />
                Hiện tên trang cạnh số trang (nếu trang có đặt tên)
              </label>
            </div>
            <div className="bb-field">
              <label className="bb-checkbox-field" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={hidePageNumberOnCover}
                  onChange={(e) => setHidePageNumberOnCover(e.target.checked)} />
                Không hiện số trang ở trang bìa (trang 1)
              </label>
            </div>

            <div className="bb-field">
              <label>Mục lục tự động</label>
              <button type="button" className="bb-btn" style={{ width: "100%", justifyContent: "center" }} onClick={generateToc}>
                <BookOpen size={14} />Tạo / cập nhật mục lục
              </button>
              <div className="bb-hint">
                Vào bảng <strong>Chỉnh</strong>, chọn một dòng chữ và đặt "Vai trò trong mục lục" thành tiêu đề mục.
                Sau đó bấm nút này để tự tạo trang mục lục, liệt kê các tiêu đề kèm số trang (bấm vào từng dòng khi Xem trước sẽ nhảy tới trang đó).
              </div>
            </div>

            <div className="bb-hint">Số trang được đánh tự động theo thứ tự — không cần chỉnh tay.</div>
          </div>
        )}

        {activePanel === "layers" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Các lớp ({currentPage.layers.length})</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}><X size={14} /></button>
            </div>
            {layersFrontFirst.length === 0 && <div className="bb-empty">Chưa có lớp nào trên trang này.</div>}
            {layersFrontFirst.length > 0 && (
              <div className="bb-hint" style={{ marginTop: 0, marginBottom: 10 }}>
                Kéo <GripVertical size={11} style={{ verticalAlign: "-2px" }} /> để sắp xếp thứ tự lớp trước / sau.
              </div>
            )}
            {layersFrontFirst.map((layer) => (
              <div
                key={layer.id}
                className={`bb-layer-row${(layer.id === selectedId || multiIds.includes(layer.id)) ? " selected" : ""}${dragOverLayerId === layer.id ? " drag-over" : ""}${dragLayerId === layer.id ? " dragging-self" : ""}`}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragLayerId(layer.id); }}
                onDragOver={(e) => { e.preventDefault(); if (dragLayerId && dragLayerId !== layer.id) setDragOverLayerId(layer.id); }}
                onDragLeave={() => setDragOverLayerId((id) => (id === layer.id ? null : id))}
                onDrop={(e) => { e.preventDefault(); reorderLayer(dragLayerId, layer.id); setDragLayerId(null); setDragOverLayerId(null); }}
                onDragEnd={() => { setDragLayerId(null); setDragOverLayerId(null); }}
                onClick={() => selectLayer(layer.id)}
              >
                <span className="bb-drag-handle" title="Kéo để sắp xếp"><GripVertical size={13} /></span>
                <span className="bb-layer-type">{layer.type === "image" ? <Image size={12} /> : <Type size={12} />}</span>
                {layer.headingLevel > 0 && <span className="bb-heading-badge">Tiêu đề {layer.headingLevel}</span>}
                <span className="bb-layer-label">{layer.type === "image" ? layer.src || "(chưa có ảnh)" : layer.text || "(trống)"}</span>
                <button className="bb-mini-btn" title="Lên trước" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 1); }}><ChevronUp size={12} /></button>
                <button className="bb-mini-btn" title="Xuống sau" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, -1); }}><ChevronDown size={12} /></button>
                <button className="bb-mini-btn" title="Nhân đôi" onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}><Copy size={12} /></button>
                {layer.type === "text" && (
                  <button className="bb-mini-btn" title="Đọc lớp này" onClick={(e) => { e.stopPropagation(); readLayer(layer); }}><Volume2 size={12} /></button>
                )}
                <button className="bb-mini-btn" title="Xoá" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {activePanel === "format" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Định dạng</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}><X size={14} /></button>
            </div>
            {!selected ? (
              <div className="bb-empty">Chọn một lớp trên trang để chỉnh.</div>
            ) : selected.type === "shape" ? (
              <>
                <div className="bb-field">
                  <label>Kiểu hình</label>
                  <div className="bb-row3">
                    <button className={`bb-btn${selected.shapeType === "rect" ? " active" : ""}`}
                      onClick={() => updateLayer(selected.id, { shapeType: "rect" }, { commit: true })}>Chữ nhật</button>
                    <button className={`bb-btn${selected.shapeType === "circle" ? " active" : ""}`}
                      onClick={() => updateLayer(selected.id, { shapeType: "circle" }, { commit: true })}>Tròn</button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input type="number" value={Math.round(selected.width)} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { width: Number(e.target.value) || 20 })} />
                    <input type="number" value={Math.round(selected.height)} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { height: Number(e.target.value) || 20 })} />
                  </div>
                </div>
                {selected.shapeType !== "circle" && (
                  <div className="bb-field">
                    <label>Bo góc ({selected.borderRadius}px)</label>
                    <input type="range" min={0} max={120} value={selected.borderRadius} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { borderRadius: Number(e.target.value) })} />
                  </div>
                )}
                <div className="bb-field">
                  <label>Màu nền &amp; viền</label>
                  <div className="bb-color-size">
                    <input type="color" value={selected.fill} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { fill: e.target.value })} />
                    <input type="color" value={selected.strokeColor} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { strokeColor: e.target.value })} />
                    <input type="number" min={0} max={12} value={selected.strokeWidth} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { strokeWidth: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input type="range" min={10} max={100} value={selected.opacity} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} />
                </div>
              </>
            ) : selected.type === "image" ? (
              <>
                <div className="bb-field">
                  <label>Ảnh</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleImageDropOnLayer(e, selected.id)}
                    onClick={() => imageFileInputRef.current && imageFileInputRef.current.click()}
                    style={{
                      border: "1.5px dashed #c7d0c9", borderRadius: 10, padding: "16px 10px",
                      textAlign: "center", cursor: "pointer", background: "#fbfaf7", color: "#6b7a72", fontSize: 12.5,
                    }}
                  >
                    <Upload size={16} style={{ marginBottom: 4 }} />
                    <div>Kéo ảnh vào đây hoặc bấm để chọn ảnh từ máy</div>
                  </div>
                  <input ref={imageFileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={handleImageFileChange} />
                </div>
                <div className="bb-field">
                  <label>Xoá nền theo màu ({bgRemoveTolerance}%)</label>
                  <div className="bb-color-size">
                    <input type="color" value={bgRemoveColor}
                      onChange={(e) => setBgRemoveColor(e.target.value)} title="Chọn màu nền cần xoá" />
                    <input type="range" min={2} max={60} value={bgRemoveTolerance} style={{ flex: 1 }}
                      onChange={(e) => setBgRemoveTolerance(Number(e.target.value))} />
                  </div>
                  <button type="button" className="bb-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                    onClick={handleRemoveBackground} disabled={!selected.src || bgRemoving}>
                    <Wand2 size={14} />{bgRemoving ? "Đang xoá nền..." : "Xoá nền"}
                  </button>
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input type="number" value={Math.round(selected.width)} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { width: Number(e.target.value) || 30 })} />
                    <input type="number" value={Math.round(selected.height)} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { height: Number(e.target.value) || 30 })} />
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input type="range" min={10} max={100} value={selected.opacity} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} />
                </div>
              </>
            ) : (
              <>
                <div className="bb-field">
                  <label>Nội dung</label>
                  <textarea value={selected.text} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })} />
                </div>
                <div className="bb-field">
                  <label>Vai trò trong mục lục</label>
                  <select value={selected.headingLevel || 0} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { headingLevel: Number(e.target.value) })}>
                    <option value={0}>Không phải tiêu đề mục</option>
                    <option value={1}>Tiêu đề lớn (cấp 1)</option>
                    <option value={2}>Tiêu đề vừa (cấp 2)</option>
                    <option value={3}>Tiêu đề nhỏ (cấp 3)</option>
                  </select>
                  <div className="bb-hint">Đánh dấu tiêu đề để đưa vào mục lục tự động (bấm "Tạo / cập nhật mục lục" ở bảng Trang).</div>
                </div>
                <div className="bb-field">
                  <label>Kiểu chữ</label>
                  <div className="bb-row3">
                    <button className={`bb-btn${selected.bold ? " active" : ""}`} onClick={() => updateLayer(selected.id, { bold: !selected.bold }, { commit: true })}><Bold size={14} /></button>
                    <button className={`bb-btn${selected.italic ? " active" : ""}`} onClick={() => updateLayer(selected.id, { italic: !selected.italic }, { commit: true })}><Italic size={14} /></button>
                    <button className={`bb-btn${selected.underline ? " active" : ""}`} onClick={() => updateLayer(selected.id, { underline: !selected.underline }, { commit: true })}><Underline size={14} /></button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Căn chữ</label>
                  <div className="bb-row3">
                    <button className={`bb-btn${selected.align === "left" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "left" }, { commit: true })}><AlignLeft size={14} /></button>
                    <button className={`bb-btn${selected.align === "center" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "center" }, { commit: true })}><AlignCenter size={14} /></button>
                    <button className={`bb-btn${selected.align === "right" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "right" }, { commit: true })}><AlignRight size={14} /></button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Font chữ</label>
                  <select value={selected.fontFamily} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value })}>
                    {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="bb-field">
                  <label>Màu chữ &amp; cỡ chữ</label>
                  <div className="bb-color-size">
                    <input type="color" value={selected.color} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { color: e.target.value })} />
                    <input type="number" min={10} max={96} value={selected.fontSize} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) || 10 })} />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Viền chữ (màu &amp; độ dày)</label>
                  <div className="bb-color-size">
                    <input type="color" value={selected.strokeColor} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { strokeColor: e.target.value })} />
                    <input type="number" min={0} max={6} step={0.5} value={selected.strokeWidth} onFocus={beginEdit} onBlur={endEdit}
                      onChange={(e) => updateLayer(selected.id, { strokeWidth: Number(e.target.value) || 0 })} />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input type="range" min={10} max={100} value={selected.opacity} onFocus={beginEdit} onBlur={endEdit}
                    onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} />
                </div>
              </>
            )}
          </div>
        )}

        <div className="bb-canvas-area">
          <div className="bb-canvas-frame" ref={wrapRef}>
            <div ref={canvasRef} onPointerDown={() => { setSelectedId(null); setMultiIds([]); }}
              style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0 }}>
              <div style={{
                width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left",
                position: "relative", background: currentPage.background, borderRadius: 10,
                boxShadow: "0 8px 26px rgba(20,51,42,0.16), 0 2px 6px rgba(20,51,42,0.08)",
              }}>
                {currentPage.layers.map((layer) => (
                  <LayerView key={layer.id} layer={layer} selected={layer.id === selectedId || multiIds.includes(layer.id)} readOnly={false}
                    isReadingThis={reading?.layerId === layer.id} readingWordIndex={reading?.wordIndex}
                    onSelect={selectLayer} onDragStart={onLayerDragStart} onResizeStart={onLayerResizeStart}
                    onWordHover={onWordHover} onWordLeave={onWordLeave}
                    onImageDrop={handleImageDropOnLayer} />
                ))}

                {selected && !dragging && !resizing && (
                  <div className="bb-float-toolbar" style={{ left: selected.x, top: Math.max(0, selected.y - 36) }}
                    onPointerDown={(e) => e.stopPropagation()}>
                    {selected.type === "text" && (
                      <button title="Đọc lớp này" onClick={() => readLayer(selected)}><Volume2 size={13} /></button>
                    )}
                    <button title="Nhân đôi (Ctrl+D)" onClick={() => duplicateLayer(selected.id)}><Copy size={13} /></button>
                    <button title="Xoá (Delete)" onClick={() => removeLayer(selected.id)}><X size={13} /></button>
                  </div>
                )}

                {guides.x && <div className="bb-guide" style={{ left: PAGE_W / 2 - 0.5, top: 0, bottom: 0, width: 1 }} />}
                {guides.y && <div className="bb-guide" style={{ top: PAGE_H / 2 - 0.5, left: 0, right: 0, height: 1 }} />}

                {!(pageIndex === 0 && hidePageNumberOnCover) && (
                  <PageNumberBadge page={currentPage} number={pageIndex + 1} pos={pageNumberPos} showTitle={showTitleWithPageNumber} />
                )}
              </div>
            </div>
          </div>

          <div className="bb-hint" style={{ textAlign: "center", color: "#a9b3ac" }}>
            Power by earthoria, Ver2.1.2
          </div>
        </div>
      </div>

      {previewOpen && (
        <PreviewOverlay pages={pages} startIndex={pageIndex} orientation={orientation}
          pageNumberPos={pageNumberPos} showTitleWithPageNumber={showTitleWithPageNumber}
          hidePageNumberOnCover={hidePageNumberOnCover}
          onClose={() => setPreviewOpen(false)} />
      )}

      {exporting && (
        <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
          {pages.map((p, i) => (
            <div key={p.id} id={`bb-export-page-${i}`} style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: p.background }}>
              {p.layers.map((layer) => (
                <LayerView key={layer.id} layer={layer} selected={false} readOnly
                  onSelect={() => {}} onDragStart={() => {}} onResizeStart={() => {}}
                  onWordHover={() => {}} onWordLeave={() => {}} />
              ))}
              {!(i === 0 && hidePageNumberOnCover) && (
                <PageNumberBadge page={p} number={i + 1} pos={pageNumberPos} showTitle={showTitleWithPageNumber} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}