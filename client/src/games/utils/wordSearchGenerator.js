const DIRECTIONS = [
  { dr: 0, dc: 1 }, // ngang →
  { dr: 1, dc: 0 }, // dọc ↓
  { dr: 1, dc: 1 }, // chéo ↘
  { dr: 1, dc: -1 }, // chéo ↙
];

const FILLER_LETTERS = "ABCDEFGHIKLMNOPQRSTUVXY".split("");

function normalizeWord(word) {
  return Array.from(String(word).toUpperCase().trim().replace(/\s+/g, ""));
}

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateWordSearchGrid(words, rows, cols) {
  const cleanWords = words.map(normalizeWord).filter((w) => w.length > 0);
  if (cleanWords.length === 0) {
    return { grid: [], rows: 0, cols: 0, placements: [] };
  }

  const longest = Math.max(...cleanWords.map((w) => w.length), 4);
  const totalLetters = cleanWords.reduce((a, w) => a + w.length, 0);

  let R =
    rows || Math.max(longest + 2, Math.ceil(Math.sqrt(totalLetters * 2.4)), 8);
  let C = cols || R;

  for (let attempt = 0; attempt < 10; attempt++) {
    const grid = Array.from({ length: R }, () => Array(C).fill(null));
    const placements = [];
    const ordered = [...cleanWords].sort((a, b) => b.length - a.length);
    let ok = true;

    for (const letters of ordered) {
      let placed = false;
      const dirOrder = shuffle(DIRECTIONS);

      outer: for (let d = 0; d < dirOrder.length; d++) {
        const dir = dirOrder[d];
        for (let tries = 0; tries < 40; tries++) {
          const forward = Math.random() < 0.5;
          const seq = forward ? letters : [...letters].reverse();
          const startR = randomInt(R);
          const startC = randomInt(C);
          const endR = startR + dir.dr * (seq.length - 1);
          const endC = startC + dir.dc * (seq.length - 1);
          if (endR < 0 || endR >= R || endC < 0 || endC >= C) continue;

          let fits = true;
          for (let i = 0; i < seq.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            const existing = grid[r][c];
            if (existing && existing !== seq[i]) {
              fits = false;
              break;
            }
          }
          if (!fits) continue;

          const cells = [];
          for (let i = 0; i < seq.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            grid[r][c] = seq[i];
            cells.push({ r, c });
          }
          placements.push({ word: letters.join(""), cells });
          placed = true;
          break outer;
        }
      }

      if (!placed) {
        ok = false;
        break;
      }
    }

    if (ok) {
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (!grid[r][c])
            grid[r][c] = FILLER_LETTERS[randomInt(FILLER_LETTERS.length)];
        }
      }
      return { grid, rows: R, cols: C, placements };
    }

    R += 1;
    C += 1;
  }

  // Trường hợp cực hiếm không xếp vừa dù đã nới bảng nhiều lần — trả về
  // bảng trống với chỉ chữ ngẫu nhiên để tránh crash UI, tốt hơn là ném lỗi.
  const grid = Array.from({ length: R }, () =>
    Array.from(
      { length: C },
      () => FILLER_LETTERS[randomInt(FILLER_LETTERS.length)],
    ),
  );
  return { grid, rows: R, cols: C, placements: [] };
}
