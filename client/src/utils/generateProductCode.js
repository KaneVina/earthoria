const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateProductCode() {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const letters = Array.from(
    { length: 3 },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)],
  ).join("");
  return `EB-${digits}${letters}`;
}
