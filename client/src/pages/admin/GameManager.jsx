import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { Search, Edit2, Plus, Download, Copy, Upload, Gamepad2 } from "lucide-react";
import { gameService } from "../../services/gameService";
import { GAME_TYPE_LIST, getGameDefinition } from "../../games/gameRegistry";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import "../../components/assets/css/gamestudio.css";

const ACCESS_OPTIONS = [
  { value: "CUSTOMER_ONLY", label: "Chỉ khách đã mua" },
  { value: "PUBLIC", label: "Công khai" },
];

function GameTypeBadge({ type }) {
  const def = getGameDefinition(type);
  if (!def) return <span className="a-badge neutral">{type}</span>;
  const Icon = def.icon;
  return (
    <span className="g-type-badge">
      <Icon size={11} />
      {def.shortLabel}
    </span>
  );
}

export default function GameManager() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const BOOKS_PER_PAGE = 8;

  const [qrTarget, setQrTarget] = useState(null); // { game, book }
  const qrWrapRef = useRef(null);

  const preselectId = searchParams.get("bookId");
  useEffect(() => {
    if (preselectId) {
      navigate(`/dashboard/games/new?bookId=${preselectId}`, { replace: true });
    }
  }, [preselectId, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-games-all", search, filterType, filterStatus, page],
    queryFn: () =>
      gameService
        .list({ search, gameType: filterType, status: filterStatus, page, limit: BOOKS_PER_PAGE })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const groups = data?.groups ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  const hasActiveFilters = search || filterType || filterStatus;
  const resetFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setPage(1);
  };

  const accessMutation = useMutation({
    mutationFn: ({ id, accessType }) => gameService.updateAccess(id, accessType),
    onSuccess: () => {
      toast.success("Đã đổi quyền xem");
      qc.invalidateQueries(["admin-games-all"]);
    },
    onError: () => toast.error("Đổi quyền xem thất bại!"),
  });

  const qrUrl = qrTarget ? `${window.location.origin}/game/${qrTarget.book.slug}/${qrTarget.game.code}` : "";

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const safeName = (qrTarget.game.title || "game")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const link = document.createElement("a");
    link.download = `qr-game-${safeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success("Đã sao chép link");
    } catch {
      toast.error("Không sao chép được, vui lòng bôi đen và copy thủ công");
    }
  };

  return (
    <AdminLayout crumbs={[{ label: "Trò chơi" }]}>
      <div className="a-page-header" style={{ marginBottom: 0 }}>
        <div>
          <p className="a-page-eyebrow">Tương tác</p>
          <h1 className="a-page-title">
            Quản lý <em>Trò chơi</em>
          </h1>
        </div>
      </div>

      <div className="a-ar-filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button className="a-btn-primary" style={{ flexShrink: 0 }} onClick={() => navigate("/dashboard/games/new")}>
          <Plus size={13} />
          Tạo trò chơi mới
        </button>
        <div className="a-search-wrap" style={{ marginBottom: 0, flex: "1 1 280px", maxWidth: 380 }}>
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            placeholder="Tìm theo tên sách / tên trò chơi / mã..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="a-input a-select"
          style={{ maxWidth: 210 }}
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Mọi loại trò chơi</option>
          {GAME_TYPE_LIST.map((g) => (
            <option key={g.type} value={g.type}>
              {g.label}
            </option>
          ))}
        </select>

        <select
          className="a-input a-select"
          style={{ maxWidth: 160 }}
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Vô hiệu hoá</option>
        </select>

        {hasActiveFilters && (
          <button type="button" className="a-btn-ghost" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      <div className="a-chart-grid-2 a-ar-layout">
        <div className="a-table-card">
          <div className="a-table-head">
            <h3 className="a-table-title">
              Tất cả <em>trò chơi</em>
            </h3>
          </div>

          <div className="a-ar-scroll-body">
            <table className="a-table">
              <thead>
                <tr>
                  {["Sách", "Trò chơi", "Loại", "Quyền xem", "Lượt chơi", "Trạng thái", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : !groups.length ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                      <Gamepad2 size={22} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div>Chưa có trò chơi nào khớp bộ lọc</div>
                    </td>
                  </tr>
                ) : (
                  groups.map((group) =>
                    group.games.map((g, idx) => (
                      <tr
                        key={g.id}
                        onClick={() => setQrTarget({ game: g, book: group.book })}
                        style={{ cursor: "pointer" }}
                        className={qrTarget?.game.id === g.id ? "a-row-active" : ""}
                      >
                        {idx === 0 && (
                          <td rowSpan={group.games.length} className="a-ar-book-cell">
                            <div className="a-ar-book-cell-inner">
                              <div className="a-book-thumb" style={{ width: 26, height: 34, flexShrink: 0 }}>
                                {group.book.coverImage ? (
                                  <img src={group.book.coverImage} alt={group.book.title} />
                                ) : (
                                  <Upload size={10} />
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {group.book.title}
                                </div>
                                <div className="a-td-muted">{group.games.length} trò chơi</div>
                              </div>
                            </div>
                          </td>
                        )}

                        <td style={{ fontWeight: 500, fontSize: 12 }}>
                          {g.title}
                          <div className="a-td-mono" style={{ fontSize: 10, marginTop: 2 }}>
                            {g.code}
                          </div>
                        </td>

                        <td>
                          <GameTypeBadge type={g.gameType} />
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="a-input a-select"
                            style={{ fontSize: 11, padding: "4px 8px", maxWidth: 170 }}
                            value={g.accessType}
                            onChange={(e) => accessMutation.mutate({ id: g.id, accessType: e.target.value })}
                          >
                            {ACCESS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="a-td-muted">{g.playCount}</td>

                        <td>
                          <span className={`a-badge ${g.isActive ? "success" : "neutral"}`}>
                            {g.isActive ? "Hoạt động" : "Vô hiệu hoá"}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              className="a-btn-icon edit"
                              onClick={() => navigate(`/dashboard/games/${g.id}`)}
                              title="Xem / Sửa"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )),
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="a-pagination">
            <span className="a-pagination-info">Tổng {totalCount} sách có trò chơi</span>
            <div className="a-pagination-btns">
              <button className="a-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`a-page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button
                className="a-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="a-ar-side">
          <div className="a-chart-card">
            <div className="a-chart-card-header">
              <h3 className="a-chart-title" style={{ fontSize: 13 }}>
                Mã <em>QR</em>
              </h3>
              <p className="a-chart-sub">Bấm 1 dòng bên trái để xem QR</p>
            </div>
            {!qrTarget ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(13,51,48,0.3)", fontSize: 12 }}>
                Chưa chọn trò chơi nào
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                  {qrTarget.book.title} — {qrTarget.game.title}
                </div>
                <div ref={qrWrapRef} style={{ display: "flex", justifyContent: "center", padding: "4px 0 16px" }}>
                  <QRCodeCanvas value={qrUrl} size={160} level="M" includeMargin bgColor="#ffffff" fgColor="#0D3330" />
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    wordBreak: "break-all",
                    textAlign: "left",
                    background: "#f5f3ee",
                    padding: "8px 10px",
                    borderRadius: 6,
                    marginBottom: 14,
                    color: "#0D3330",
                  }}
                >
                  {qrUrl}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="a-btn-primary" onClick={handleDownloadQr}>
                    <Download size={12} /> Tải PNG
                  </button>
                  <button className="a-btn-ghost" onClick={handleCopyLink}>
                    <Copy size={12} /> Sao chép link
                  </button>
                  <button className="a-btn-ghost" onClick={() => navigate(`/dashboard/games/${qrTarget.game.id}`)}>
                    <Edit2 size={12} /> Xem / Sửa chi tiết
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}