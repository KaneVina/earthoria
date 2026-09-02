import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Search,
  Ban,
  CheckCircle2,
  X,
  Download,
  Copy,
  Upload,
  User,
  Users,
  Building2,
  Shield,
  Award,
  Trash2,
  Trophy,
} from "lucide-react";
import api from "../../services/api";
import { gameService } from "../../services/gameService";
import {
  GAME_TYPE_LIST,
  getGameDefinition,
  validateGameConfig,
} from "../../games/gameRegistry";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import "../../components/assets/css/gamestudio.css";

const ACCESS_OPTIONS = [
  { value: "CUSTOMER_ONLY", label: "Khách đã mua" },
  { value: "PUBLIC", label: "Công khai" },
];

const ROLE_MATRIX = [
  { key: "GUEST", label: "Guest", icon: User },
  { key: "CUSTOMER", label: "Customer", icon: Users },
  { key: "DEALER", label: "Dealer", icon: Building2 },
  { key: "STAFF", label: "Staff", icon: Shield },
  { key: "ADMIN", label: "Admin", icon: Award },
];

function getLitRoles(accessType) {
  if (accessType === "PUBLIC")
    return ["GUEST", "CUSTOMER", "DEALER", "STAFF", "ADMIN"];
  return ["CUSTOMER", "STAFF", "ADMIN"];
}

function GameTypePicker({ value, onSelect }) {
  return (
    <div className="g-type-grid">
      {GAME_TYPE_LIST.map((def) => {
        const Icon = def.icon;
        const active = value === def.type;
        return (
          <button
            type="button"
            key={def.type}
            className={`g-type-card${active ? " active" : ""}`}
            onClick={() => onSelect(def.type)}
          >
            <span className="g-type-card-icon">
              <Icon size={18} />
            </span>
            <span className="g-type-card-label">{def.label}</span>
            <span className="g-type-card-desc">{def.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function GameDetail() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [searchParams] = useSearchParams();
  const preselectBookId = searchParams.get("bookId");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const qrWrapRef = useRef(null);

  const [bookQuery, setBookQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [gameType, setGameType] = useState(null);
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    accessType: "CUSTOMER_ONLY",
    config: null,
  });

  const { data: game, isLoading: loadingGame } = useQuery({
    queryKey: ["admin-game-detail", id],
    queryFn: () => gameService.getById(id).then((r) => r.data.data),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (game) {
      setForm({
        title: game.title,
        instructions: game.instructions || "",
        accessType: game.accessType,
        config: game.config,
      });
      setGameType(game.gameType);
      setSelectedBook(game.book);
    }
  }, [game]);

  const { data: preselectBook } = useQuery({
    queryKey: ["admin-product-preselect", preselectBookId],
    queryFn: () =>
      api.get(`/admin/products/${preselectBookId}`).then((r) => r.data.data),
    enabled: !isEditMode && !!preselectBookId && !selectedBook,
  });
  useEffect(() => {
    if (preselectBook) setSelectedBook(preselectBook);
  }, [preselectBook]);

  const { data: bookSuggestions = [] } = useQuery({
    queryKey: ["admin-products-quick-search", bookQuery],
    queryFn: () =>
      api
        .get("/admin/products/search", { params: { q: bookQuery } })
        .then((r) => r.data.data),
    enabled: !isEditMode && bookQuery.trim().length >= 1,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["admin-game-leaderboard", id],
    queryFn: () => gameService.getLeaderboardAdmin(id).then((r) => r.data.data),
    enabled: isEditMode && !!game,
  });

  const selectGameType = (type) => {
    setGameType(type);
    const def = getGameDefinition(type);
    setForm((f) => ({ ...f, config: def.defaultConfig() }));
  };

  const createMutation = useMutation({
    mutationFn: () =>
      gameService.create(selectedBook.id, {
        title: form.title,
        instructions: form.instructions,
        accessType: form.accessType,
        gameType,
        config: form.config,
      }),
    onSuccess: (res) => {
      toast.success("Đã tạo trò chơi mới!");
      qc.invalidateQueries(["admin-games-all"]);
      const newId = res.data?.data?.id;
      if (newId) navigate(`/dashboard/games/${newId}`, { replace: true });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Tạo trò chơi thất bại!"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      gameService.update(id, {
        title: form.title,
        instructions: form.instructions,
        accessType: form.accessType,
        config: form.config,
      }),
    onSuccess: () => {
      toast.success("Đã lưu thay đổi!");
      qc.invalidateQueries(["admin-games-all"]);
      qc.invalidateQueries(["admin-game-detail", id]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Cập nhật thất bại!"),
  });

  const toggleMutation = useMutation({
    mutationFn: () => gameService.toggle(id),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries(["admin-games-all"]);
      qc.invalidateQueries(["admin-game-detail", id]);
    },
    onError: () => toast.error("Thao tác thất bại!"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => gameService.remove(id),
    onSuccess: () => {
      toast.success("Đã xóa trò chơi");
      qc.invalidateQueries(["admin-games-all"]);
      navigate("/dashboard/games");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xóa thất bại!"),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tên trò chơi");
      return;
    }
    if (!gameType) {
      toast.error("Vui lòng chọn loại trò chơi");
      return;
    }
    const configErrors = validateGameConfig(gameType, form.config);
    if (configErrors.length > 0) {
      toast.error(configErrors[0]);
      return;
    }
    if (isEditMode) updateMutation.mutate();
    else createMutation.mutate();
  };

  const pickBook = (book) => {
    setSelectedBook(book);
    setBookQuery("");
    setShowSuggest(false);
  };

  const qrUrl =
    isEditMode && selectedBook && game
      ? `${window.location.origin}/game/${selectedBook.slug}/${game.code}`
      : "";

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const safeName = (game?.title || "game")
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

  if (isEditMode && loadingGame) {
    return (
      <AdminLayout crumbs={[{ label: "Trò chơi" }, { label: "Chi tiết" }]}>
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "rgba(13,51,48,0.3)",
          }}
        >
          Đang tải...
        </div>
      </AdminLayout>
    );
  }

  const def = gameType ? getGameDefinition(gameType) : null;
  const Editor = def?.Editor;

  return (
    <AdminLayout
      crumbs={[
        { label: "Trò chơi" },
        { label: isEditMode ? "Chỉnh sửa" : "Tạo mới" },
      ]}
    >
      <div className="a-page-header" style={{ marginBottom: 20 }}>
        <div>
          <button
            type="button"
            className="a-btn-ghost"
            style={{ marginBottom: 12 }}
            onClick={() => navigate("/dashboard/games")}
          >
            <ArrowLeft size={13} /> Quay lại danh sách
          </button>
          <p className="a-page-eyebrow">Tương tác</p>
          <h1 className="a-page-title">
            {isEditMode ? "Chỉnh sửa " : "Tạo "}
            <em>trò chơi</em>
          </h1>
        </div>
      </div>

      <div className="a-chart-grid-2 a-ar-layout">
        <div className="a-chart-card">
          {!isEditMode && !selectedBook && (
            <div style={{ position: "relative" }}>
              <div className="a-form-label" style={{ marginBottom: 8 }}>
                Bước 1 · Chọn sách
              </div>
              <div
                className="a-search-wrap"
                style={{ marginBottom: 0, maxWidth: "100%" }}
              >
                <Search size={13} className="a-search-icon" />
                <input
                  className="a-input"
                  placeholder="Tìm theo tên sách..."
                  value={bookQuery}
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                />
              </div>
              {showSuggest && bookQuery.trim().length >= 1 && (
                <div
                  style={{
                    position: "relative",
                    zIndex: 10,
                    background: "#fff",
                    border: "1px solid #e8e5de",
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 280,
                    overflowY: "auto",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  {bookSuggestions.length === 0 ? (
                    <div
                      style={{
                        padding: 14,
                        fontSize: 12,
                        color: "rgba(13,51,48,0.4)",
                      }}
                    >
                      Không tìm thấy sách
                    </div>
                  ) : (
                    bookSuggestions.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => pickBook(b)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          cursor: "pointer",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div
                          className="a-book-thumb"
                          style={{ width: 24, height: 32 }}
                        >
                          {b.coverImage ? (
                            <img src={b.coverImage} alt={b.title} />
                          ) : (
                            <Upload size={10} />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.title}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {selectedBook && !isEditMode && !gameType && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                  marginBottom: 18,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--a-ink-05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="a-book-thumb"
                    style={{ width: 34, height: 46 }}
                  >
                    {selectedBook.coverImage ? (
                      <img
                        src={selectedBook.coverImage}
                        alt={selectedBook.title}
                      />
                    ) : (
                      <Upload size={14} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {selectedBook.title}
                  </div>
                </div>
                <button
                  type="button"
                  className="a-btn-ghost"
                  style={{ fontSize: 11, padding: "6px 10px", flexShrink: 0 }}
                  onClick={() => setSelectedBook(null)}
                >
                  Đổi sách
                </button>
              </div>
              <div className="a-form-label" style={{ marginBottom: 10 }}>
                Bước 2 · Chọn loại trò chơi
              </div>
              <GameTypePicker value={gameType} onSelect={selectGameType} />
            </>
          )}

          {selectedBook && (isEditMode || gameType) && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                  marginBottom: 18,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--a-ink-05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="a-book-thumb"
                    style={{ width: 34, height: 46 }}
                  >
                    {selectedBook.coverImage ? (
                      <img
                        src={selectedBook.coverImage}
                        alt={selectedBook.title}
                      />
                    ) : (
                      <Upload size={14} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedBook.title}
                    </div>
                    {def && (
                      <div
                        className="a-td-muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <def.icon size={11} /> {def.label}
                      </div>
                    )}
                    {isEditMode && game && (
                      <span
                        className={`a-badge ${game.isActive ? "success" : "neutral"}`}
                        style={{ marginTop: 4 }}
                      >
                        {game.isActive ? "Hoạt động" : "Vô hiệu hoá"}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditMode && (
                  <button
                    type="button"
                    className="a-btn-ghost"
                    style={{ fontSize: 11, padding: "6px 10px", flexShrink: 0 }}
                    onClick={() => setGameType(null)}
                  >
                    Đổi loại
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="a-form-group" style={{ marginBottom: 12 }}>
                  <label className="a-form-label">Tên trò chơi</label>
                  <input
                    className="a-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="vd: Ghép đôi các loài động vật"
                    required
                  />
                </div>

                <div className="a-form-group" style={{ marginBottom: 12 }}>
                  <label className="a-form-label">
                    Hướng dẫn chơi (tuỳ chọn)
                  </label>
                  <input
                    className="a-input"
                    value={form.instructions}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, instructions: e.target.value }))
                    }
                    placeholder="vd: Lật 2 thẻ để tìm cặp giống nhau"
                  />
                </div>

                <div className="a-form-group" style={{ marginBottom: 16 }}>
                  <label className="a-form-label">Nội dung trò chơi</label>
                  {Editor && form.config !== null && (
                    <Editor
                      config={form.config}
                      onChange={(config) => setForm((f) => ({ ...f, config }))}
                      gameId={id}
                    />
                  )}
                </div>

                <div className="a-form-group" style={{ marginBottom: 16 }}>
                  <label className="a-form-label">Quyền xem</label>
                  <div className="a-access-row">
                    <div className="a-access-toggle">
                      {ACCESS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`a-access-toggle-btn${form.accessType === opt.value ? " active" : ""}`}
                          onClick={() =>
                            setForm((f) => ({ ...f, accessType: opt.value }))
                          }
                        >
                          <span className="a-access-toggle-dot" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="a-role-matrix">
                      {ROLE_MATRIX.map((role) => {
                        const litRoles = getLitRoles(form.accessType);
                        const isLit = litRoles.includes(role.key);
                        const Icon = role.icon;
                        return (
                          <div
                            key={role.key}
                            className={`a-role-chip ${isLit ? "lit" : "dim"}`}
                          >
                            <div className="a-role-chip-icon">
                              <Icon size={13} />
                            </div>
                            <div className="a-role-chip-label">
                              {role.label}
                            </div>
                          </div>
                        );
                      })}
                      <div className="a-role-matrix-hint">
                        Staff và Admin luôn xem được bất kể lựa chọn ở đây
                      </div>
                    </div>
                  </div>
                </div>

                {isEditMode && game && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(13,51,48,0.5)",
                      marginBottom: 16,
                    }}
                  >
                    {game.playCount} lượt chơi hoàn thành
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="a-btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Đang lưu..."
                      : isEditMode
                        ? "Lưu thay đổi"
                        : "Tạo trò chơi"}
                  </button>

                  {isEditMode && game && (
                    <button
                      type="button"
                      className="a-btn-ghost"
                      onClick={() => toggleMutation.mutate()}
                      disabled={toggleMutation.isPending}
                    >
                      {game.isActive ? (
                        <>
                          <Ban size={12} /> Vô hiệu hoá
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> Kích hoạt lại
                        </>
                      )}
                    </button>
                  )}

                  {isEditMode && game && (
                    <button
                      type="button"
                      className="a-btn-ghost"
                      style={{ color: "#e34948" }}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Xóa vĩnh viễn trò chơi này? Không thể hoàn tác.",
                          )
                        ) {
                          deleteMutation.mutate();
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={12} /> Xóa vĩnh viễn
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        <div className="a-ar-side">
          <div className="a-chart-card">
            <div className="a-chart-card-header">
              <h3 className="a-chart-title" style={{ fontSize: 13 }}>
                Mã <em>QR</em>
              </h3>
            </div>
            {!isEditMode || !game ? (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "rgba(13,51,48,0.3)",
                  fontSize: 12,
                }}
              >
                QR sẽ hiện ra sau khi tạo trò chơi
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div
                  ref={qrWrapRef}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "4px 0 16px",
                  }}
                >
                  <QRCodeCanvas
                    value={qrUrl}
                    size={160}
                    level="M"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#0D3330"
                  />
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
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button className="a-btn-primary" onClick={handleDownloadQr}>
                    <Download size={12} /> Tải PNG
                  </button>
                  <button className="a-btn-ghost" onClick={handleCopyLink}>
                    <Copy size={12} /> Sao chép link
                  </button>
                </div>
              </div>
            )}
          </div>

          {isEditMode && game && (
            <div className="a-chart-card" style={{ marginTop: 16 }}>
              <div className="a-chart-card-header">
                <h3 className="a-chart-title" style={{ fontSize: 13 }}>
                  Bảng <em>xếp hạng</em>
                </h3>
                <p className="a-chart-sub">Top điểm cao nhất</p>
              </div>
              {leaderboard.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    textAlign: "center",
                    color: "rgba(13,51,48,0.3)",
                    fontSize: 12,
                  }}
                >
                  Chưa có ai chơi xong
                </div>
              ) : (
                <div className="g-leaderboard">
                  {leaderboard.slice(0, 5).map((r, i) => (
                    <div className="g-leaderboard-row" key={r.id}>
                      <span className="g-leaderboard-rank">
                        {i === 0 ? <Trophy size={12} color="#e0a72a" /> : i + 1}
                      </span>
                      <span className="g-leaderboard-name">
                        {r.child?.name || r.user?.name || "Ẩn danh"}
                      </span>
                      <span className="g-leaderboard-score">{r.score}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
