import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Compass, X } from "lucide-react";
import "../components/assets/css/RadialQuickNav.css";

/**
 * RadialQuickNav
 * ─────────────────────────────────────────────────────────────────────────
 * A reusable "half-moon" quick-navigation widget that docks to the left
 * edge of the viewport.
 *
 *   • Idle          → a faint half-circle "tab" peeking from the screen edge.
 *   • Hover (whole) → brightens / lifts slightly to hint that it's interactive.
 *   • Hover (wedge) → immediately reveals that wedge's own name in a small
 *                     flyout label, even while still collapsed — no need to
 *                     open the menu just to know what's there.
 *   • Tap hub       → blooms into a full pie-menu ("nan quạt") where every
 *                     wedge shows its icon + name, laid out along that
 *                     wedge's own radial direction (like spokes on a wheel).
 *   • Scroll wheel  → while the menu is open, spins the whole dial so any
 *                     wedge can be rotated into a comfortable reading angle.
 *                     Purely visual — clicking still selects by wedge, not
 *                     by current on-screen angle.
 *
 * Usage:
 *   <RadialQuickNav
 *     sections={[
 *       { id: "section-hero", label: "Tổng Quan", icon: Sparkles },
 *       { id: "section-stats", label: "Số Liệu", icon: BarChart3 },
 *     ]}
 *   />
 *
 * Props:
 *   sections      Array<{ id, label, icon? }>  (required)
 *                 `id` must match a DOM element id present on the page.
 *   scrollOffset  Number, px to leave above the target section (default 88,
 *                 matches the site's fixed navbar height + breathing room).
 *   ariaLabel     Accessible name for the widget's nav landmark.
 */
export default function RadialQuickNav({
  sections,
  scrollOffset = 88,
  ariaLabel = "Điều hướng nhanh trong trang",
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedSize, setExpandedSize] = useState(420);
  const [dialRotation, setDialRotation] = useState(0);

  const wrapRef = useRef(null);

  const count = sections.length;
  const step = 180 / count;

  // Pre-compute the geometry for every wedge: the clip-path shape itself,
  // where its icon/label anchor sits once expanded, where its rim indicator
  // dot sits, and where its collapsed hover-flyout label sits. All anchor
  // radii are kept comfortably inside the wedge's own boundary (radius 50)
  // so nothing is ever accidentally cropped by the clip-path.
  const slices = useMemo(() => {
    return sections.map((section, i) => {
      const startAngle = -90 + i * step;
      const endAngle = -90 + (i + 1) * step;
      const midAngle = (startAngle + endAngle) / 2;
      return {
        ...section,
        midAngle, // 0° = due east, -90° = top, 90° = bottom — same angle
        // convention used to rotate this wedge's own label so it reads
        // outward along the wedge's radial direction.
        clipPath: buildWedgeClipPath(startAngle, endAngle),
        content: polarPoint(midAngle, 29), // icon + label anchor, shown when expanded
        dot: polarPoint(midAngle, 41), // small rim indicator, shown when idle/hover
        flyoutY: polarPoint(midAngle, 46).y, // vertical anchor for the hover flyout label
      };
    });
  }, [sections, step]);

  // Keep the expanded diameter comfortable relative to viewport + number
  // of wedges (more sections need a bit more room to stay legible).
  useEffect(() => {
    const compute = () => {
      const base = 340 + Math.max(0, count - 4) * 46;
      const viewportCap = Math.min(
        window.innerHeight * 0.8,
        window.innerWidth * 1.7,
      );
      setExpandedSize(Math.max(300, Math.min(base, viewportCap)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [count]);

  // Scroll-spy: highlight whichever section is currently under the "read
  // line" so the idle tab quietly reflects where the user is on the page.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!els.length) return undefined;

    const onScroll = () => {
      const readLine = window.innerHeight * 0.35;
      let best = 0;
      let bestDist = Infinity;
      els.forEach((el, i) => {
        const top = el.getBoundingClientRect().top;
        const dist = Math.abs(top - readLine);
        if (top <= readLine + window.innerHeight * 0.5 && dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveIndex(best);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const close = useCallback(() => {
    setExpanded(false);
    setHoverIndex(-1);
    // Snap the dial back to its default orientation so the next time the
    // menu opens, it starts from the same familiar layout.
    setDialRotation(0);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Esc closes the bloomed menu.
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, close]);

  // Mouse-wheel dial control — only active while the menu is bloomed open.
  // Attached as a native listener (not React's onWheel) so we can reliably
  // preventDefault and stop the page itself from scrolling while the user
  // is spinning the dial.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !expanded) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      setDialRotation((prev) => prev + e.deltaY * 0.15);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [expanded]);

  const handleSelect = (section) => {
    const el = document.getElementById(section.id);
    if (el) {
      const top =
        el.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    close();
  };

  const handleMouseLeave = () => {
    setHovering(false);
    setHoverIndex(-1);
  };

  const size = expanded ? expandedSize : hovering ? 92 : 72;

  return (
    <>
      {expanded && (
        <div className="rqn-backdrop" onClick={close} aria-hidden="true" />
      )}

      <div
        ref={wrapRef}
        className={[
          "rqn-wrap",
          expanded ? "is-expanded" : "",
          hovering ? "is-hover" : "",
        ]
          .join(" ")
          .trim()}
        style={{ width: size, height: size, marginLeft: -(size / 2) }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label={ariaLabel}
      >
        <div className="rqn-base" />
        <div className="rqn-ring" />

        {/* Everything that should visually spin together when the user
            scrolls: the clickable wedges and their icon/label/dot overlay.
            The hub stays outside this group so it never rotates. */}
        <div
          className="rqn-spinner"
          style={{ transform: `rotate(${dialRotation}deg)` }}
        >
          {/* Clickable wedges — clipped to their pie-slice shape. Kept free
              of any content that must render past radius 50 so nothing
              crops. */}
          {slices.map((s, i) => {
            const isActive = expanded ? hoverIndex === i : activeIndex === i;
            return (
              <button
                key={s.id}
                type="button"
                className={`rqn-slice${isActive ? " is-active" : ""}`}
                style={{ clipPath: s.clipPath }}
                onClick={() => (expanded ? handleSelect(s) : toggle())}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(-1)}
                tabIndex={expanded ? 0 : -1}
                aria-hidden={!expanded}
                aria-label={s.label}
              />
            );
          })}

          {/* Visual overlay — unclipped, so icons/labels/dots always render
              fully regardless of anchor radius. Purely decorative (clicks
              pass through to the wedge buttons underneath). */}
          <div className="rqn-overlay" aria-hidden="true">
            {slices.map((s, i) => {
              const Icon = s.icon;
              const isActive = expanded ? hoverIndex === i : activeIndex === i;
              return (
                <span key={s.id}>
                  <span
                    className={`rqn-slice-dot${isActive ? " is-active" : ""}`}
                    style={{ left: `${s.dot.x}%`, top: `${s.dot.y}%` }}
                  />
                  <span
                    className={`rqn-slice-content${isActive ? " is-active" : ""}`}
                    style={{ left: `${s.content.x}%`, top: `${s.content.y}%` }}
                  >
                    {/* This is the piece that actually rotates to follow
                        the wedge's own radial direction — icon and label
                        move as one rigid unit, so there's nothing to
                        counter-rotate and nothing can overlap. */}
                    <span
                      className="rqn-slice-stack"
                      style={{ "--rqn-spin": `${s.midAngle}deg` }}
                    >
                      {Icon && <Icon size={19} strokeWidth={1.6} />}
                      <span className="rqn-slice-label">{s.label}</span>
                    </span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Per-wedge hover flyout — the section's name pops out to the side
            the instant you hover that wedge, even while still collapsed.
            Lives outside the spinner: the dial only spins while expanded,
            and it's reset to 0 on close, so this stays simple. */}
        {!expanded && (
          <div className="rqn-flyouts" aria-hidden="true">
            {slices.map((s, i) => (
              <span
                key={s.id}
                className={`rqn-flyout${hoverIndex === i ? " is-visible" : ""}`}
                style={{ top: `${s.flyoutY}%` }}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}

        {expanded && (
          <span className="rqn-spin-hint" aria-hidden="true">
            Cuộn để xoay
          </span>
        )}

        <button
          type="button"
          className="rqn-hub"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={
            expanded ? "Đóng menu điều hướng nhanh" : "Mở menu điều hướng nhanh"
          }
        >
          <span className="rqn-hub-icon">
            {expanded ? (
              <X size={17} strokeWidth={1.9} />
            ) : (
              <Compass size={17} strokeWidth={1.6} />
            )}
          </span>
        </button>
      </div>
    </>
  );
}

/* ── geometry helpers ──────────────────────────────────────────────────── */

// Point on a circle (percentage coordinates, container-relative) for a
// given angle in degrees (0° = due right/east, -90° = top, 90° = bottom).
// `radiusPercent` is expressed on the same scale as the box itself, where
// 50 reaches the edge of the circle (since the box is size×size and the
// center sits at 50%,50%). Keep anchors at radius <= 50 for anything that
// lives inside a clipped wedge.
function polarPoint(angleDeg, radiusPercent) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + radiusPercent * Math.cos(rad),
    y: 50 + radiusPercent * Math.sin(rad),
  };
}

// Builds a CSS clip-path polygon approximating a pie wedge (an arc-bounded
// slice) between two angles, using a small fan of straight segments so the
// outer edge reads as a smooth curve.
function buildWedgeClipPath(startAngle, endAngle, segments = 16) {
  const points = ["50% 50%"];
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + ((endAngle - startAngle) * i) / segments;
    const { x, y } = polarPoint(angle, 50);
    points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
  }
  return `polygon(${points.join(", ")})`;
}
