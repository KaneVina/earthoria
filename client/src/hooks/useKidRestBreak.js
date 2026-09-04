import { useEffect, useMemo, useState } from "react";

const EYE_TIPS = [
  "Ngồi thẳng lưng và giữ sách cách mắt khoảng 30cm nhé!",
  "Ánh sáng đủ sáng sẽ giúp mắt bé đỡ mỏi hơn khi đọc đó.",
  "Bé nhớ chớp mắt thường xuyên để mắt không bị khô nhé.",
  "Đọc to thành tiếng giúp bé nhớ câu chuyện lâu hơn đấy!",
  "Uống một ngụm nước sẽ giúp bé tỉnh táo hơn đó!",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function useKidRestBreak(child, active) {
  const [showRest, setShowRest] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [showBreak, setShowBreak] = useState(false);
  const [breakLeft, setBreakLeft] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0);

  // lịch nhắc nghỉ mắt định kỳ
  useEffect(() => {
    if (!active || !child?.ruleEnabled) return;
    const periodMs = Math.max(1, child.ruleIntervalMinutes || 20) * 60000;
    const id = setInterval(() => {
      setShowBreak((isBreak) => {
        if (!isBreak) {
          setRestLeft(Math.max(5, child.ruleRestSeconds || 20));
          setShowRest(true);
        }
        return isBreak;
      });
    }, periodMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    child?.ruleEnabled,
    child?.ruleIntervalMinutes,
    child?.ruleRestSeconds,
  ]);

  // đếm ngược khi overlay nghỉ mắt đang mở
  useEffect(() => {
    if (!showRest) return;
    if (restLeft <= 0) {
      setShowRest(false);
      return;
    }
    const id = setTimeout(() => setRestLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showRest, restLeft]);

  // lịch giải lao bắt buộc
  useEffect(() => {
    if (!active || !child?.mandatoryBreakEnabled) return;
    const periodMs = Math.max(1, child.breakAfterMinutes || 45) * 60000;
    const id = setInterval(() => {
      setShowRest(false);
      setBreakLeft(Math.max(30, (child.breakDurationMinutes || 10) * 60));
      setShowBreak(true);
    }, periodMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    child?.mandatoryBreakEnabled,
    child?.breakAfterMinutes,
    child?.breakDurationMinutes,
  ]);

  // đếm ngược khi đang giải lao bắt buộc
  useEffect(() => {
    if (!showBreak) return;
    if (breakLeft <= 0) {
      setShowBreak(false);
      return;
    }
    const id = setTimeout(() => setBreakLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showBreak, breakLeft]);

  useEffect(() => {
    if (!showRest && !showBreak) return;
    setBreathPhase(0);
    const id = setInterval(() => setBreathPhase((p) => (p + 1) % 2), 2250);
    return () => clearInterval(id);
  }, [showRest, showBreak]);

  const eyeTip = useMemo(
    () => EYE_TIPS[new Date().getDate() % EYE_TIPS.length],
    [],
  );
  const showRestTip =
    !!child?.tipsEnabled &&
    (child?.tipsFrequency === "rest" || child?.tipsFrequency === "interval");

  return {
    showRest,
    showBreak,
    restLeft,
    breakLeft,
    breathPhase,
    eyeTip,
    showRestTip,
    dismissRest: () => setShowRest(false),
  };
}
