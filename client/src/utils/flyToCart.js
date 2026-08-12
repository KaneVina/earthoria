export function flyToCart(sourceEl, imageSrc) {
  if (typeof window === "undefined" || !sourceEl) return;

  const cartIcon = document.querySelector(".icon-cart");
  if (!cartIcon) return;

  const src =
    imageSrc || sourceEl.currentSrc || sourceEl.src || sourceEl.querySelector?.("img")?.src;
  if (!src) return;

  const startRect = sourceEl.getBoundingClientRect();
  const endRect = cartIcon.getBoundingClientRect();

  // Kích thước bay ban đầu: giới hạn lại cho gọn dù ảnh gốc to
  const startW = Math.min(startRect.width, 90);
  const startH = Math.min(startRect.height, 120);
  const startX = startRect.left + startRect.width / 2 - startW / 2;
  const startY = startRect.top + startRect.height / 2 - startH / 2;

  const ghost = document.createElement("img");
  ghost.src = src;
  ghost.className = "fly-to-cart-ghost";
  ghost.style.width = `${startW}px`;
  ghost.style.height = `${startH}px`;
  ghost.style.left = `${startX}px`;
  ghost.style.top = `${startY}px`;
  document.body.appendChild(ghost);

  const endX = endRect.left + endRect.width / 2 - 8;
  const endY = endRect.top + endRect.height / 2 - 8;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.12) rotate(18deg)`;
      ghost.style.opacity = "0.15";
    });
  });

  const cleanup = () => {
    ghost.remove();
    cartIcon.classList.add("cart-icon-bump");
    setTimeout(() => cartIcon.classList.remove("cart-icon-bump"), 420);
  };

  ghost.addEventListener("transitionend", cleanup, { once: true });
  // Phòng trường hợp transitionend không bắn (ví dụ tab bị ẩn giữa chừng)
  setTimeout(cleanup, 750);
}