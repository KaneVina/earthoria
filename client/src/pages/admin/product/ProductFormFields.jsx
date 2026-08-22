import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import ProductVariantsEditor from "./ProductVariantsEditor";

// productId chỉ có khi đang SỬA sách đã tồn tại (ProductDetail) — sách mới
// tạo (ProductCreate) chưa có ebook nên nút "AI soạn nháp" sẽ không hiện.
export default function ProductFormFields({ form, setForm, categories = [], onDeleteVariant, productId }) {
  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setVariants = (updater) =>
    setForm((prev) => ({
      ...prev,
      variants: typeof updater === "function" ? updater(prev.variants) : updater,
    }));

  // Nhờ AI đọc nội dung ebook đã có rồi soạn NHÁP synopsis/themes/suitableFor.
  // Chỉ điền vào form, KHÔNG tự lưu — admin luôn phải đọc lại & bấm Lưu thay đổi.
  const aiDraftMutation = useMutation({
    mutationFn: () => api.post(`/admin/products/${productId}/ai-draft-content`).then((r) => r.data),
    onSuccess: (res) => {
      const draft = res.data || {};
      setForm((prev) => ({
        ...prev,
        synopsis: draft.synopsis || prev.synopsis,
        themes: draft.themes?.length ? draft.themes.join(", ") : prev.themes,
        suitableFor: draft.suitableFor || prev.suitableFor,
      }));
      toast.success(res.message || "AI đã soạn nháp xong — nhớ đọc lại trước khi lưu!");
    },
    onError: (e) => toast.error(e.response?.data?.message || "AI soạn nháp thất bại, thử lại sau nhé"),
  });

  return (
    <div className="a-form-grid">
      <div className="a-form-group span-2">
        <label className="a-form-label">Tên sách *</label>
        <input className="a-input" value={form.title} onChange={f("title")} placeholder="Nhập tên sách..." required />
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Tác giả *</label>
        <input className="a-input" value={form.authors} onChange={f("authors")} placeholder="Nguyễn Nhật Ánh, Tô Hoài..." required />
        <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)" }}>Nhiều tác giả cách nhau bằng dấu phẩy</span>
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Danh mục *</label>
        <select className="a-input a-select" value={form.categoryId} onChange={f("categoryId")} required>
          <option value="">Chọn danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Mô tả</label>
        <textarea className="a-input a-textarea" value={form.description} onChange={f("description")} placeholder="Mô tả ngắn về cuốn sách..." />
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Hiển thị</label>
        <div className="a-checkbox-group">
          <label className="a-checkbox-label">
            <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm((prev) => ({ ...prev, isVisible: e.target.checked }))} />
            Hiển thị trên cửa hàng
          </label>
        </div>
      </div>

      <div className="a-form-group span-2" style={{ borderTop: "1px solid #e8e5de", paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <label className="a-form-label" style={{ fontWeight: 600, fontSize: 13 }}>
            Nội dung cho AI tư vấn (Eira)
          </label>
          {productId && (
            <button
              type="button"
              className="a-btn-ghost"
              onClick={() => aiDraftMutation.mutate()}
              disabled={aiDraftMutation.isPending}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 10px" }}
            >
              {aiDraftMutation.isPending ? <Loader2 size={14} className="a-spin" /> : <Sparkles size={14} />}
              {aiDraftMutation.isPending ? "Đang soạn..." : "AI soạn nháp từ ebook"}
            </button>
          )}
        </div>
        <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)" }}>
          Dùng để Eira trả lời sâu câu hỏi về nội dung/bài học — đây là TÓM TẮT do đội biên soạn (có thể nhờ AI soạn nháp từ ebook rồi tự chỉnh lại), không phải toàn văn sách.
        </span>
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Tóm tắt cốt truyện</label>
        <textarea
          className="a-input a-textarea"
          value={form.synopsis}
          onChange={f("synopsis")}
          placeholder="Tóm tắt ngắn gọn 3-4 câu, tránh lộ đoạn kết..."
        />
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Chủ đề / bài học chính</label>
        <input
          className="a-input"
          value={form.themes}
          onChange={f("themes")}
          placeholder="Lòng dũng cảm, Bảo vệ môi trường..."
        />
        <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)" }}>Nhiều chủ đề cách nhau bằng dấu phẩy</span>
      </div>

      <div className="a-form-group span-2">
        <label className="a-form-label">Gợi ý mức độ phù hợp</label>
        <textarea
          className="a-input a-textarea"
          value={form.suitableFor}
          onChange={f("suitableFor")}
          placeholder="Vd: Hợp với bé nhút nhát, đang sợ động vật hoang dã..."
        />
      </div>

      <ProductVariantsEditor variants={form.variants} setVariants={setVariants} onDeleteVariant={onDeleteVariant} />

      <div className="a-form-group span-2" style={{ borderTop: "1px solid #e8e5de", paddingTop: 14, marginTop: 4 }}>
        <label className="a-form-label" style={{ fontWeight: 600, fontSize: 13 }}>Thông số kỹ thuật</label>
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Nhà xuất bản</label>
        <input className="a-input" value={form.publisher} onChange={f("publisher")} placeholder="Earthoria Publishing" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Năm xuất bản</label>
        <input className="a-input" type="number" value={form.publishYear} onChange={f("publishYear")} placeholder="2026" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Số trang</label>
        <input className="a-input" type="number" min={0} value={form.pages} onChange={f("pages")} placeholder="120" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Kích thước (dài x rộng x cao)</label>
        <input className="a-input" value={form.dimensions} onChange={f("dimensions")} placeholder="21 x 28 x 1.2 cm" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Trọng lượng (gram)</label>
        <input className="a-input" type="number" min={0} value={form.weightGrams} onChange={f("weightGrams")} placeholder="680" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Bìa sách</label>
        <input className="a-input" value={form.coverType} onChange={f("coverType")} placeholder="Cứng, chống nước" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Giấy in</label>
        <input className="a-input" value={form.paperType} onChange={f("paperType")} placeholder="FSC Certified 150gsm" />
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Ngôn ngữ</label>
        <select className="a-input a-select" value={form.language} onChange={f("language")}>
          <option value="VI">VI</option>
          <option value="EN">EN</option>
          <option value="VI/EN">VI/EN</option>
        </select>
      </div>

      <div className="a-form-group">
        <label className="a-form-label">Độ tuổi</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="a-input" type="number" min={0} value={form.ageMin} onChange={f("ageMin")} placeholder="Từ" />
          <input className="a-input" type="number" min={0} value={form.ageMax} onChange={f("ageMax")} placeholder="Đến" />
        </div>
      </div>
    </div>
  );
}