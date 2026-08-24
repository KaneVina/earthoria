import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";

let flightIdCounter = 0;
export function flyHeartToWishlist(fromEl) {
  if (!fromEl || typeof window === "undefined") return;
  const rect = fromEl.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent("wishlist:fly", {
      detail: {
        id: ++flightIdCounter,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    }),
  );
}

export default function FlyingWishlistHeart() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const target = document.getElementById("wishlist-nav-icon");
      if (!target) return; // không có icon Wishlist trên navbar ở trang này
      const targetRect = target.getBoundingClientRect();
      const flight = {
        id: e.detail.id,
        x: e.detail.x,
        y: e.detail.y,
        tx: targetRect.left + targetRect.width / 2 - e.detail.x,
        ty: targetRect.top + targetRect.height / 2 - e.detail.y,
      };
      setFlights((prev) => [...prev, flight]);
      setTimeout(() => {
        setFlights((prev) => prev.filter((f) => f.id !== flight.id));
      }, 650);
    };
    window.addEventListener("wishlist:fly", handler);
    return () => window.removeEventListener("wishlist:fly", handler);
  }, []);

  if (!flights.length) return null;

  return createPortal(
    <>
      {flights.map((f) => (
        <span
          key={f.id}
          className="wl-flying-heart"
          style={{
            "--wl-fly-x": `${f.x}px`,
            "--wl-fly-y": `${f.y}px`,
            "--wl-fly-tx": `${f.tx}px`,
            "--wl-fly-ty": `${f.ty}px`,
          }}
        >
          <Heart size={16} strokeWidth={1.5} fill="var(--gold)" color="var(--gold)" />
        </span>
      ))}
    </>,
    document.body,
  );
}