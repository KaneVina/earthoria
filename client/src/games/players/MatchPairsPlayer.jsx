import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, X as XIcon, Timer, Trophy } from "lucide-react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchPairsPlayer({ config, onFinish }) {
  const pairs = config?.pairs || [];

  const leftItems = useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, text: p.left }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const rightItems = useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, text: p.right }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [wrongFlash, setWrongFlash] = useState(null); // { leftId, rightId }
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const pickLeft = (id) => {
    if (matchedIds.has(id) || wrongFlash) return;
    setSelectedLeft(id);
    if (selectedRight) evaluate(id, selectedRight);
  };
  const pickRight = (id) => {
    if (matchedIds.has(id) || wrongFlash) return;
    setSelectedRight(id);
    if (selectedLeft) evaluate(selectedLeft, id);
  };

  const evaluate = (leftId, rightId) => {
    if (leftId === rightId) {
      setMatchedIds((prev) => new Set(prev).add(leftId));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setMistakes((m) => m + 1);
      setWrongFlash({ leftId, rightId });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  };

  useEffect(() => {
    if (
      pairs.length > 0 &&
      matchedIds.size === pairs.length &&
      !finishedRef.current
    ) {
      finishedRef.current = true;
      const score = Math.max(
        100,
        Math.round(1000 - mistakes * 40 - elapsed * 3),
      );
      setTimeout(() => onFinish(score, elapsed), 450);
    }
  }, [matchedIds, pairs.length, mistakes, elapsed, onFinish]);

  const stateOf = (side, id) => {
    if (matchedIds.has(id)) return "matched";
    if (
      wrongFlash &&
      (side === "left" ? wrongFlash.leftId === id : wrongFlash.rightId === id)
    )
      return "wrong";
    if (side === "left" ? selectedLeft === id : selectedRight === id)
      return "selected";
    return "idle";
  };

  const progressPct = pairs.length
    ? Math.round((matchedIds.size / pairs.length) * 100)
    : 0;
  const allDone = pairs.length > 0 && matchedIds.size === pairs.length;

  return (
    <div className="g-play g-play--matchpairs">
      <div className="g-play-stats">
        <span>
          <Timer size={14} /> {elapsed}s
        </span>
        <span>
          <XIcon size={14} /> {mistakes} lần sai
        </span>
        <span className={allDone ? "g-stat-done" : ""}>
          {allDone ? <Trophy size={14} /> : <Check size={14} />}{" "}
          {matchedIds.size}/{pairs.length}
        </span>
      </div>

      <div className="g-progress-bar">
        <div className="g-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="g-mp-play-cols">
        <div className="g-mp-play-col">
          {leftItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`g-mp-play-item ${stateOf("left", item.id)}`}
              onClick={() => pickLeft(item.id)}
            >
              <span>{item.text}</span>
              {stateOf("left", item.id) === "matched" && <Check size={16} />}
              {stateOf("left", item.id) === "wrong" && <XIcon size={16} />}
            </button>
          ))}
        </div>
        <div className="g-mp-play-col">
          {rightItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`g-mp-play-item ${stateOf("right", item.id)}`}
              onClick={() => pickRight(item.id)}
            >
              <span>{item.text}</span>
              {stateOf("right", item.id) === "matched" && <Check size={16} />}
              {stateOf("right", item.id) === "wrong" && <XIcon size={16} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
