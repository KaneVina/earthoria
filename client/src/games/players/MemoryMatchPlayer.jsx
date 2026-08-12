import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Timer, RotateCw, Trophy } from "lucide-react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Face({ face }) {
  if (face.kind === "image" && face.value) {
    return <img src={face.value} alt="" className="g-mm-face-img" />;
  }
  return <span className="g-mm-face-text">{face.value}</span>;
}

export default function MemoryMatchPlayer({ config, onFinish }) {
  const pairs = config?.pairs || [];

  const cards = useMemo(() => {
    const list = [];
    pairs.forEach((p) => {
      list.push({ uid: `${p.id}-a`, pairId: p.id, face: p.cardA });
      list.push({ uid: `${p.id}-b`, pairId: p.id, face: p.cardB });
    });
    return shuffle(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [flipped, setFlipped] = useState([]); // uids hiện đang lật, tối đa 2
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const cols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(cards.length))));

  const handleFlip = (card) => {
    if (locked) return;
    if (flipped.includes(card.uid) || matched.has(card.pairId)) return;

    const next = [...flipped, card.uid];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [uidA, uidB] = next;
      const cardA = cards.find((c) => c.uid === uidA);
      const cardB = cards.find((c) => c.uid === uidB);
      const isMatch = cardA.pairId === cardB.pairId;

      setTimeout(
        () => {
          if (isMatch) {
            setMatched((prev) => new Set(prev).add(cardA.pairId));
          }
          setFlipped([]);
          setLocked(false);
        },
        isMatch ? 500 : 850,
      );
    }
  };

  useEffect(() => {
    if (pairs.length > 0 && matched.size === pairs.length && !finishedRef.current) {
      finishedRef.current = true;
      const score = Math.max(100, Math.round(1000 - (moves - pairs.length) * 25 - elapsed * 3));
      setTimeout(() => onFinish(score, elapsed), 550);
    }
  }, [matched, pairs.length, moves, elapsed, onFinish]);

  const progressPct = pairs.length ? Math.round((matched.size / pairs.length) * 100) : 0;
  const allDone = pairs.length > 0 && matched.size === pairs.length;

  return (
    <div className="g-play g-play--memory">
      <div className="g-play-stats">
        <span>
          <Timer size={14} /> {elapsed}s
        </span>
        <span>
          <RotateCw size={14} /> {moves} lượt lật
        </span>
        <span className={allDone ? "g-stat-done" : ""}>
          {allDone ? <Trophy size={14} /> : <Check size={14} />} {matched.size}/{pairs.length}
        </span>
      </div>

      <div className="g-progress-bar">
        <div className="g-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="g-mm-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.uid) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);
          return (
            <button
              type="button"
              key={card.uid}
              className={`g-mm-card${isFlipped ? " flipped" : ""}${isMatched ? " matched" : ""}`}
              onClick={() => handleFlip(card)}
            >
              <div className="g-mm-card-inner">
                <div className="g-mm-card-back">?</div>
                <div className="g-mm-card-front">
                  <Face face={card.face} />
                  {isMatched && (
                    <span className="g-mm-check">
                      <Check size={14} />
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}