import { useEffect, useRef, useState } from "react";

export default function PinDigitInputs({
  digits,
  refsArray,
  hasError,
  hasSuccess,
  shake,
  disabled,
  onChange,
  onComplete,
}) {
  const count = digits.length;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [revealIndex, setRevealIndex] = useState(-1);
  const revealTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(revealTimerRef.current), []);

  const revealBriefly = (idx, ms = 450) => {
    setRevealIndex(idx);
    clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(
      () => setRevealIndex((cur) => (cur === idx ? -1 : cur)),
      ms,
    );
  };

  const setDigit = (idx, raw) => {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    onChange(next);
    if (!digit) return; // vừa xoá bằng cách gõ đè - không cần hiệu ứng gì thêm

    revealBriefly(idx);
    if (idx < count - 1) {
      refsArray.current[idx + 1]?.focus();
    } else {
      refsArray.current[idx]?.blur();
      if (next.every((d) => d)) onComplete?.(next.join(""));
    }
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refsArray.current[idx - 1]?.focus();
    }
  };

  // Cho phép dán nguyên chuỗi mã (vd copy từ email/SMS) vào bất kỳ ô nào.
  const onPaste = (idx, e) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    let lastIdx = idx;
    for (let i = 0; i < text.length && idx + i < count; i++) {
      next[idx + i] = text[i];
      lastIdx = idx + i;
    }
    onChange(next);
    revealBriefly(lastIdx);
    if (next.every((d) => d)) {
      refsArray.current[lastIdx]?.blur();
      onComplete?.(next.join(""));
    } else {
      refsArray.current[Math.min(lastIdx + 1, count - 1)]?.focus();
    }
  };

  return (
    <div className={`otp-inputs ${shake ? "fg-pin-shake" : ""}`}>
      {digits.map((d, i) => {
        const showRealDigit = d && (i === revealIndex || i === focusedIndex);
        return (
          <input
            key={i}
            ref={(el) => (refsArray.current[i] = el)}
            className={`otp-input ${d ? "filled" : ""} ${hasError ? "error" : ""} ${hasSuccess ? "success" : ""}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            autoFocus={i === 0}
            value={showRealDigit ? d : d ? "*" : ""}
            disabled={disabled}
            aria-label={`Chữ số thứ ${i + 1} trên ${count}`}
            onFocus={(e) => {
              setFocusedIndex(i);
              e.target.select(); // bôi đen số cũ để gõ số mới là ghi đè luôn
            }}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? -1 : cur))}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
          />
        );
      })}
    </div>
  );
}