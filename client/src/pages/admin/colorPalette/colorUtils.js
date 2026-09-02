export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/*    HEX / RGB / HSL    */

export function normalizeHex(hex) {
  if (!hex) return null;
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toLowerCase()}`;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  const num = parseInt(h.slice(1), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (v) =>
    clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  const hh = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp, gp, bp;
  if (hh < 60) [rp, gp, bp] = [c, x, 0];
  else if (hh < 120) [rp, gp, bp] = [x, c, 0];
  else if (hh < 180) [rp, gp, bp] = [0, c, x];
  else if (hh < 240) [rp, gp, bp] = [0, x, c];
  else if (hh < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

export function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

/* Độ sáng tương đối (WCAG) — dùng để tự chọn màu chữ đen/trắng dễ đọc trên từng ô màu */
export function relativeLuminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function idealTextColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#0d3330";
  const L = relativeLuminance(rgb);
  const contrastWithWhite = 1.05 / (L + 0.05);
  const contrastWithBlack = (L + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#111111";
}

export function randomHex() {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.random() * 30; // 55–85%
  const l = 40 + Math.random() * 20; // 40–60%
  return hslToHex({ h, s, l });
}

/*    ĐẶT TÊN MÀU GẦN NHẤT    */
export const NAMED_COLORS = [
  ["Black", "#000000"],
  ["Dim Gray", "#696969"],
  ["Gray", "#808080"],
  ["Dark Gray", "#a9a9a9"],
  ["Silver", "#c0c0c0"],
  ["Light Gray", "#d3d3d3"],
  ["Gainsboro", "#dcdcdc"],
  ["White Smoke", "#f5f5f5"],
  ["White", "#ffffff"],
  ["Slate Gray", "#708090"],
  ["Light Slate Gray", "#778899"],
  ["Midnight Blue", "#191970"],
  ["Navy", "#000080"],
  ["Dark Blue", "#00008b"],
  ["Medium Blue", "#0000cd"],
  ["Blue", "#0000ff"],
  ["Royal Blue", "#4169e1"],
  ["Persian Blue", "#3457d5"],
  ["Cobalt Blue", "#2748c3"],
  ["Steel Blue", "#4682b4"],
  ["Dodger Blue", "#1e90ff"],
  ["Cornflower Blue", "#6495ed"],
  ["Sky Blue", "#87ceeb"],
  ["Light Sky Blue", "#87cefa"],
  ["Deep Sky Blue", "#00bfff"],
  ["Powder Blue", "#b0e0e6"],
  ["Light Blue", "#add8e6"],
  ["Cadet Blue", "#5f9ea0"],
  ["Teal", "#008080"],
  ["Dark Cyan", "#008b8b"],
  ["Cyan", "#00ffff"],
  ["Turquoise", "#40e0d0"],
  ["Medium Turquoise", "#48d1cc"],
  ["Dark Turquoise", "#00ced1"],
  ["Light Sea Green", "#20b2aa"],
  ["Sea Green", "#2e8b57"],
  ["Medium Sea Green", "#3cb371"],
  ["Forest Green", "#228b22"],
  ["Dark Green", "#006400"],
  ["Green", "#008000"],
  ["Emerald", "#50c878"],
  ["Jade", "#00a86b"],
  ["Medium Spring Green", "#00fa9a"],
  ["Spring Green", "#00ff7f"],
  ["Lime Green", "#32cd32"],
  ["Lime", "#00ff00"],
  ["Chartreuse", "#7fff00"],
  ["Lawn Green", "#7cfc00"],
  ["Olive Drab", "#6b8e23"],
  ["Olive", "#808000"],
  ["Dark Olive Green", "#556b2f"],
  ["Yellow Green", "#9acd32"],
  ["Dark Khaki", "#bdb76b"],
  ["Khaki", "#f0e68c"],
  ["Pale Goldenrod", "#eee8aa"],
  ["Goldenrod", "#daa520"],
  ["Dark Goldenrod", "#b8860b"],
  ["Gold", "#ffd700"],
  ["Amber", "#ffbf00"],
  ["Yellow", "#ffff00"],
  ["Light Yellow", "#ffffe0"],
  ["Lemon Chiffon", "#fffacd"],
  ["Wheat", "#f5deb3"],
  ["Tan", "#d2b48c"],
  ["Sandy Brown", "#f4a460"],
  ["Burlywood", "#deb887"],
  ["Peru", "#cd853f"],
  ["Chocolate", "#d2691e"],
  ["Saddle Brown", "#8b4513"],
  ["Sienna", "#a0522d"],
  ["Brown", "#a52a2a"],
  ["Maroon", "#800000"],
  ["Dark Red", "#8b0000"],
  ["Firebrick", "#b22222"],
  ["Crimson", "#dc143c"],
  ["Red", "#ff0000"],
  ["Tomato", "#ff6347"],
  ["Orange Red", "#ff4500"],
  ["Coral", "#ff7f50"],
  ["Dark Orange", "#ff8c00"],
  ["Orange", "#ffa500"],
  ["Amberglow", "#ffb347"],
  ["Salmon", "#fa8072"],
  ["Light Salmon", "#ffa07a"],
  ["Dark Salmon", "#e9967a"],
  ["Indian Red", "#cd5c5c"],
  ["Rosy Brown", "#bc8f8f"],
  ["Hot Pink", "#ff69b4"],
  ["Deep Pink", "#ff1493"],
  ["Pink", "#ffc0cb"],
  ["Light Pink", "#ffb6c1"],
  ["Pale Violet Red", "#db7093"],
  ["Medium Violet Red", "#c71585"],
  ["Orchid", "#da70d6"],
  ["Violet", "#ee82ee"],
  ["Plum", "#dda0dd"],
  ["Thistle", "#d8bfd8"],
  ["Magenta", "#ff00ff"],
  ["Fuchsia", "#ff00ff"],
  ["Medium Orchid", "#ba55d3"],
  ["Dark Orchid", "#9932cc"],
  ["Dark Violet", "#9400d3"],
  ["Dark Magenta", "#8b008b"],
  ["Purple", "#800080"],
  ["Indigo", "#4b0082"],
  ["Rebecca Purple", "#663399"],
  ["Slate Blue", "#6a5acd"],
  ["Medium Slate Blue", "#7b68ee"],
  ["Medium Purple", "#9370db"],
  ["Amethyst", "#9966cc"],
  ["Lavender", "#e6e6fa"],
  ["Periwinkle", "#ccccff"],
  ["Mint", "#98ff98"],
  ["Mint Cream", "#f5fffa"],
  ["Honeydew", "#f0fff0"],
  ["Ivory", "#fffff0"],
  ["Beige", "#f5f5dc"],
  ["Linen", "#faf0e6"],
  ["Antique White", "#faebd7"],
  ["Peach", "#ffe5b4"],
  ["Peach Puff", "#ffdab9"],
  ["Misty Rose", "#ffe4e1"],
  ["Seashell", "#fff5ee"],
];

function rgbDistance(a, b) {
  // Công thức "redmean" — xấp xỉ khoảng cách cảm nhận màu tốt hơn Euclidean thuần
  const rMean = (a.r + b.r) / 2;
  const dr = a.r - b.r,
    dg = a.g - b.g,
    db = a.b - b.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db,
  );
}

export function nearestColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Không xác định";
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const entry of NAMED_COLORS) {
    const dist = rgbDistance(rgb, hexToRgb(entry[1]));
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return best[0];
}

export function slugify(str) {
  return (
    String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "color"
  );
}

/*    NAMING PATTERNS    */

export const NAMING_PATTERNS = [
  {
    id: "tailwind",
    label: "50,100...900",
    base: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    id: "hundred",
    label: "100...900",
    base: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  },
  {
    id: "ten",
    label: "10...100",
    base: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  },
  { id: "numeric", label: "1...10", base: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
];

export const SHADE_COUNT_MIN = 4;
export const SHADE_COUNT_MAX = 14;

export function buildSteps(patternId, count) {
  const pattern =
    NAMING_PATTERNS.find((p) => p.id === patternId) || NAMING_PATTERNS[0];
  const base = pattern.base;
  const n = clamp(count, SHADE_COUNT_MIN, SHADE_COUNT_MAX);

  if (n <= base.length) {
    const start = Math.floor((base.length - n) / 2);
    return base.slice(start, start + n);
  }

  const steps = [...base];
  const deltaEnd = steps[steps.length - 1] - steps[steps.length - 2];
  const deltaStart = steps[1] - steps[0];
  let addToEnd = true;
  while (steps.length < n) {
    if (addToEnd) {
      steps.push(steps[steps.length - 1] + deltaEnd);
    } else {
      const candidate = steps[0] - deltaStart;
      if (candidate > 0) steps.unshift(candidate);
      else steps.push(steps[steps.length - 1] + deltaEnd);
    }
    addToEnd = !addToEnd;
  }
  return steps;
}

/*    SINH BẢNG PHỐI MÀU    */
export function generatePalette({
  baseHex,
  algorithm = "tailwind",
  namingPatternId = "tailwind",
  shadeCount = 11,
  contrastShift = 0,
}) {
  const safeHex = normalizeHex(baseHex) || "#3b5bdb";
  const baseHsl = hexToHsl(safeHex);
  const steps = buildSteps(namingPatternId, shadeCount);
  const n = steps.length;
  const anchorIndex = Math.round((n - 1) / 2);

  const exponent = clamp(Math.pow(2, -clamp(contrastShift, -1, 1)), 0.35, 3);
  const lightBoundL = 97;
  const darkBoundL = algorithm === "linear" ? 9 : 7;

  const shades = steps.map((step, i) => {
    if (i === anchorIndex) {
      return { step, hex: safeHex, isAnchor: true };
    }

    let h = baseHsl.h;
    let s = baseHsl.s;
    let l;

    if (i < anchorIndex) {
      const p = anchorIndex === 0 ? 0 : (anchorIndex - i) / anchorIndex;
      const pc = Math.pow(p, exponent);
      l = baseHsl.l + (lightBoundL - baseHsl.l) * pc;
      if (algorithm === "tailwind") {
        s = baseHsl.s * (1 - 0.45 * pc);
        h = baseHsl.h + 8 * pc;
      }
    } else {
      const denom = n - 1 - anchorIndex;
      const p = denom === 0 ? 0 : (i - anchorIndex) / denom;
      const pc = Math.pow(p, exponent);
      l = baseHsl.l + (darkBoundL - baseHsl.l) * pc;
      if (algorithm === "tailwind") {
        s = baseHsl.s * (1 - 0.15 * pc);
        h = baseHsl.h - 8 * pc;
      }
    }

    const hex = hslToHex({
      h: ((h % 360) + 360) % 360,
      s: clamp(s, 0, 100),
      l: clamp(l, 0, 100),
    });
    return { step, hex, isAnchor: false };
  });

  return {
    baseHex: safeHex,
    name: nearestColorName(safeHex),
    anchorIndex,
    shades,
  };
}
