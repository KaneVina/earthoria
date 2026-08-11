import React, { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";

const FILLER_LETTERS = "ABCDEFGHIKLMNOPQRSTUVXY".split("");

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

function buildGrid(secretWord, rows, cols) {
  const targetLetters = Array.from(secretWord.toUpperCase()).filter((ch) => ch !== " ");
  let R = rows || 8;
  let C = cols || 8;
  if (targetLetters.length > R * C) {
    C = Math.ceil(targetLetters.length / R);
  }

  const allIdx = shuffle(Array.from({ length: R * C }, (_, i) => i));
  const chosen = allIdx.slice(0, targetLetters.length);

  const grid = Array.from({ length: R }, () => Array(C).fill(null));
  chosen.forEach((idx, i) => {
    const r = Math.floor(idx / C);
    const c = idx % C;
    grid[r][c] = targetLetters[i];
  });
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (!grid[r][c]) grid[r][c] = FILLER_LETTERS[randomInt(FILLER_LETTERS.length)];
    }
  }

  return { grid, rows: R, cols: C, targetLetters };
}

export default function LetterHuntPlayer({ config, onFinish }) {
  const secretWord = (config?.secretWord || "").toUpperCase();
  const timeLimit = config?.timeLimitSeconds || 60;

  const [roundKey, setRoundKey] = useState(0);
  const { grid, rows, cols, targetLetters } = useMemo(
    () => buildGrid(secretWord, config?.rows, config?.cols),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundKey],
  );

  const [consumed, setConsumed] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongKey, setWrongKey] = useState(null);
  const [remaining, setRemaining] = useState(timeLimit);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const finishedRef = useRef(false);

  useEffect(() => {
    if (status !== "playing") return;
    if (remaining <= 0) {
      setStatus("lost");
      return;
    }
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, status]);

  const rawChars = Array.from(secretWord);
  let counter = 0;
  const slots = rawChars.map((ch) => {
    if (ch === " ") return { isSpace: true };
    const idx = counter;
    counter += 1;
    return { isSpace: false, idx };
  });

  const handleTap = (r, c) => {
    if (status !== "playing") return;
    const key = `${r}-${c}`;
    if (consumed.has(key)) return;

    const needed = targetLetters[progress];
    if (grid[r][c] === needed) {
      const nextConsumed = new Set(consumed).add(key);
      setConsumed(nextConsumed);
      const nextProgress = progress + 1;
      setProgress(nextProgress);
      if (nextProgress >= targetLetters.length) {
        setStatus("won");
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongKey(key);
      setTimeout(() => setWrongKey(null), 350);
    }
  };

  useEffect(() => {
    if (status === "won" && !finishedRef.current) {
      finishedRef.current = true;
      const score = Math.max(50, Math.round(500 + remaining * 10 - mistakes * 15));
      setTimeout(() => onFinish(score, timeLimit - remaining), 500);
    }
  }, [status, remaining, mistakes, onFinish, timeLimit]);

  const handleRetry = () => {
    finishedRef.current = false;
    setConsumed(new Set());
    setProgress(0);
    setMistakes(0);
    setWrongKey(null);
    setRemaining(timeLimit);
    setStatus("playing");
    setRoundKey((k) => k + 1);
  };

  return (
    <div className="g-play">
      <div className="g-play-stats">
        <span className={remaining <= 10 && status === "playing" ? "g-timer-urgent" : ""}>
          <Timer size={13} style={{ verticalAlign: -2 }} /> {remaining}s
        </span>
        <span>❌ {mistakes} lần sai</span>
      </div>

      <div className="g-lh-progress">
        {slots.map((slot, i) =>
          slot.isSpace ? (
            <span key={i} className="g-lh-space" />
          ) : (
            <span key={i} className={`g-lh-slot${slot.idx < progress ? " filled" : ""}`}>
              {slot.idx < progress ? targetLetters[slot.idx] : ""}
            </span>
          ),
        )}
      </div>

      {status === "lost" ? (
        <div className="g-lh-overlay">
          <p>Hết giờ rồi! Thử lại nhé 💪</p>
          <button type="button" className="a-btn-primary" onClick={handleRetry}>
            Chơi lại
          </button>
        </div>
      ) : (
        <div className="g-lh-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const isDone = consumed.has(key);
              const isWrong = wrongKey === key;
              return (
                <button
                  type="button"
                  key={key}
                  className={`g-lh-cell${isDone ? " done" : ""}${isWrong ? " wrong" : ""}`}
                  onClick={() => handleTap(r, c)}
                  disabled={isDone || status !== "playing"}
                >
                  {letter}
                </button>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}