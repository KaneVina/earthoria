import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Megaphone,
  Truck,
  Package,
} from "lucide-react";

function Field({ label, icon: Icon, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="a-field">
      <div className="a-field-label">
        {Icon && <Icon size={13} strokeWidth={1.6} className="a-field-icon" />}
        {label}
      </div>
      <input
        type={type}
        className="a-input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SwitchRow({ title, desc, checked, onChange }) {
  return (
    <div className="a-theme-row" style={{ padding: "10px 0" }}>
      <div>
        <div className="a-theme-row-title">{title}</div>
        {desc && <div className="a-theme-row-desc">{desc}</div>}
      </div>
      <label className="a-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="a-switch-track">
          <span className="a-switch-thumb" />
        </span>
      </label>
    </div>
  );
}

const FIELD_KEYS = [
  "siteName",
  "siteTagline",
  "contactEmail",
  "contactPhone",
  "contactAddress",
  "facebookUrl",
  "instagramUrl",
  "tiktokUrl",
  "youtubeUrl",
  "bannerEnabled",
  "bannerText",
  "bannerLink",
  "allowRegistration",
  "allowGuestCheckout",
  "codEnabled",
  "stripeEnabled",
  "freeShippingThreshold",
  "maxCartItems",
];

function extractForm(settings) {
  const form = {};
  for (const key of FIELD_KEYS) form[key] = settings[key];
  return form;
}

export default function GeneralSettingsPanel({ settings, onSave, saving }) {
  const [form, setForm] = useState(() => extractForm(settings));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(extractForm(settings));
    setDirty(false);
    setError("");
  }, [settings]);

  const set = useCallback(
    (key) => (value) => {
      setForm((f) => ({ ...f, [key]: value }));
      setDirty(true);
      setError("");
    },
    []
  );

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        freeShippingThreshold:
          form.freeShippingThreshold === "" || form.freeShippingThreshold === null
            ? null
            : Number(form.freeShippingThreshold),
        maxCartItems:
          form.maxCartItems === "" || form.maxCartItems === null
            ? null
            : Number(form.maxCartItems),
      };
      await onSave(payload);
      setDirty(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Lưu cài đặt thất bại");
    }
  };

  return (
    <>
      {/* Thông tin & liên hệ */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Thông Tin <em>Website</em>
          </h3>
          <p className="a-chart-sub">Thông tin chung và kênh liên hệ hiển thị ngoài trang web</p>
        </div>

        <div className="a-fields-grid">
          <Field label="Tên website" icon={Globe} value={form.siteName} onChange={set("siteName")} />
          <Field label="Khẩu hiệu / Tagline" icon={Globe} value={form.siteTagline} onChange={set("siteTagline")} />
          <Field label="Email liên hệ" icon={Mail} type="email" value={form.contactEmail} onChange={set("contactEmail")} />
          <Field label="Số điện thoại liên hệ" icon={Phone} value={form.contactPhone} onChange={set("contactPhone")} />
          <Field label="Địa chỉ" icon={MapPin} value={form.contactAddress} onChange={set("contactAddress")} />
        </div>
      </div>

      {/* Mạng xã hội */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Mạng <em>Xã Hội</em>
          </h3>
          <p className="a-chart-sub">Liên kết hiển thị ở chân trang</p>
        </div>

        <div className="a-fields-grid">
          <Field label="Facebook" icon={Facebook} value={form.facebookUrl} onChange={set("facebookUrl")} placeholder="https://facebook.com/..." />
          <Field label="Instagram" icon={Instagram} value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/..." />
          <Field label="TikTok" value={form.tiktokUrl} onChange={set("tiktokUrl")} placeholder="https://tiktok.com/@..." />
          <Field label="YouTube" icon={Youtube} value={form.youtubeUrl} onChange={set("youtubeUrl")} placeholder="https://youtube.com/..." />
        </div>
      </div>

      {/* Banner thông báo */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Banner <em>Thông Báo</em>
          </h3>
          <p className="a-chart-sub">Dải thông báo hiển thị trên toàn trang, ví dụ khuyến mãi hoặc thông báo ngắn</p>
        </div>

        <SwitchRow
          title="Hiển thị banner"
          desc={form.bannerEnabled ? "Đang bật" : "Đang tắt"}
          checked={Boolean(form.bannerEnabled)}
          onChange={set("bannerEnabled")}
        />
        <div className="a-fields-grid" style={{ marginTop: 12 }}>
          <Field label="Nội dung banner" icon={Megaphone} value={form.bannerText} onChange={set("bannerText")} placeholder="VD: Miễn phí vận chuyển đơn từ 500K" />
          <Field label="Liên kết khi bấm vào (tuỳ chọn)" value={form.bannerLink} onChange={set("bannerLink")} placeholder="/shop" />
        </div>
      </div>

      {/* Tính năng */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Tính Năng <em>Website</em>
          </h3>
          <p className="a-chart-sub">Bật/tắt nhanh các tính năng cho toàn hệ thống</p>
        </div>

        <SwitchRow
          title="Cho phép đăng ký tài khoản mới"
          checked={Boolean(form.allowRegistration)}
          onChange={set("allowRegistration")}
        />
        <SwitchRow
          title="Cho phép đặt hàng không cần đăng nhập"
          checked={Boolean(form.allowGuestCheckout)}
          onChange={set("allowGuestCheckout")}
        />
        <SwitchRow
          title="Thanh toán khi nhận hàng (COD)"
          checked={Boolean(form.codEnabled)}
          onChange={set("codEnabled")}
        />
        <SwitchRow
          title="Thanh toán qua Stripe"
          checked={Boolean(form.stripeEnabled)}
          onChange={set("stripeEnabled")}
        />
      </div>

      {/* Vận chuyển & giỏ hàng */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Vận Chuyển & <em>Giỏ Hàng</em>
          </h3>
          <p className="a-chart-sub">Ngưỡng và giới hạn áp dụng cho toàn bộ đơn hàng</p>
        </div>

        <div className="a-fields-grid">
          <Field
            label="Miễn phí ship từ (VNĐ, để trống = tắt)"
            icon={Truck}
            type="number"
            value={form.freeShippingThreshold ?? ""}
            onChange={set("freeShippingThreshold")}
            placeholder="500000"
          />
          <Field
            label="Số lượng sản phẩm tối đa trong giỏ (để trống = không giới hạn)"
            icon={Package}
            type="number"
            value={form.maxCartItems ?? ""}
            onChange={set("maxCartItems")}
            placeholder="20"
          />
        </div>
      </div>

      {error && <div className="a-field-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="a-btn-ghost"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? "Đang lưu..." : "Lưu cài đặt chung"}
        </button>
      </div>
    </>
  );
}