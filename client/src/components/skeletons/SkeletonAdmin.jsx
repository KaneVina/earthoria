const DEFAULT_WIDTH_CYCLE = [90, 75, 60, 85, 70];

export function AdminSkeletonRows({ columns, rows = 6 }) {
  const widths = Array.isArray(columns)
    ? columns
    : Array.from(
        { length: columns },
        (_, i) => DEFAULT_WIDTH_CYCLE[i % DEFAULT_WIDTH_CYCLE.length],
      );
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {widths.map((w, c) => (
            <td key={c}>
              <span
                className="a-skeleton"
                style={{ display: "inline-block", height: 12, width: w }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminSkeletonTableMessage({ colSpan, lines = 3 }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "20px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: lines }).map((_, i) => (
            <span
              key={i}
              className="a-skeleton"
              style={{
                display: "inline-block",
                height: 11,
                width: `${DEFAULT_WIDTH_CYCLE[i % DEFAULT_WIDTH_CYCLE.length]}%`,
                maxWidth: 260,
              }}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function AdminSkeletonLines({ lines = 4, style }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="a-skeleton"
          style={{
            display: "inline-block",
            height: 12,
            width: `${DEFAULT_WIDTH_CYCLE[i % DEFAULT_WIDTH_CYCLE.length]}%`,
          }}
        />
      ))}
    </div>
  );
}
