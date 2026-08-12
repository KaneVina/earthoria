import { generateWordSearchGrid } from "./utils/wordSearchGenerator";

function normText(v) {
  return (v ?? "").toString().trim();
}

function faceLabel(face) {
  if (!face) return "";
  if (face.kind === "image") return face.value ? `img:${face.value}` : "";
  return normText(face.value).toLowerCase();
}

// ─ MEMORY MATCH ───────────────────────────────────────────────
export function analyzeMemoryMatch(config) {
  const pairs = config?.pairs || [];
  const errors = [];
  const rowIssues = {};

  if (pairs.length < 2) {
    errors.push("Cần tối thiểu 2 cặp thẻ để trò chơi có thể chơi được.");
  }

  const seen = new Map(); // nội dung mặt thẻ (đã chuẩn hoá) -> số thứ tự cặp đầu tiên dùng nó

  pairs.forEach((p, i) => {
    const n = i + 1;
    const aEmpty = !faceLabel(p.cardA);
    const bEmpty = !faceLabel(p.cardB);
    const issue = { cardA: aEmpty, cardB: bEmpty, duplicate: false };

    if (aEmpty && bEmpty) errors.push(`Cặp ${n}: cả 2 mặt thẻ đều đang trống.`);
    else if (aEmpty) errors.push(`Cặp ${n}: Mặt A đang trống.`);
    else if (bEmpty) errors.push(`Cặp ${n}: Mặt B đang trống.`);

    [p.cardA, p.cardB].forEach((face) => {
      const key = faceLabel(face);
      if (!key) return;
      const firstAt = seen.get(key);
      if (firstAt !== undefined && firstAt !== n) {
        issue.duplicate = true;
        errors.push(
          `Cặp ${n}: có mặt thẻ trùng nội dung với cặp ${firstAt} — 2 thẻ giống hệt nhau nhưng thuộc 2 cặp khác nhau sẽ khiến người chơi lật đúng cũng bị báo sai.`,
        );
      } else if (firstAt === undefined) {
        seen.set(key, n);
      }
    });

    rowIssues[p.id] = issue;
  });

  return { errors, rowIssues };
}

// ─ MATCH PAIRS ────────────────────────────────────────────────
export function analyzeMatchPairs(config) {
  const pairs = config?.pairs || [];
  const errors = [];
  const rowIssues = {};

  if (pairs.length < 2) {
    errors.push("Cần tối thiểu 2 cặp để trò chơi có thể chơi được.");
  }

  const seenLeft = new Map();
  const seenRight = new Map();

  pairs.forEach((p, i) => {
    const n = i + 1;
    const left = normText(p.left);
    const right = normText(p.right);
    const issue = { left: !left, right: !right, leftDup: false, rightDup: false };

    if (!left && !right) errors.push(`Cặp ${n}: cả cột trái và phải đều đang trống.`);
    else if (!left) errors.push(`Cặp ${n}: cột trái đang trống.`);
    else if (!right) errors.push(`Cặp ${n}: cột phải đang trống.`);

    if (left) {
      const key = left.toLowerCase();
      const firstAt = seenLeft.get(key);
      if (firstAt !== undefined) {
        issue.leftDup = true;
        errors.push(`Cặp ${n}: mục cột trái trùng với cặp ${firstAt}.`);
      } else {
        seenLeft.set(key, n);
      }
    }
    if (right) {
      const key = right.toLowerCase();
      const firstAt = seenRight.get(key);
      if (firstAt !== undefined) {
        issue.rightDup = true;
        errors.push(`Cặp ${n}: mục cột phải trùng với cặp ${firstAt}.`);
      } else {
        seenRight.set(key, n);
      }
    }

    rowIssues[p.id] = issue;
  });

  return { errors, rowIssues };
}

// ─ WORD SEARCH ────────────────────────────────────────────────
// Kiểm tra nhanh (độ dài / trùng lặp) — dùng để tô đỏ tag khi đang gõ.
export function analyzeWordSearch(config) {
  const words = config?.words || [];
  const errors = [];
  const wordIssues = words.map(() => ({ tooLong: false, duplicate: false }));
  const seen = new Map();

  words.forEach((w, i) => {
    const clean = normText(w).toUpperCase().replace(/\s+/g, "");
    if (clean.length > 14) {
      wordIssues[i].tooLong = true;
      errors.push(`Từ "${w}" dài quá 14 chữ cái — hãy rút ngắn lại.`);
    }
    if (clean) {
      const firstAt = seen.get(clean);
      if (firstAt !== undefined) {
        wordIssues[i].duplicate = true;
        errors.push(`Từ "${w}" bị trùng lặp trong danh sách.`);
      } else {
        seen.set(clean, i);
      }
    }
  });

  if (words.length === 0) errors.push("Cần thêm ít nhất 1 từ khoá.");

  return { errors, wordIssues };
}

export function validateWordSearchFull(config) {
  const { errors } = analyzeWordSearch(config);
  const words = (config?.words || []).map(normText).filter(Boolean);
  if (words.length > 0) {
    const { placements } = generateWordSearchGrid(words, config?.rows, config?.cols);
    const uniqueCount = new Set(words.map((w) => w.toUpperCase().replace(/\s+/g, ""))).size;
    if (placements.length < uniqueCount) {
      errors.push(
        `Bảng hiện chưa đủ chỗ cho tất cả các từ (${placements.length}/${uniqueCount}) — hãy tăng số hàng/cột hoặc bớt bớt vài từ dài.`,
      );
    }
  }
  return errors;
}

// ─ LETTER HUNT ────────────────────────────────────────────────
export function analyzeLetterHunt(config) {
  const secretWord = normText(config?.secretWord);
  const rows = Number(config?.rows) || 8;
  const cols = Number(config?.cols) || 8;
  const timeLimitSeconds = Number(config?.timeLimitSeconds) || 60;
  const letterCount = secretWord.replace(/\s/g, "").length;
  const capacity = rows * cols;
  const errors = [];

  if (letterCount === 0) errors.push("Cần nhập từ khoá bí mật.");
  if (letterCount > capacity) {
    errors.push(`Bảng ${rows}×${cols} (${capacity} ô) không đủ chỗ cho ${letterCount} chữ cái — hãy tăng số hàng/cột.`);
  }
  if (timeLimitSeconds < 15) errors.push("Thời gian chơi cần tối thiểu 15 giây.");

  return { errors, letterCount, capacity, overCapacity: letterCount > capacity };
}

export function validateLetterHunt(config) {
  return analyzeLetterHunt(config).errors;
}

export function validateMemoryMatch(config) {
  return analyzeMemoryMatch(config).errors;
}

export function validateMatchPairs(config) {
  return analyzeMatchPairs(config).errors;
}