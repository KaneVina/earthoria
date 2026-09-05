import React, { useEffect, useRef, useState } from "react";
import { Check, X as XIcon, Timer, Trophy, ArrowRight } from "lucide-react";

export default function QuizChoicePlayer({ config, onFinish }) {
  const questions = config?.questions || [];
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = questions[step];
  const isLast = step === questions.length - 1;

  const pick = (optId) => {
    if (selected) return;
    setSelected(optId);
    if (optId === current.correctOptionId) setCorrectCount((c) => c + 1);
  };

  const goNext = () => {
    if (isLast) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const total = questions.length || 1;
      const score = Math.round((correctCount / total) * 1000);
      onFinish(score, elapsed);
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
  };

  if (!current) return null;

  const progressPct = Math.round(
    ((step + (selected ? 1 : 0)) / questions.length) * 100,
  );

  return (
    <div className="g-play g-play--quiz">
      <div className="g-play-stats">
        <span>
          <Timer size={14} /> {elapsed}s
        </span>
        <span>
          Câu {step + 1}/{questions.length}
        </span>
        <span>
          <Check size={14} /> {correctCount} đúng
        </span>
      </div>

      <div className="g-progress-bar">
        <div className="g-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="g-quiz-question">{current.text}</div>

      <div className="g-quiz-options">
        {current.options.map((o) => {
          let state = "idle";
          if (selected) {
            if (o.id === current.correctOptionId) state = "correct";
            else if (o.id === selected) state = "wrong";
          }
          return (
            <button
              key={o.id}
              type="button"
              className={`g-quiz-option ${state}`}
              onClick={() => pick(o.id)}
              disabled={!!selected}
            >
              <span>{o.text}</span>
              {state === "correct" && <Check size={16} />}
              {state === "wrong" && <XIcon size={16} />}
            </button>
          );
        })}
      </div>

      {selected && (
        <button type="button" className="g-quiz-next" onClick={goNext}>
          {isLast ? (
            <>
              <Trophy size={16} /> Xem kết quả
            </>
          ) : (
            <>
              Câu tiếp theo <ArrowRight size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
