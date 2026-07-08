// ProductCreate.jsx — Trang riêng để thêm sách mới (không dùng modal)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import ProductFormFields from "./ProductFormFields";
import { EMPTY_FORM, formToPayload } from "./productFormUtils";
import { generateProductCode } from "../../../utils/generateProductCode";

export default function ProductCreate() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [codePreview, setCodePreview] = useState(() => generateProductCode());
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/admin/products", payload),
    onSuccess: (res) => {
      toast.success("Tạo sách thành công!");
      qc.invalidateQueries(["admin-products"]);
      const newId = res?.data?.data?.id;
      navigate(newId ? `/dashboard/products/${newId}` : "/dashboard/products");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Tạo thất bại!"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // productCode không gửi lên tay — backend tự sinh mã khi tạo sách (yêu cầu #3).
    // codePreview ở đây chỉ mang tính minh hoạ cho admin biết dạng mã sẽ trông như thế nào.
    createMutation.mutate(formToPayload(form));
  };

  return (
    <AdminLayout
      crumbs={[
        { label: "Sản phẩm", to: "/dashboard/products" },
        { label: "Thêm sách mới" },
      ]}
    >
      <button
        className="a-btn-ghost"
        onClick={() => navigate("/dashboard/products")}
        style={{ marginBottom: 18 }}
      >
        <ArrowLeft size={13} /> Quay lại danh sách sách
      </button>

      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Thêm mới</p>
          <h1 className="a-page-title">
            Thêm <em>sách mới</em>
          </h1>
        </div>
      </div>

      {/* Mã sách preview */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Mã <em>sách</em>
          </h3>
          <p className="a-chart-sub">
            Mã chính thức sẽ được hệ thống cấp khi lưu sách — đây chỉ là bản xem trước
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="a-badge info"
            style={{ fontFamily: "monospace", fontSize: 13, padding: "6px 12px" }}
          >
            {codePreview}
          </span>
          <button
            type="button"
            className="a-btn-icon"
            title="Sinh mã khác để xem trước"
            onClick={() => setCodePreview(generateProductCode())}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="a-chart-card">
        <form onSubmit={handleSubmit}>
          <ProductFormFields form={form} setForm={setForm} categories={categories} />

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              type="submit"
              className="a-btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Đang lưu..." : "Tạo sách"}
            </button>
            <button
              type="button"
              className="a-btn-ghost"
              onClick={() => navigate("/dashboard/products")}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}