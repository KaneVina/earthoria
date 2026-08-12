import React, { useEffect, useMemo, useRef, useState } from "react";
import { Timer, ListChecks, Trophy, Check } from "lucide-react";
import { generateWordSearchGrid } from "../utils/wordSearchGenerator";

function snapDirection(dr, dc) {
  if (dr === 0 && dc === 0) return null;
  const deg = (Math.atan2(dr, dc) * 180) / Math.PI;
  const dirs = [
    { deg: 0, dr: 0, dc: 1 },
    { deg: 45, dr: 1, dc: 1 },
    { deg: 90, dr: 1, dc: 0 },
    { deg: 135, dr: 1, dc: -1 },
    { deg: 180, dr: 0, dc: -1 },
    { deg: -180, dr: 0, dc: -1 },
    { deg: -135, dr: -1, dc: -1 },
    { deg: -90, dr: -1, dc: 0 },
    { deg: -45, dr: -1, dc: 1 },
  ];
  let best = dirs[0];
  let bestDiff = Infinity;
  for (const d of dirs) {
    let diff = Math.abs(deg - d.deg);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = d;
    }
  }
  return { dr: best.dr, dc: best.dc };
}

function getSelectionPath(start, hovered, rows, cols) {
  const dr = hovered.r - start.r;
  const dc = hovered.c - start.c;
  if (dr === 0 && dc === 0) return [start];
  const dir = snapDirection(dr, dc);
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const cells = [];
  for (let i = 0; i <= steps; i++) {
    const r = start.r + dir.dr * i;
    const c = start.c + dir.dc * i;
    if (r < 0 || r >= rows || c < 0 || c >= cols) break;
    cells.push({ r, c });
  }
  return cells;
}

function sameCells(a, b) {
  if (a.length !== b.length) return false;
  return a.every((cell, i) => cell.r === b[i].r && cell.c === b[i].c);
}

export default function WordSearchPlayer({ config, onFinish }) {
  const { grid, rows, cols, placements } = useMemo(
    () => generateWordSearchGrid(config?.words || [], config?.rows, config?.cols),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const boardRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [selection, setSelection] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundCells, setFoundCells] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const cellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const target = el?.closest?.("[data-r]");
    if (!target) return null;
    return { r: Number(target.dataset.r), c: Number(target.dataset.c) };
  };

  const handlePointerDown = (e) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    boardRef.current?.setPointerCapture?.(e.pointerId);
    setDragging(true);
    setStart(cell);
    setSelection([cell]);
  };

  const handlePointerMove = (e) => {
    if (!dragging || !start) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setSelection(getSelectionPath(start, cell, rows, cols));
  };

  const finishDrag = () => {
    if (!dragging) return;
    setDragging(false);

    for (const p of placements) {
      if (foundWords.has(p.word)) continue;
      if (sameCells(selection, p.cells) || sameCells(selection, [...p.cells].reverse())) {
        setFoundWords((prev) => new Set(prev).add(p.word));
        setFoundCells((prev) => {
          const next = new Set(prev);
          p.cells.forEach((c) => next.add(`${c.r}-${c.c}`));
          return next;
        });
        break;
      }
    }
    setSelection([]);
    setStart(null);
  };

  const totalWords = new Set(placements.map((p) => p.word)).size;

  useEffect(() => {
    if (totalWords > 0 && foundWords.size === totalWords && !finishedRef.current) {
      finishedRef.current = true;
      const score = Math.max(100, Math.round(1000 - elapsed * 4));
      setTimeout(() => onFinish(score, elapsed), 500);
    }
  }, [foundWords, totalWords, elapsed, onFinish]);

  const selectionKeys = new Set(selection.map((c) => `${c.r}-${c.c}`));
  const uniqueWords = [...new Set((config?.words || []).map((w) => w.toUpperCase().trim().replace(/\s+/g, "")))];
  const progressPct = totalWords ? Math.round((foundWords.size / totalWords) * 100) : 0;
  const allDone = totalWords > 0 && foundWords.size === totalWords;

  return (
    <div className="g-play g-play--wordsearch">
      <div className="g-play-stats">
        <span>
          <Timer size={14} /> {elapsed}s
        </span>
        <span className={allDone ? "g-stat-done" : ""}>
          {allDone ? <Trophy size={14} /> : <ListChecks size={14} />} {foundWords.size}/{totalWords}
        </span>
      </div>

      <div className="g-progress-bar">
        <div className="g-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="g-ws-play-layout">
        <div
          ref={boardRef}
          className="g-ws-board"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const isFound = foundCells.has(key);
              const isSelecting = selectionKeys.has(key);
              return (
                <div
                  key={key}
                  data-r={r}
                  data-c={c}
                  className={`g-ws-cell${isFound ? " found" : ""}${isSelecting ? " selecting" : ""}`}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>

        <div className="g-ws-word-panel">
          <div className="g-ws-word-panel-title">
            <ListChecks size={14} /> Từ cần tìm
          </div>
          <div className="g-ws-word-list">
            {uniqueWords.map((w) => (
              <div key={w} className={`g-ws-word-chip${foundWords.has(w) ? " found" : ""}`}>
                {foundWords.has(w) && <Check size={11} />}
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}