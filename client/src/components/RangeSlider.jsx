import { useCallback, useEffect, useRef, useState } from "react";

export default function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  onChangeCommitted,
  formatLabel = (v) => v,
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'lo' | 'hi' | null
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (!dragging) setLocal(value);
  }, [value, dragging]);

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const snap = (v) => Math.round(clamp(v) / step) * step;
  const pct = (v) => ((v - min) / (max - min)) * 100;

  const valueFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return snap(min + ratio * (max - min));
    },
    [min, max, step],
  );

  const startDrag = (thumb) => (e) => {
    e.preventDefault();
    setDragging(thumb);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const next = valueFromClientX(clientX);
      setLocal((prev) => {
        let [lo, hi] = prev;
        if (dragging === "lo") lo = Math.min(next, hi);
        else hi = Math.max(next, lo);
        const updated = [lo, hi];
        onChange?.(updated);
        return updated;
      });
    };

    const handleUp = () => {
      setDragging(null);
      setLocal((prev) => {
        onChangeCommitted?.(prev);
        return prev;
      });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging, valueFromClientX, onChange, onChangeCommitted]);

  const handleTrackClick = (e) => {
    if (e.target.closest(".rs-thumb")) return;
    const next = valueFromClientX(e.clientX);
    const [lo, hi] = local;
    const useLo = Math.abs(next - lo) <= Math.abs(next - hi);
    const updated = useLo ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
    setLocal(updated);
    onChange?.(updated);
    onChangeCommitted?.(updated);
  };

  const handleKey = (thumb) => (e) => {
    const [lo, hi] = local;
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    else return;
    e.preventDefault();
    const updated =
      thumb === "lo"
        ? [clamp(Math.min(lo + delta, hi)), hi]
        : [lo, clamp(Math.max(hi + delta, lo))];
    setLocal(updated);
    onChange?.(updated);
    onChangeCommitted?.(updated);
  };

  const [lo, hi] = local;

  return (
    <div className="rs-wrap">
      <div className="rs-track" ref={trackRef} onMouseDown={handleTrackClick}>
        <div
          className="rs-fill"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={lo}
          className={`rs-thumb${dragging === "lo" ? " dragging" : ""}`}
          style={{ left: `${pct(lo)}%` }}
          onMouseDown={startDrag("lo")}
          onTouchStart={startDrag("lo")}
          onKeyDown={handleKey("lo")}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={hi}
          className={`rs-thumb${dragging === "hi" ? " dragging" : ""}`}
          style={{ left: `${pct(hi)}%` }}
          onMouseDown={startDrag("hi")}
          onTouchStart={startDrag("hi")}
          onKeyDown={handleKey("hi")}
        />
      </div>
      <div className="rs-labels">
        <span className="rs-value">{formatLabel(lo)}</span>
        <span className="rs-value">{formatLabel(hi)}</span>
      </div>
    </div>
  );
}
