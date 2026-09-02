import { useMemo } from "react";

function computeGeometry(level) {
  const trunkHeight = 22 + level * 6.2;
  const trunkWidth = 7 + level * 0.9;
  const groundY = 128;
  const trunkTopY = groundY - trunkHeight;
  const baseRadius = 13 + level * 1.9;
  const clusterCount = Math.min(2 + Math.floor(level / 2), 7);
  const canopyCenterY = trunkTopY - baseRadius * 0.42;

  const canopyCircles = [{ cx: 60, cy: canopyCenterY, r: baseRadius }];
  for (let i = 0; i < clusterCount - 1; i++) {
    const angle = (Math.PI * 2 * i) / (clusterCount - 1) - Math.PI / 2;
    const dist = baseRadius * 0.74;
    canopyCircles.push({
      cx: 60 + Math.cos(angle) * dist,
      cy: canopyCenterY + Math.sin(angle) * dist * 0.85,
      r: baseRadius * 0.66,
    });
  }

  const decorCount = level >= 6 ? Math.min(3 + (level - 6), 6) : 0;
  const decorations = [];
  for (let i = 0; i < decorCount; i++) {
    const c = canopyCircles[i % canopyCircles.length];
    const angle = (i * 137.5 * Math.PI) / 180;
    decorations.push({
      cx: c.cx + Math.cos(angle) * c.r * 0.72,
      cy: c.cy + Math.sin(angle) * c.r * 0.72,
    });
  }

  return {
    trunkHeight,
    trunkWidth,
    groundY,
    trunkTopY,
    canopyCircles,
    decorations,
  };
}

const HEALTH_VISUAL = {
  healthy: { saturate: 1, opacity: 1 },
  growing: { saturate: 0.92, opacity: 0.97 },
  wilting: { saturate: 0.55, opacity: 0.92 },
  needs_care: { saturate: 0.32, opacity: 0.86 },
  critical: { saturate: 0.16, opacity: 0.78 },
  dead: { saturate: 0, opacity: 0.5 },
};

export default function GardenTreeVisual({
  level = 1,
  health = 100,
  healthBandKey = "healthy",
  status = "ALIVE",
  size = 96,
  animated = false,
  className = "",
}) {
  const geometry = useMemo(() => computeGeometry(level), [level]);
  const isDead = status === "DEAD" || healthBandKey === "dead";
  const visual = isDead
    ? HEALTH_VISUAL.dead
    : HEALTH_VISUAL[healthBandKey] || HEALTH_VISUAL.healthy;
  const isMature = status === "MATURE";
  const showFoliage = !isDead;
  const showDecor = !isDead && geometry.canopyCircles.length && health >= 40;

  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={`kg-tree-svg${animated ? " kg-tree-animated" : ""}${isDead ? " kg-tree-dead" : ""}`}
      role="img"
      aria-label={isDead ? "Cây đang khô héo" : `Cây ở cấp ${level}`}
    >
      {isMature && (
        <circle
          cx="60"
          cy={geometry.trunkTopY - 8}
          r={geometry.canopyCircles[0].r + 14}
          className="kg-tree-glow"
        />
      )}

      {isDead && (
        <g className="kg-tree-branches">
          <path
            d={`M60 ${geometry.trunkTopY} l-14 -14 M60 ${geometry.trunkTopY} l14 -12 M60 ${geometry.trunkTopY + 6} l-10 -18`}
          />
        </g>
      )}

      <rect
        x={60 - geometry.trunkWidth / 2}
        y={geometry.trunkTopY}
        width={geometry.trunkWidth}
        height={geometry.groundY - geometry.trunkTopY}
        rx={geometry.trunkWidth / 3}
        className="kg-tree-trunk"
      />

      {showFoliage && (
        <g
          style={{
            filter: `saturate(${visual.saturate})`,
            opacity: visual.opacity,
          }}
          className="kg-tree-canopy"
        >
          {geometry.canopyCircles.map((c, i) => (
            <circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              className="kg-tree-leaf"
            />
          ))}
        </g>
      )}

      {showDecor &&
        geometry.decorations.map((d, i) =>
          level >= 7 && i % 2 === 0 ? (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r="3.2"
              className="kg-tree-fruit"
            />
          ) : (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r="3"
              className="kg-tree-flower"
            />
          ),
        )}
    </svg>
  );
}
