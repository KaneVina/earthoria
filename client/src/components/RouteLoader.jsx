export default function RouteLoader() {
  return (
    <div
      style={{
        minHeight: "40vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="status"
      aria-label="Đang tải trang..."
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "3px solid rgba(74,158,63,0.25)",
          borderTopColor: "#4a9e3f",
          display: "inline-block",
          animation: "eo-route-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes eo-route-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
