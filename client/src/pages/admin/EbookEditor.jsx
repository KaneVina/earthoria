import React, { useState, useRef, useEffect } from "react";

/* ───────────────────────── constants & helpers ───────────────────────── */

const FONTS = [
  { label: "Be Vietnam Pro", value: "'Be Vietnam Pro', system-ui, sans-serif" },
  { label: "Georgia (nghiêm túc)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Comic Sans (vui nhộn)", value: "'Comic Sans MS', 'Comic Sans', cursive" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier (máy chữ)", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const PAGE_W = 680;
const PAGE_H = 440;
const STORAGE_KEY = "bookbuilder:project";

const uid = () => `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));
const speechAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

// đọc file ảnh từ máy, thu nhỏ nếu quá lớn rồi nén lại — giữ dung lượng lưu
// trữ hợp lý (bộ nhớ artifact giới hạn theo từng khoá lưu)
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

// xoá nền THEO MÀU (chroma-key đơn giản) — không phải AI tách vật thể như
// Canva; chỉ làm trong suốt những pixel có màu gần với màu đã chọn, nên hợp
// nhất với ảnh có nền một màu tương đối đồng đều
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
      const tol = (tolerancePercent / 100) * 450; // ngưỡng khoảng cách màu r+g+b
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
    id: uid(),
    type: "text",
    text: "Nhập chữ...",
    x: PAGE_W / 2 - 110,
    y: PAGE_H / 2 - 20,
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
    ...overrides,
  };
}

function defaultImageLayer(overrides = {}) {
  return {
    id: uid(),
    type: "image",
    src: "",
    x: PAGE_W / 2 - 80,
    y: PAGE_H / 2 - 60,
    width: 160,
    height: 120,
    opacity: 100,
    ...overrides,
  };
}

function defaultPage(overrides = {}) {
  return { id: uid(), title: "", background: "#fffdf8", layers: [], ...overrides };
}

/* ───────────────────────── layer view (shared editor + preview) ───────────────────────── */

function LayerView({
  layer,
  selected,
  readOnly,
  isReadingThis,
  readingWordIndex,
  onSelect,
  onDragStart,
  onResizeStart,
  onWordHover,
  onWordLeave,
}) {
  const wrapStyle = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    opacity: (layer.opacity ?? 100) / 100,
  };

  if (layer.type === "image") {
    return (
      <div
        style={{ ...wrapStyle, width: layer.width, height: layer.height }}
        onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
        onClick={(e) => {
          e.stopPropagation();
          !readOnly && onSelect(layer.id);
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            outline: !readOnly && selected ? "2px dashed #4a9e3f" : "2px dashed transparent",
            outlineOffset: 4,
            borderRadius: 6,
            overflow: "hidden",
            cursor: readOnly ? "default" : "grab",
            touchAction: "none",
          }}
        >
          {layer.src ? (
            <img
              src={layer.src}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#eef1ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8a978f",
                fontSize: 12,
                textAlign: "center",
                padding: 8,
              }}
            >
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
  return (
    <div
      style={{ ...wrapStyle, width: layer.width }}
      onPointerDown={(e) => !readOnly && onDragStart(e, layer)}
      onClick={(e) => {
        e.stopPropagation();
        !readOnly && onSelect(layer.id);
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "4px 6px",
          borderRadius: 8,
          outline: !readOnly && selected ? "2px dashed #4a9e3f" : "2px dashed transparent",
          outlineOffset: 4,
          cursor: readOnly ? "default" : "grab",
          touchAction: "none",
        }}
      >
        <div
          style={{
            fontFamily: layer.fontFamily,
            fontSize: layer.fontSize,
            fontWeight: layer.bold ? 700 : 400,
            fontStyle: layer.italic ? "italic" : "normal",
            textDecoration: layer.underline ? "underline" : "none",
            color: layer.color,
            textAlign: layer.align || "left",
            WebkitTextStroke: layer.strokeWidth > 0 ? `${layer.strokeWidth}px ${layer.strokeColor}` : undefined,
            lineHeight: 1.35,
            wordBreak: "break-word",
          }}
        >
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  onWordHover(w);
                }}
                onMouseLeave={onWordLeave}
                style={{
                  padding: "1px 2px",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: isReadingThis && readingWordIndex === i ? "rgba(255,196,61,0.55)" : "transparent",
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
            style={{ cursor: "ew-resize" }}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── preview / read mode ───────────────────────── */

function PreviewOverlay({ pages, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [reading, setReading] = useState(null);
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const lastHoverWord = useRef(null);

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
  }, []);

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
    utter.lang = "vi-VN";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };
  const onWordLeave = () => {
    lastHoverWord.current = null;
  };

  const readThisPage = () => {
    if (!speechAvailable()) return;
    window.speechSynthesis.cancel();
    const textLayers = page.layers.filter((l) => l.type === "text" && l.text.trim());
    let i = 0;
    const next = () => {
      if (i >= textLayers.length) {
        setReading(null);
        return;
      }
      const layer = textLayers[i];
      speakText(layer.text, {
        onWord: (wi) => setReading({ layerId: layer.id, wordIndex: wi }),
        onEnd: () => {
          i += 1;
          next();
        },
      });
    };
    next();
  };

  const goPrev = () => {
    stop();
    setIdx((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    stop();
    setIdx((i) => Math.min(pages.length - 1, i + 1));
  };

  return (
    <div className="bb-preview">
      <div className="bb-preview-top">
        <span className="bb-preview-page-label">
          Trang {idx + 1} / {pages.length}
          {page.title ? ` — ${page.title}` : ""}
        </span>
        <button
          className="bb-btn bb-btn-ghost"
          onClick={() => {
            stop();
            onClose();
          }}
        >
          ✕ Đóng
        </button>
      </div>

      <div ref={wrapRef} className="bb-preview-stage">
        <div style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
          <div
            className="bb-preview-page"
            style={{
              width: PAGE_W,
              height: PAGE_H,
              transform: `scale(${scale})`,
              background: page.background,
            }}
          >
            {page.layers.map((layer) => (
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
                onWordHover={onWordHover}
                onWordLeave={onWordLeave}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bb-preview-bottom">
        <button className="bb-btn bb-btn-ghost" onClick={goPrev} disabled={idx === 0}>
          ‹ Trước
        </button>
        {reading ? (
          <button className="bb-btn bb-btn-danger" onClick={stop}>
            ⏹ Dừng
          </button>
        ) : (
          <button className="bb-btn bb-btn-primary" onClick={readThisPage}>
            ▶ Đọc trang này
          </button>
        )}
        <button className="bb-btn bb-btn-ghost" onClick={goNext} disabled={idx === pages.length - 1}>
          Sau ›
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export default function BookBuilder() {
  const [pages, setPages] = useState([
    defaultPage({
      title: "Bìa sách",
      layers: [
        defaultTextLayer({ text: "Chú Gấu Đi Rừng", x: 50, y: 40, width: 400, color: "#1a5c47", bold: true, fontSize: 40, fontFamily: FONTS[1].value }),
        defaultTextLayer({ text: "một câu chuyện về lòng tốt", x: 54, y: 108, width: 360, color: "#4a9e3f", italic: true, fontSize: 18, fontFamily: FONTS[1].value }),
      ],
    }),
    defaultPage({
      title: "",
      layers: [
        defaultTextLayer({ text: "Một buổi sáng trong rừng, chú gấu nhỏ thức dậy và đi tìm mật ong.", x: 50, y: 150, width: 420, color: "#3a3327", fontSize: 20, fontFamily: FONTS[1].value }),
      ],
    }),
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null | 'page' | 'layers' | 'format'
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [reading, setReading] = useState(null);
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [ttsOk, setTtsOk] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [, bump] = useState(0);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [bgRemoveTolerance, setBgRemoveTolerance] = useState(28);
  const [bgRemoveBusy, setBgRemoveBusy] = useState(false);
  const [bgRemoveError, setBgRemoveError] = useState("");

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const lastHoverWord = useRef(null);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const editSnapshotRef = useRef(null);
  const saveTimerRef = useRef(null);

  const currentPage = pages[pageIndex] || pages[0];

  useEffect(() => setTtsOk(speechAvailable()), []);

  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  /* ---- load / autosave via artifact storage ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (!cancelled && res && res.value) {
          const data = JSON.parse(res.value);
          if (data && Array.isArray(data.pages) && data.pages.length) setPages(data.pages);
        }
      } catch (e) {
        /* chưa có dữ liệu lưu trước đó */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ pages }), false);
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [pages, loaded]);

  /* ---- responsive scale-to-fit / zoom ---- */
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

  /* ---- selection + rail/flyout panel ---- */
  const selectLayer = (id) => {
    setSelectedId(id);
    if (id) setActivePanel("format");
  };
  const toggleRailPanel = (key) => {
    setActivePanel((prev) => (prev === key ? null : key));
  };

  /* ---- undo / redo ---- */
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

  /* ---- layer helpers ---- */
  const updateLayer = (id, patch, opts = {}) => {
    const updater = (prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) } : p));
    opts.commit ? setPagesCommit(updater) : setPagesLive(updater);
  };

  const addTextLayer = () => {
    const layer = defaultTextLayer();
    setPagesCommit((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p)));
    selectLayer(layer.id);
  };
  const addImageLayer = () => {
    const layer = defaultImageLayer();
    setPagesCommit((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, layers: [...p.layers, layer] } : p)));
    selectLayer(layer.id);
  };
  const removeLayer = (id) => {
    setPagesCommit((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, layers: p.layers.filter((l) => l.id !== id) } : p)));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicateLayer = (id) => {
    const layer = currentPage.layers.find((l) => l.id === id);
    if (!layer) return;
    const copy = { ...clone(layer), id: uid(), x: layer.x + 16, y: layer.y + 16 };
    setPagesCommit((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, layers: [...p.layers, copy] } : p)));
    selectLayer(copy.id);
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
      })
    );
  };

  /* ---- page helpers ---- */
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
    const copy = { ...clone(currentPage), id: uid(), layers: currentPage.layers.map((l) => ({ ...l, id: uid() })) };
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
  const setPageBackground = (color) => {
    setPagesLive((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, background: color } : p)));
  };
  const setPageTitle = (title) => {
    setPagesLive((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, title } : p)));
  };

  /* ---- dragging ---- */
  const onLayerDragStart = (e, layer) => {
    e.stopPropagation();
    selectLayer(layer.id);
    beginEdit();
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({
      id: layer.id,
      offsetX: (e.clientX - rect.left) / scale - layer.x,
      offsetY: (e.clientY - rect.top) / scale - layer.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const layerMeta = currentPage.layers.find((l) => l.id === dragging.id);
    const onMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) / scale - dragging.offsetX;
      let y = (e.clientY - rect.top) / scale - dragging.offsetY;
      let gx = false;
      let gy = false;
      if (layerMeta) {
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
      updateLayer(dragging.id, { x, y });
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

  /* ---- resizing ---- */
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

  /* ---- keyboard shortcuts ---- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const meta = e.ctrlKey || e.metaKey;
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
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeLayer(selectedId);
        return;
      }
      if (meta && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateLayer(selectedId);
        return;
      }
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const layer = currentPage.layers.find((l) => l.id === selectedId);
        if (layer) updateLayer(selectedId, { x: layer.x + dx, y: layer.y + dy }, { commit: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pages, pageIndex]);

  /* ---- read aloud (editor) ---- */
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
    const textLayers = currentPage.layers.filter((l) => l.type === "text" && l.text.trim());
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

  return (
    <div className="bb-root">
      <style>{`
        .bb-root { font-family: 'Be Vietnam Pro', system-ui, sans-serif; background: #f7f4ee; color: #1f2a24; min-height: 100vh; padding: 16px; box-sizing: border-box; }
        .bb-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 4px; }
        .bb-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #14332a; margin: 0; }
        .bb-title em { color: #4a9e3f; font-style: italic; }
        .bb-save-status { font-size: 11px; color: #8a978f; margin-left: 8px; font-weight: 400; }
        .bb-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .bb-btn { border: 1px solid rgba(20,51,42,0.18); background: #fff; color: #14332a; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s ease, transform 0.1s ease; }
        .bb-btn:hover { background: #eef6ec; }
        .bb-btn:active { transform: scale(0.97); }
        .bb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .bb-btn-primary { background: #1a5c47; color: #fff; border-color: #1a5c47; }
        .bb-btn-primary:hover { background: #14483a; }
        .bb-btn-danger { background: #fff; color: #b3432f; border-color: rgba(179,67,47,0.35); }
        .bb-btn-ghost { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.3); }
        .bb-btn-ghost:hover { background: rgba(255,255,255,0.22); }
        .bb-btn-icon { padding: 8px 10px; }
        .bb-btn.active { background: #4a9e3f; color: #fff; border-color: #4a9e3f; }
        .bb-current-page-label { font-size: 12px; color: #6b7a72; margin: 2px 0 10px; }

        .bb-pages-strip { display: flex; align-items: flex-start; gap: 10px; overflow-x: auto; padding: 4px 2px 10px; margin-bottom: 4px; }
        .bb-page-item { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bb-page-thumb { width: 56px; height: 38px; border-radius: 7px; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #45524b; position: relative; }
        .bb-page-thumb.active { border-color: #4a9e3f; box-shadow: 0 0 0 2px rgba(74,158,63,0.22); }
        .bb-page-title-input { width: 68px; font-size: 10px; text-align: center; border: none; background: transparent; color: #6b7a72; padding: 1px 0; border-bottom: 1px dashed transparent; }
        .bb-page-title-input:focus { outline: none; border-bottom-color: #4a9e3f; }
        .bb-page-strip-actions { display: flex; align-items: center; gap: 6px; padding-top: 2px; }

        .bb-workspace { position: relative; display: flex; border-radius: 14px; overflow: hidden; background: #e9e6dd; border: 1px solid rgba(20,51,42,0.14); box-shadow: 0 12px 30px rgba(20,51,42,0.10); min-height: 540px; }
        .bb-rail { flex: 0 0 56px; background: #fff; border-right: 1px solid rgba(20,51,42,0.1); display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 8px; z-index: 6; }
        .bb-rail-btn { width: 40px; height: 40px; border-radius: 10px; border: none; background: transparent; cursor: pointer; font-size: 17px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7a72; gap: 1px; }
        .bb-rail-btn span { font-size: 8px; font-weight: 700; letter-spacing: 0.02em; }
        .bb-rail-btn:hover { background: #f4f1ea; }
        .bb-rail-btn.active { background: #eef6ec; color: #1a5c47; }

        .bb-flyout { position: absolute; left: 56px; top: 0; bottom: 0; width: 280px; background: #fff; border-right: 1px solid rgba(20,51,42,0.1); box-shadow: 6px 0 24px rgba(0,0,0,0.10); z-index: 5; padding: 16px; overflow-y: auto; animation: bb-slide-in 0.16s ease; }
        @keyframes bb-slide-in { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .bb-flyout-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .bb-flyout-head h3 { margin: 0; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #14332a; font-weight: 700; }
        .bb-flyout-close { border: none; background: transparent; cursor: pointer; color: #8a978f; font-size: 15px; width: 24px; height: 24px; border-radius: 6px; }
        .bb-flyout-close:hover { background: #f4f1ea; }

        .bb-canvas-area { flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 14px; }
        .bb-zoom-bar { display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
        .bb-zoom-bar span { font-size: 12px; color: #6b7a72; min-width: 40px; text-align: center; }
        .bb-canvas-frame { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; }

        .bb-layer-row { display: flex; align-items: center; gap: 4px; padding: 6px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .bb-layer-row.selected { background: #eef6ec; }
        .bb-layer-row:hover { background: #f4f1ea; }
        .bb-layer-type { font-size: 11px; color: #8a978f; width: 16px; text-align: center; flex-shrink: 0; }
        .bb-layer-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bb-mini-btn { border: none; background: transparent; color: #6b7a72; cursor: pointer; font-size: 12px; width: 22px; height: 22px; border-radius: 5px; flex-shrink: 0; }
        .bb-mini-btn:hover { background: rgba(20,51,42,0.08); color: #14332a; }

        .bb-field { margin-bottom: 12px; }
        .bb-field label { display: block; font-size: 12px; font-weight: 600; color: #45524b; margin-bottom: 5px; }
        .bb-field input[type="text"], .bb-field textarea, .bb-field select { width: 100%; box-sizing: border-box; padding: 7px 9px; border-radius: 7px; border: 1px solid rgba(20,51,42,0.2); font-size: 13px; font-family: inherit; background: #fff; }
        .bb-field textarea { resize: vertical; min-height: 54px; }
        .bb-field input[type="range"] { width: 100%; }
        .bb-row3 { display: flex; gap: 6px; }
        .bb-row3 .bb-btn { flex: 1; padding: 7px 0; }
        .bb-color-size { display: flex; gap: 10px; align-items: center; }
        .bb-color-size input[type="color"] { width: 38px; height: 32px; border: none; border-radius: 6px; padding: 0; cursor: pointer; }
        .bb-color-size input[type="number"] { width: 70px; padding: 6px 8px; border-radius: 7px; border: 1px solid rgba(20,51,42,0.2); font-size: 13px; }
        .bb-hint { font-size: 12px; color: #6b7a72; background: #f4f1ea; border-radius: 8px; padding: 8px 10px; margin-top: 10px; }
        .bb-empty { font-size: 13px; color: #8a978f; padding: 8px 4px; }

        .bb-resize-handle { position: absolute; right: -7px; bottom: -7px; width: 14px; height: 14px; border-radius: 50%; background: #4a9e3f; border: 2px solid #fff; touch-action: none; }
        .bb-guide { position: absolute; background: #4a9e3f; opacity: 0.85; pointer-events: none; }
        .bb-float-toolbar { position: absolute; display: flex; gap: 3px; background: #14332a; border-radius: 8px; padding: 4px; box-shadow: 0 8px 20px rgba(0,0,0,0.28); z-index: 30; }
        .bb-float-toolbar button { border: none; background: transparent; color: #fff; cursor: pointer; font-size: 13px; width: 26px; height: 26px; border-radius: 5px; }
        .bb-float-toolbar button:hover { background: rgba(255,255,255,0.15); }

        .bb-preview { position: fixed; inset: 0; background: rgba(12,26,21,0.94); z-index: 9999; display: flex; flex-direction: column; }
        .bb-preview-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
        .bb-preview-page-label { color: #fff; font-size: 13px; opacity: 0.85; }
        .bb-preview-stage { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .bb-preview-page { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.45); transform-origin: top left; }
        .bb-preview-bottom { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 16px 18px 22px; }

        @media (max-width: 720px) {
          .bb-flyout { width: calc(100% - 56px); }
        }
      `}</style>

      {/* header */}
      <div className="bb-header">
        <h1 className="bb-title">
          Trình Tạo Sách <em>Đọc Cùng</em>
          <span className="bb-save-status">
            {saveStatus === "saving" ? "· đang lưu…" : saveStatus === "saved" ? "· đã lưu" : ""}
          </span>
        </h1>
        <div className="bb-actions">
          <button className="bb-btn bb-btn-icon" title="Hoàn tác (Ctrl+Z)" onClick={undo} disabled={pastRef.current.length === 0}>↩</button>
          <button className="bb-btn bb-btn-icon" title="Làm lại (Ctrl+Shift+Z)" onClick={redo} disabled={futureRef.current.length === 0}>↪</button>
          <button className="bb-btn" onClick={addTextLayer}>+ Chữ</button>
          <button className="bb-btn" onClick={addImageLayer}>+ Ảnh</button>
          {reading ? (
            <button className="bb-btn bb-btn-danger" onClick={stopReading}>⏹ Dừng đọc</button>
          ) : (
            <button className="bb-btn" onClick={readPage}>▶ Đọc trang</button>
          )}
          <button className="bb-btn bb-btn-primary" onClick={() => setPreviewOpen(true)}>👁 Xem trước</button>
        </div>
      </div>
      <div className="bb-current-page-label">
        Đang chỉnh: <strong>Trang {pageIndex + 1}</strong>
        {currentPage.title ? ` — ${currentPage.title}` : ""} · {pages.length} trang
      </div>

      {!ttsOk && (
        <div className="bb-hint" style={{ marginBottom: 12 }}>
          Trình duyệt này không hỗ trợ đọc thành tiếng (Web Speech API) — phần soạn nội dung vẫn hoạt động bình thường, chỉ không có âm thanh.
        </div>
      )}

      {/* pages strip — auto page number + optional title */}
      <div className="bb-pages-strip">
        {pages.map((p, i) => (
          <div className="bb-page-item" key={p.id}>
            <div
              className={`bb-page-thumb${i === pageIndex ? " active" : ""}`}
              style={{ background: p.background }}
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
              <span className="bb-page-title-input" style={{ color: "#b7bfb9" }}>
                {p.title || "\u00A0"}
              </span>
            )}
          </div>
        ))}
        <div className="bb-page-strip-actions">
          <button className="bb-btn bb-btn-icon" title="Thêm trang mới" onClick={addPage}>+ Trang</button>
          <button className="bb-btn bb-btn-icon" title="Nhân đôi trang" onClick={duplicatePage}>⧉</button>
          <button className="bb-btn bb-btn-icon" title="Xoá trang" onClick={deletePage} disabled={pages.length <= 1}>🗑</button>
          <button className="bb-btn bb-btn-icon" title="Chuyển trang sang trái" onClick={() => movePage(-1)} disabled={pageIndex === 0}>◀</button>
          <button className="bb-btn bb-btn-icon" title="Chuyển trang sang phải" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1}>▶</button>
        </div>
      </div>

      {/* workspace: rail + flyout (click to open) + canvas */}
      <div className="bb-workspace">
        <div className="bb-rail">
          <button className={`bb-rail-btn${activePanel === "page" ? " active" : ""}`} onClick={() => toggleRailPanel("page")} title="Trang">
            🗂<span>Trang</span>
          </button>
          <button className={`bb-rail-btn${activePanel === "layers" ? " active" : ""}`} onClick={() => toggleRailPanel("layers")} title="Các lớp">
            📑<span>Lớp</span>
          </button>
          <button className={`bb-rail-btn${activePanel === "format" ? " active" : ""}`} onClick={() => toggleRailPanel("format")} title="Định dạng">
            🎨<span>Chỉnh</span>
          </button>
        </div>

        {activePanel === "page" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Trang {pageIndex + 1}</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="bb-field">
              <label>Tên trang (không bắt buộc)</label>
              <input type="text" value={currentPage.title} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => setPageTitle(e.target.value)} placeholder="VD: Bìa sách" />
            </div>
            <div className="bb-field">
              <label>Màu nền trang</label>
              <div className="bb-color-size">
                <input type="color" value={currentPage.background} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => setPageBackground(e.target.value)} />
              </div>
            </div>
            <div className="bb-hint">Số trang được đánh tự động theo thứ tự — không cần chỉnh tay.</div>
          </div>
        )}

        {activePanel === "layers" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Các lớp ({currentPage.layers.length})</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            {layersFrontFirst.length === 0 && <div className="bb-empty">Chưa có lớp nào trên trang này.</div>}
            {layersFrontFirst.map((layer) => (
              <div key={layer.id} className={`bb-layer-row${layer.id === selectedId ? " selected" : ""}`} onClick={() => selectLayer(layer.id)}>
                <span className="bb-layer-type">{layer.type === "image" ? "🖼" : "T"}</span>
                <span className="bb-layer-label">{layer.type === "image" ? layer.src || "(chưa có ảnh)" : layer.text || "(trống)"}</span>
                <button className="bb-mini-btn" title="Lên trước" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 1); }}>↑</button>
                <button className="bb-mini-btn" title="Xuống sau" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, -1); }}>↓</button>
                <button className="bb-mini-btn" title="Nhân đôi" onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}>⧉</button>
                {layer.type === "text" && (
                  <button className="bb-mini-btn" title="Đọc lớp này" onClick={(e) => { e.stopPropagation(); readLayer(layer); }}>🔊</button>
                )}
                <button className="bb-mini-btn" title="Xoá" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {activePanel === "format" && (
          <div className="bb-flyout">
            <div className="bb-flyout-head">
              <h3>Định dạng</h3>
              <button className="bb-flyout-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            {!selected ? (
              <div className="bb-empty">Chọn một lớp trên trang để chỉnh.</div>
            ) : selected.type === "image" ? (
              <>
                <div className="bb-field">
                  <label>Link ảnh (URL)</label>
                  <input type="text" value={selected.src} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { src: e.target.value })} placeholder="https://..." />
                </div>
                <div className="bb-field">
                  <label>Kích thước (rộng × cao)</label>
                  <div className="bb-color-size">
                    <input type="number" value={Math.round(selected.width)} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { width: Number(e.target.value) || 30 })} />
                    <input type="number" value={Math.round(selected.height)} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { height: Number(e.target.value) || 30 })} />
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input type="range" min={10} max={100} value={selected.opacity} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} />
                </div>
              </>
            ) : (
              <>
                <div className="bb-field">
                  <label>Nội dung</label>
                  <textarea value={selected.text} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { text: e.target.value })} />
                </div>
                <div className="bb-field">
                  <label>Kiểu chữ</label>
                  <div className="bb-row3">
                    <button className={`bb-btn${selected.bold ? " active" : ""}`} onClick={() => updateLayer(selected.id, { bold: !selected.bold }, { commit: true })}>B</button>
                    <button className={`bb-btn${selected.italic ? " active" : ""}`} style={{ fontStyle: "italic" }} onClick={() => updateLayer(selected.id, { italic: !selected.italic }, { commit: true })}>I</button>
                    <button className={`bb-btn${selected.underline ? " active" : ""}`} style={{ textDecoration: "underline" }} onClick={() => updateLayer(selected.id, { underline: !selected.underline }, { commit: true })}>U</button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Căn chữ</label>
                  <div className="bb-row3">
                    <button className={`bb-btn${selected.align === "left" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "left" }, { commit: true })}>Trái</button>
                    <button className={`bb-btn${selected.align === "center" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "center" }, { commit: true })}>Giữa</button>
                    <button className={`bb-btn${selected.align === "right" ? " active" : ""}`} onClick={() => updateLayer(selected.id, { align: "right" }, { commit: true })}>Phải</button>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Font chữ</label>
                  <select value={selected.fontFamily} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value })}>
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="bb-field">
                  <label>Màu chữ &amp; cỡ chữ</label>
                  <div className="bb-color-size">
                    <input type="color" value={selected.color} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { color: e.target.value })} />
                    <input type="number" min={10} max={96} value={selected.fontSize} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) || 10 })} />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Viền chữ (màu &amp; độ dày)</label>
                  <div className="bb-color-size">
                    <input type="color" value={selected.strokeColor} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { strokeColor: e.target.value })} />
                    <input type="number" min={0} max={6} step={0.5} value={selected.strokeWidth} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { strokeWidth: Number(e.target.value) || 0 })} />
                    <span style={{ fontSize: 12, color: "#6b7a72" }}>px</span>
                  </div>
                </div>
                <div className="bb-field">
                  <label>Độ trong suốt ({selected.opacity}%)</label>
                  <input type="range" min={10} max={100} value={selected.opacity} onFocus={beginEdit} onBlur={endEdit} onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} />
                </div>
              </>
            )}
          </div>
        )}

        <div className="bb-canvas-area">
          <div className="bb-zoom-bar">
            <button className="bb-btn bb-btn-icon" onClick={zoomOut}>−</button>
            <span>{Math.round(scale * 100)}%</span>
            <button className="bb-btn bb-btn-icon" onClick={zoomIn}>+</button>
            <button className="bb-btn" onClick={zoomFit}>Vừa khung</button>
          </div>

          <div className="bb-canvas-frame" ref={wrapRef}>
            <div ref={canvasRef} onPointerDown={() => setSelectedId(null)} style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0 }}>
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "relative",
                  background: currentPage.background,
                  borderRadius: 8,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                {currentPage.layers.map((layer) => (
                  <LayerView
                    key={layer.id}
                    layer={layer}
                    selected={layer.id === selectedId}
                    readOnly={false}
                    isReadingThis={reading?.layerId === layer.id}
                    readingWordIndex={reading?.wordIndex}
                    onSelect={selectLayer}
                    onDragStart={onLayerDragStart}
                    onResizeStart={onLayerResizeStart}
                    onWordHover={onWordHover}
                    onWordLeave={onWordLeave}
                  />
                ))}

                {selected && !dragging && !resizing && (
                  <div className="bb-float-toolbar" style={{ left: selected.x, top: Math.max(0, selected.y - 34) }}>
                    {selected.type === "text" && (
                      <button title="Đọc lớp này" onClick={() => readLayer(selected)}>🔊</button>
                    )}
                    <button title="Nhân đôi (Ctrl+D)" onClick={() => duplicateLayer(selected.id)}>⧉</button>
                    <button title="Xoá (Delete)" onClick={() => removeLayer(selected.id)}>✕</button>
                  </div>
                )}

                {guides.x && <div className="bb-guide" style={{ left: PAGE_W / 2 - 0.5, top: 0, bottom: 0, width: 1 }} />}
                {guides.y && <div className="bb-guide" style={{ top: PAGE_H / 2 - 0.5, left: 0, right: 0, height: 1 }} />}

                <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontFamily: "Georgia, serif", fontSize: 12, color: "rgba(31,42,36,0.32)", pointerEvents: "none", userSelect: "none" }}>
                  {pageIndex + 1}
                </div>
              </div>
            </div>
          </div>

          <div className="bb-hint">
            Kéo để di chuyển · kéo chấm xanh ở góc để đổi cỡ · rê chuột vào từng chữ để nghe đọc từ đó · Ctrl+Z hoàn tác, Delete
            xoá lớp, mũi tên di chuyển, Ctrl+D nhân đôi.
          </div>
        </div>
      </div>

      {previewOpen && <PreviewOverlay pages={pages} startIndex={pageIndex} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}