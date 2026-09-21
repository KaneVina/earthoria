import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  ChevronUp,
  ChevronDown,
  ListChecks,
} from "lucide-react";
import { maintenanceService } from "../../../services/maintenanceService";

export default function MaintenanceTasksPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-maintenance-tasks"],
    queryFn: () => maintenanceService.getTasks().then((r) => r.data.data),
  });

  const tasks = data?.tasks ?? [];
  const progress = data?.progress ?? 0;
  const done = data?.done ?? 0;
  const total = data?.total ?? 0;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-maintenance-tasks"] });

  const createMutation = useMutation({
    mutationFn: () => maintenanceService.createTask(form),
    onSuccess: () => {
      toast.success("Đã thêm hạng mục");
      closeForm();
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thêm hạng mục thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: () => maintenanceService.updateTask(editingTask.id, form),
    onSuccess: () => {
      toast.success("Đã cập nhật hạng mục");
      closeForm();
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Cập nhật thất bại"),
  });

  // Xác nhận (hoặc bỏ xác nhận) hoàn thành - đây là hành động khiến %
  // tiến độ ở trang bảo trì công khai tự động đổi theo, không cần sửa tay.
  const confirmMutation = useMutation({
    mutationFn: (id) => maintenanceService.confirmTask(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, direction }) =>
      maintenanceService.moveTask(id, direction),
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err.response?.data?.message || "Không đổi được thứ tự"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => maintenanceService.deleteTask(id),
    onSuccess: () => {
      toast.success("Đã xóa hạng mục");
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa thất bại"),
  });

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: "", description: "" });
    setShowForm(true);
  };
  const openEdit = (t) => {
    setEditingTask(t);
    setForm({ title: t.title, description: t.description });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setForm({ title: "", description: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và mô tả");
      return;
    }
    editingTask ? updateMutation.mutate() : createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="a-chart-card" style={{ marginBottom: 20 }}>
      <div
        className="a-chart-card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 className="a-chart-title">
            Hạng Mục <em>Nâng Cấp</em>
          </h3>
          <p className="a-chart-sub">
            Mỗi hạng mục có tiêu đề và mô tả, hiển thị trên trang bảo trì công
            khai. Khi bạn xác nhận hoàn thành một hạng mục, thanh % tiến độ sẽ
            tự động tính lại theo tỷ lệ hạng mục đã xong - không cần chỉnh số
            thủ công.
          </p>
        </div>
        <button
          type="button"
          className="a-btn-primary"
          onClick={openCreate}
          style={{ flexShrink: 0 }}
        >
          <Plus size={14} /> Thêm hạng mục
        </button>
      </div>

      <div style={{ margin: "4px 0 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            marginBottom: 6,
            color: "rgba(13,51,48,0.6)",
          }}
        >
          <span>
            Tiến độ tự động &middot; {done}/{total} hạng mục đã xác nhận
          </span>
          <strong style={{ color: "#0d3330" }}>{progress}%</strong>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(13,51,48,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, #4a9e3f, #5cb84f)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="a-td-muted" style={{ padding: "20px 0" }}>
          Đang tải danh sách hạng mục...
        </div>
      ) : !tasks.length ? (
        <div
          className="a-td-muted"
          style={{
            padding: "28px 0",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ListChecks size={22} style={{ opacity: 0.35 }} />
          Chưa có hạng mục nào - thêm hạng mục đầu tiên để bắt đầu.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "12px 14px",
                borderRadius: 10,
                border: "0.5px solid rgba(13,51,48,0.1)",
                background: t.isDone ? "rgba(74,158,63,0.06)" : "transparent",
              }}
            >
              <button
                type="button"
                title={
                  t.isDone ? "Bỏ xác nhận hoàn thành" : "Xác nhận hoàn thành"
                }
                onClick={() => confirmMutation.mutate(t.id)}
                disabled={confirmMutation.isPending}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: t.isDone ? "#4a9e3f" : "rgba(13,51,48,0.3)",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {t.isDone ? <CheckCircle2 size={19} /> : <Circle size={19} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0d3330",
                    textDecoration: t.isDone ? "line-through" : "none",
                    opacity: t.isDone ? 0.65 : 1,
                  }}
                >
                  {t.title}
                </div>
                <div
                  className="a-td-muted"
                  style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}
                >
                  {t.description}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  className="a-btn-icon toggle-off"
                  title="Lên trên"
                  disabled={i === 0 || moveMutation.isPending}
                  onClick={() =>
                    moveMutation.mutate({ id: t.id, direction: "up" })
                  }
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  className="a-btn-icon toggle-off"
                  title="Xuống dưới"
                  disabled={i === tasks.length - 1 || moveMutation.isPending}
                  onClick={() =>
                    moveMutation.mutate({ id: t.id, direction: "down" })
                  }
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  className="a-btn-icon edit"
                  title="Sửa"
                  onClick={() => openEdit(t)}
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="a-btn-icon delete"
                  title="Xóa"
                  onClick={() => {
                    if (window.confirm("Xóa hạng mục này?"))
                      deleteMutation.mutate(t.id);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="a-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="a-modal">
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {editingTask ? "Sửa hạng mục" : "Thêm hạng mục nâng cấp"}
              </h3>
              <button
                className="a-modal-close"
                onClick={closeForm}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tiêu đề *</label>
                    <input
                      className="a-input"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      required
                      placeholder="VD: Tích hợp thanh toán VNPay và Momo"
                    />
                  </div>
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Mô tả *</label>
                    <textarea
                      className="a-textarea"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      required
                      placeholder="Mô tả ngắn gọn nội dung hạng mục này..."
                      style={{ resize: "vertical", minHeight: 80 }}
                    />
                  </div>
                </div>
              </div>
              <div className="a-modal-footer">
                <button
                  type="submit"
                  className="a-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Đang lưu..."
                    : editingTask
                      ? "Lưu thay đổi"
                      : "Thêm hạng mục"}
                </button>
                <button
                  type="button"
                  className="a-btn-ghost"
                  onClick={closeForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
