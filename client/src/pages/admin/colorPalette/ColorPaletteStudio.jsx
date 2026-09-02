import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Shuffle,
  Copy,
  Download,
  Plus,
  Trash2,
  ClipboardCopy,
  Check,
} from "lucide-react";
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  normalizeHex,
  randomHex,
  idealTextColor,
  slugify,
  generatePalette,
  NAMING_PATTERNS,
  SHADE_COUNT_MIN,
  SHADE_COUNT_MAX,
} from "./colorUtils";
import "../../../components/assets/css/colorPalette.css";

const ALGORITHMS = [
  { id: "tailwind", label: "Tailwind CSS" },
  { id: "linear", label: "Linear HSL" },
];

const EXPORT_TABS = [
  { id: "css", label: "CSS" },
  { id: "tailwind", label: "Tailwind" },
  { id: "tokens", label: "Tokens" },
];

const MAX_PALETTES = 6;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function escapeXml(str) {
  return String(str).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c],
  );
}

/* Slider dùng chung — nền gradient truyền vào qua CSS variable để luôn khớp màu hiện tại */
function GradientSlider({
  value,
  min,
  max,
  step,
  gradient,
  onChange,
  ariaLabel,
}) {
  return (
    <input
      type="range"
      className="cp-slider-input"
      style={{ "--cp-grad": gradient }}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
    />
  );
}

export default function ColorPaletteStudio({ onApplyColor } = {}) {
  const [palettes, setPalettes] = useState([{ id: uid(), hex: "#3b5bdb" }]);
  const [format, setFormat] = useState("rgb"); // 'rgb' | 'hsl' — chỉ đổi cách hiển thị số liệu
  const [algorithm, setAlgorithm] = useState("tailwind");
  const [contrastShift, setContrastShift] = useState(0);
  const [namingPatternId, setNamingPatternId] = useState("tailwind");
  const [shadeCount, setShadeCount] = useState(11);
  const [exportFormat, setExportFormat] = useState("css");

  const primary = palettes[0];
  const [hexDraft, setHexDraft] = useState(() =>
    primary.hex.slice(1).toUpperCase(),
  );
  const [syncedHex, setSyncedHex] = useState(primary.hex);
  if (primary.hex !== syncedHex) {
    setSyncedHex(primary.hex);
    setHexDraft(primary.hex.slice(1).toUpperCase());
  }

  const setHexFor = useCallback((id, hex) => {
    setPalettes((prev) => prev.map((p) => (p.id === id ? { ...p, hex } : p)));
  }, []);

  // Hit Spacebar để random màu gốc — bỏ qua khi người dùng đang gõ trong 1 input/select khác
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code !== "Space") return;
      const tag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      e.preventDefault();
      setHexFor(palettes[0].id, randomHex());
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [palettes, setHexFor]);

  const rgb = hexToRgb(primary.hex) || { r: 0, g: 0, b: 0 };
  const hsl = hexToHsl(primary.hex) || { h: 0, s: 0, l: 0 };

  const handleHexDraftChange = (e) => {
    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexDraft(raw.toUpperCase());
    if (raw.length === 6) setHexFor(primary.id, `#${raw}`);
  };

  const handleHexBlur = () => {
    const normalized = normalizeHex(hexDraft);
    if (normalized) {
      // hexDraft sẽ tự đồng bộ lại theo primary.hex mới ở lần render kế tiếp
      setHexFor(primary.id, normalized);
    } else {
      // Mã không hợp lệ — trả ô nhập về đúng màu hiện tại
      setHexDraft(primary.hex.slice(1).toUpperCase());
    }
  };

  const setRgbChannel = (channel) => (e) => {
    const v = Math.max(0, Math.min(255, Number(e.target.value) || 0));
    setHexFor(primary.id, rgbToHex({ ...rgb, [channel]: v }));
  };

  const setHslChannel = (channel, max) => (e) => {
    const v = Math.max(0, Math.min(max, Number(e.target.value) || 0));
    setHexFor(primary.id, hslToHex({ ...hsl, [channel]: v }));
  };

  const setHue = (v) => setHexFor(primary.id, hslToHex({ ...hsl, h: v }));
  const setSat = (v) => setHexFor(primary.id, hslToHex({ ...hsl, s: v }));
  const setLight = (v) => setHexFor(primary.id, hslToHex({ ...hsl, l: v }));

  const addPalette = () => {
    if (palettes.length >= MAX_PALETTES) return;
    setPalettes((prev) => [...prev, { id: uid(), hex: randomHex() }]);
  };

  const removePalette = (id) => {
    setPalettes((prev) =>
      prev.length <= 1 ? prev : prev.filter((p) => p.id !== id),
    );
  };

  const shufflePalette = (id) => setHexFor(id, randomHex());

  const palettesComputed = useMemo(
    () =>
      palettes.map((p) => ({
        ...p,
        palette: generatePalette({
          baseHex: p.hex,
          algorithm,
          namingPatternId,
          shadeCount,
          contrastShift,
        }),
      })),
    [palettes, algorithm, namingPatternId, shadeCount, contrastShift],
  );

  // Tránh trùng tên khi 2 bảng màu ra cùng 1 tên gần đúng
  const slugs = useMemo(() => {
    const used = new Map();
    return palettesComputed.map((p) => {
      const base = slugify(p.palette.name);
      const count = used.get(base) || 0;
      used.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    });
  }, [palettesComputed]);

  const copyText = (text, message) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error("Không thể copy, trình duyệt chặn clipboard"));
  };

  const handleApplyClick = (e, hex) => {
    e.stopPropagation();
    onApplyColor(hex);
    toast.success(`Đã áp dụng ${hex.toUpperCase()}`);
  };

  const exportText = useMemo(() => {
    if (exportFormat === "tailwind") {
      const body = palettesComputed
        .map(
          (p, i) =>
            `    '${slugs[i]}': {\n${p.palette.shades
              .map((s) => `      '${s.step}': '${s.hex}',`)
              .join("\n")}\n    },`,
        )
        .join("\n");
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${body}\n      },\n    },\n  },\n};`;
    }
    if (exportFormat === "tokens") {
      const body = palettesComputed
        .map(
          (p, i) =>
            `  "${slugs[i]}": {\n${p.palette.shades
              .map((s) => `    "${s.step}": { "value": "${s.hex}" },`)
              .join("\n")}\n  },`,
        )
        .join("\n");
      return `{\n${body}\n}`;
    }
    // css
    const body = palettesComputed
      .map((p, i) =>
        p.palette.shades
          .map((s) => `  --${slugs[i]}-${s.step}: ${s.hex};`)
          .join("\n"),
      )
      .join("\n\n");
    return `:root {\n${body}\n}`;
  }, [palettesComputed, slugs, exportFormat]);

  const buildSvgMarkup = () => {
    const tileW = 108,
      tileH = 88,
      gap = 8,
      padding = 24,
      titleH = 26,
      rowGap = 30;
    const maxCols = Math.max(
      ...palettesComputed.map((p) => p.palette.shades.length),
    );
    const width = padding * 2 + maxCols * (tileW + gap) - gap;
    const rowHeight = titleH + tileH;
    const height =
      padding * 2 + palettesComputed.length * (rowHeight + rowGap) - rowGap;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
    palettesComputed.forEach((row, ri) => {
      const y0 = padding + ri * (rowHeight + rowGap);
      svg += `<text x="${padding}" y="${y0 + 16}" font-family="Georgia, serif" font-size="15" font-weight="700" fill="#0d3330">${escapeXml(
        row.palette.name,
      )}</text>`;
      row.palette.shades.forEach((s, si) => {
        const x = padding + si * (tileW + gap);
        const y = y0 + titleH;
        const textColor = idealTextColor(s.hex);
        svg += `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="8" fill="${s.hex}"/>`;
        svg += `<text x="${x + 10}" y="${y + 20}" font-family="monospace" font-size="12" font-weight="700" fill="${textColor}">${s.step}</text>`;
        svg += `<text x="${x + 10}" y="${y + tileH - 12}" font-family="monospace" font-size="10" fill="${textColor}">${s.hex.toUpperCase()}</text>`;
      });
    });
    svg += `</svg>`;
    return svg;
  };

  const downloadSvg = () => {
    const svg = buildSvgMarkup();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "color-palette.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Đã tải file SVG");
  };

  const copySvg = () =>
    copyText(buildSvgMarkup(), "Đã copy mã SVG — dán trực tiếp vào Figma");

  const hueGradient =
    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
  const satGradient = `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
  const lightGradient = `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`;
  const contrastGradient = "linear-gradient(to right, #000000, #d9d9d9)";

  return (
    <div className="cp-wrap">
      {/*   Hàng điều khiển trên cùng   */}
      <div className="cp-controls-grid">
        {/* Màu gốc */}
        <div className="cp-card">
          <div className="cp-swatch-row">
            <span className="cp-swatch" style={{ background: primary.hex }}>
              <input
                type="color"
                value={primary.hex}
                onChange={(e) => setHexFor(primary.id, e.target.value)}
                aria-label="Chọn màu gốc"
              />
            </span>
            <span
              style={{
                color: "var(--cp-ink-40)",
                fontFamily: "var(--cp-font-serif)",
                fontSize: 19,
              }}
            >
              #
            </span>
            <input
              className="cp-hex-input"
              value={hexDraft}
              onChange={handleHexDraftChange}
              onBlur={handleHexBlur}
              maxLength={6}
              spellCheck={false}
              aria-label="Mã màu hex"
            />
            <select
              className="cp-format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </div>

          {format === "rgb" ? (
            <div className="cp-rgb-grid">
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">R</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.r)}
                  onChange={setRgbChannel("r")}
                />
              </label>
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">G</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.g)}
                  onChange={setRgbChannel("g")}
                />
              </label>
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">B</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.b)}
                  onChange={setRgbChannel("b")}
                />
              </label>
            </div>
          ) : (
            <div className="cp-rgb-grid">
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">H</span>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={Math.round(hsl.h)}
                  onChange={setHslChannel("h", 360)}
                />
              </label>
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">S</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(hsl.s)}
                  onChange={setHslChannel("s", 100)}
                />
              </label>
              <label className="cp-rgb-field">
                <span className="cp-rgb-field-label">L</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(hsl.l)}
                  onChange={setHslChannel("l", 100)}
                />
              </label>
            </div>
          )}

          <div className="cp-slider-stack">
            <GradientSlider
              value={hsl.h}
              min={0}
              max={360}
              step={1}
              gradient={hueGradient}
              onChange={setHue}
              ariaLabel="Hue"
            />
            <GradientSlider
              value={hsl.s}
              min={0}
              max={100}
              step={1}
              gradient={satGradient}
              onChange={setSat}
              ariaLabel="Saturation"
            />
            <GradientSlider
              value={hsl.l}
              min={0}
              max={100}
              step={1}
              gradient={lightGradient}
              onChange={setLight}
              ariaLabel="Lightness"
            />
          </div>
        </div>

        {/* Thuật toán */}
        <div className="cp-card">
          <span className="cp-label">Algorithm</span>
          <select
            className="cp-select"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
          >
            {ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>

          <span className="cp-label">Contrast Shift</span>
          <div className="cp-contrast-value">{contrastShift.toFixed(2)}</div>
          <GradientSlider
            value={contrastShift}
            min={-1}
            max={1}
            step={0.01}
            gradient={contrastGradient}
            onChange={setContrastShift}
            ariaLabel="Contrast shift"
          />
        </div>

        {/* Naming pattern + shade count */}
        <div className="cp-card">
          <span className="cp-label">Naming Pattern</span>
          <select
            className="cp-select"
            value={namingPatternId}
            onChange={(e) => setNamingPatternId(e.target.value)}
          >
            {NAMING_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <span className="cp-label">Shade Count</span>
          <div className="cp-stepper">
            <button
              type="button"
              className="cp-stepper-btn"
              onClick={() =>
                setShadeCount((c) => Math.max(SHADE_COUNT_MIN, c - 1))
              }
              disabled={shadeCount <= SHADE_COUNT_MIN}
              aria-label="Giảm số lượng sắc độ"
            >
              −
            </button>
            <span className="cp-stepper-value">{shadeCount}</span>
            <button
              type="button"
              className="cp-stepper-btn"
              onClick={() =>
                setShadeCount((c) => Math.min(SHADE_COUNT_MAX, c + 1))
              }
              disabled={shadeCount >= SHADE_COUNT_MAX}
              aria-label="Tăng số lượng sắc độ"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p className="cp-hint">
        Nhấn <kbd>Space</kbd> để random màu gốc, hoặc bấm vào từng ô màu bên
        dưới để copy mã hex
      </p>

      {palettesComputed.map((row, i) => (
        <div className="cp-palette-row" key={row.id}>
          <div className="cp-palette-header">
            <div className="cp-palette-title-group">
              <span
                className="cp-palette-dot"
                style={{ background: row.hex }}
              />
              <h3 className="cp-palette-title">{row.palette.name}</h3>
            </div>
            <div className="cp-palette-actions">
              <button
                type="button"
                className="cp-icon-btn"
                onClick={() => shufflePalette(row.id)}
                title="Random màu này"
                aria-label="Random màu này"
              >
                <Shuffle size={14} />
              </button>
              {i > 0 && (
                <button
                  type="button"
                  className="cp-icon-btn danger"
                  onClick={() => removePalette(row.id)}
                  title="Xoá bảng màu này"
                  aria-label="Xoá bảng màu này"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="cp-swatch-grid">
            {row.palette.shades.map((s) => {
              const textColor = idealTextColor(s.hex);
              const hexUpper = s.hex.toUpperCase();
              return (
                <div
                  key={s.step}
                  className="cp-swatch-tile"
                  style={{ background: s.hex, color: textColor }}
                  role="button"
                  tabIndex={0}
                  onClick={() => copyText(hexUpper, `Đã copy ${hexUpper}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      copyText(hexUpper, `Đã copy ${hexUpper}`);
                    }
                  }}
                  title={`Bấm để copy ${hexUpper}`}
                >
                  <span className="cp-swatch-step">
                    {s.step}
                    {s.isAnchor && (
                      <span className="cp-anchor-dot" title="Màu gốc" />
                    )}
                  </span>
                  {onApplyColor && (
                    <button
                      type="button"
                      className="cp-swatch-apply"
                      onClick={(e) => handleApplyClick(e, s.hex)}
                      title="Dùng màu này"
                      aria-label={`Dùng ${hexUpper} cho lựa chọn hiện tại`}
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <span className="cp-swatch-hex">{hexUpper}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="cp-add-palette"
        onClick={addPalette}
        disabled={palettes.length >= MAX_PALETTES}
      >
        <Plus size={15} />
        {palettes.length >= MAX_PALETTES
          ? "Đã đạt tối đa số bảng màu"
          : "Thêm bảng màu mới"}
      </button>

      {/*   Xuất mã   */}
      <div className="cp-export-bar">
        <div className="cp-export-top">
          <div className="cp-export-tabs">
            {EXPORT_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cp-export-tab${exportFormat === t.id ? " active" : ""}`}
                onClick={() => setExportFormat(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="cp-export-actions">
            <button
              type="button"
              className="cp-btn cp-btn-ghost"
              onClick={copySvg}
            >
              <ClipboardCopy size={13} /> SVG/Figma
            </button>
            <button
              type="button"
              className="cp-btn cp-btn-ghost"
              onClick={downloadSvg}
            >
              <Download size={13} /> SVG
            </button>
            <button
              type="button"
              className="cp-btn cp-btn-primary"
              onClick={() => copyText(exportText, "Đã copy mã màu")}
            >
              <Copy size={13} /> Copy code
            </button>
          </div>
        </div>
        <pre className="cp-export-code">{exportText}</pre>
      </div>
    </div>
  );
}
