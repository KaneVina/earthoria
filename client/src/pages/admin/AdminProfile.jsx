// AdminProfile.jsx — Hồ sơ cá nhân của người quản trị (tách riêng khỏi Cài Đặt Hệ Thống)
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, Cake, Sun, Moon, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useAdminTheme } from "../../hooks/useAdminTheme";
import AdminLayout from "./AdminLayout";
import EditableField from "./settings/EditableField";

export default function AdminProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuthStore();
  const { isDark, toggle } = useAdminTheme();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => authService.getMe().then((r) => r.data.data),
    initialData: user,
    initialDataUpdatedAt: 0,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (patch) => authService.updateProfile(patch),
    onSuccess: (_res, patch) => {
      const updated = { ...profile, ...patch };
      updateUser(updated);
      queryClient.setQueryData(["admin-profile"], updated);
      toast.success("Đã cập nhật thông tin");
    },
  });

  const saveField = useCallback(
    (field) => async (val) => {
      await updateProfileMutation.mutateAsync({ [field]: val });
    },
    [updateProfileMutation]
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout API failed:", err);
    }
    logout();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  if (!profile) return null;

  return (
    <AdminLayout crumbs={[{ label: "Hồ sơ cá nhân" }]}>
      <div style={{ marginBottom: 26 }}>
        <p className="a-page-eyebrow">Tài khoản</p>
        <h1 className="a-page-title">
          Hồ Sơ <em>Cá Nhân</em>
        </h1>
      </div>

      {/*  1. THÔNG TIN CÁ NHÂN  */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Thông Tin <em>Cá Nhân</em>
          </h3>
          <p className="a-chart-sub">Nhấn vào biểu tượng bút để chỉnh sửa</p>
        </div>

        <div className="a-fields-grid">
          <EditableField
            label="Họ"
            icon={User}
            value={profile.lastName}
            onSave={saveField("lastName")}
            validate={(v) => (!v.trim() ? "Họ không được để trống" : null)}
          />
          <EditableField
            label="Tên"
            icon={User}
            value={profile.firstName}
            onSave={saveField("firstName")}
            validate={(v) => (!v.trim() ? "Tên không được để trống" : null)}
          />
          <EditableField
            label="Email"
            icon={Mail}
            value={profile.email}
            locked
            masked
            lockedHint="Email dùng để đăng nhập, không thể thay đổi"
            onSave={() => {}}
          />
          <EditableField
            label="Số điện thoại"
            icon={Phone}
            value={profile.phone}
            type="tel"
            onSave={saveField("phone")}
            validate={(v) =>
              v && !/^[0-9+\s-]{8,15}$/.test(v) ? "Số điện thoại không hợp lệ" : null
            }
          />
          <EditableField
            label="Ngày sinh"
            icon={Cake}
            value={profile.dob ? profile.dob.slice(0, 10) : ""}
            type="date"
            onSave={saveField("dob")}
          />
          <EditableField
            label="Giới tính"
            icon={User}
            value={profile.gender}
            options={[
              { value: "MALE", label: "Nam" },
              { value: "FEMALE", label: "Nữ" },
              { value: "OTHER", label: "Khác" },
            ]}
            onSave={saveField("gender")}
          />
        </div>
      </div>

      {/*  2. GIAO DIỆN (DARK/LIGHT)  */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Giao Diện <em>Hiển Thị</em>
          </h3>
          <p className="a-chart-sub">Chọn chế độ sáng hoặc tối cho trang quản trị</p>
        </div>

        <div className="a-theme-row">
          <div>
            <div className="a-theme-row-title">Chế độ tối</div>
            <div className="a-theme-row-desc">
              {isDark ? "Đang bật — dịu mắt hơn khi làm việc ban đêm" : "Đang tắt — giao diện sáng mặc định"}
            </div>
          </div>
          <label className="a-switch">
            <input type="checkbox" checked={isDark} onChange={toggle} />
            <span className="a-switch-track">
              <span className="a-switch-thumb">
                {isDark ? <Moon size={12} /> : <Sun size={12} />}
              </span>
            </span>
          </label>
        </div>
      </div>

      {/*  3. ĐĂNG XUẤT  */}
      <div className="a-chart-card">
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Phiên <em>Đăng Nhập</em>
          </h3>
          <p className="a-chart-sub">Đăng xuất khỏi tài khoản quản trị hiện tại</p>
        </div>
        <button onClick={handleLogout} className="a-btn-ghost" style={{ color: "#c05050", borderColor: "rgba(192,80,80,0.3)" }}>
          <LogOut size={14} /> Đăng Xuất
        </button>
      </div>
    </AdminLayout>
  );
}