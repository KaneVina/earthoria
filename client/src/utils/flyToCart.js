export function flyToCart(sourceEl, imageSrc) {
  if (typeof window === "undefined" || !sourceEl) return;

  let cartIcon = document.querySelector(".icon-cart");
  if (!cartIcon || cartIcon.offsetParent === null) {
    cartIcon = document.querySelector(".nav-hamburger");
  }
  if (!cartIcon || cartIcon.offsetParent === null) return;

  const src =
    imageSrc || sourceEl.currentSrc || sourceEl.src || sourceEl.querySelector?.("img")?.src;
  if (!src) return;

  const startRect = sourceEl.getBoundingClientRect();
  // Phần tử chưa render / đang ẩn (width|height = 0) thì bỏ qua, tránh bay từ góc (0,0)
  if (startRect.width === 0 || startRect.height === 0) return;

  const startW = Math.min(startRect.width, 80);
  const startH = Math.min(startRect.height, 104);
  const rawStartX = startRect.left + startRect.width / 2 - startW / 2;
  const rawStartY = startRect.top + startRect.height / 2 - startH / 2;

  const PADDING = 8;
  const maxX = window.innerWidth - startW - PADDING;
  const maxY = window.innerHeight - startH - PADDING;
  const startX = Math.min(Math.max(rawStartX, PADDING), Math.max(maxX, PADDING));
  const startY = Math.min(Math.max(rawStartY, PADDING), Math.max(maxY, PADDING));
  const endW = 14;
  const endH = 14;

  const ghost = document.createElement("img");
  ghost.src = src;
  ghost.className = "fly-to-cart-ghost";
  ghost.style.width = `${startW}px`;
  ghost.style.height = `${startH}px`;
  ghost.style.left = `${startX}px`;
  ghost.style.top = `${startY}px`;
  ghost.style.opacity = "1";
  document.body.appendChild(ghost);

  const DURATION = 620; // ms
  const ARC_HEIGHT = 70; // độ "vồng" lên của quỹ đạo bay, tạo cảm giác tự nhiên hơn đường thẳng
  const startTime = performance.now();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const step = (now) => {
    const t = Math.min((now - startTime) / DURATION, 1);
    const eased = easeOutCubic(t);

    // Tính lại vị trí đích MỖI FRAME — luôn đúng dù navbar/layout đổi giữa chừng
    const endRect = cartIcon.getBoundingClientRect();
    const endX = endRect.left + endRect.width / 2 - endW / 2;
    const endY = endRect.top + endRect.height / 2 - endH / 2;

    const curX = startX + (endX - startX) * eased;
    const curY =
      startY + (endY - startY) * eased - Math.sin(t * Math.PI) * ARC_HEIGHT;
    const curW = startW + (endW - startW) * eased;
    const curH = startH + (endH - startH) * eased;

    ghost.style.left = `${curX}px`;
    ghost.style.top = `${curY}px`;
    ghost.style.width = `${curW}px`;
    ghost.style.height = `${curH}px`;
    ghost.style.opacity = String(1 - eased * 0.55);
    ghost.style.transform = `rotate(${eased * 18}deg)`;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      ghost.remove();
      cartIcon.classList.add("cart-icon-bump");
      setTimeout(() => cartIcon.classList.remove("cart-icon-bump"), 420);
    }
  };

  requestAnimationFrame(step);
}