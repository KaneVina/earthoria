import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { settingsService } from "../../services/settingsService";
import AdminLayout from "./AdminLayout";
import MaintenancePanel from "./settings/MaintenancePanel";
import GeneralSettingsPanel from "./settings/GeneralSettingsPanel";

export default function Settings() {
  const queryClient = useQueryClient();

  // Cài đặt hệ thống (bảo trì + cấu hình chung) — chỉ ADMIN mới thấy trang này
  // (route /dashboard/settings đã được bọc AdminRoute, STAFF không vào được)
  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: () => settingsService.getAdmin().then((r) => r.data.data),
  });

  const updateSiteSettingsMutation = useMutation({
    mutationFn: (patch) => settingsService.updateAdmin(patch),
    onSuccess: (res) => {
      queryClient.setQueryData(["admin-site-settings"], res.data.data);
      toast.success("Đã lưu cài đặt hệ thống");
    },
  });

  const saveSiteSettings = useCallback(
    (patch) =>
      updateSiteSettingsMutation
        .mutateAsync(patch)
        .then((res) => res.data.data),
    [updateSiteSettingsMutation],
  );

  return (
    <AdminLayout>
      <div style={{ marginBottom: 26 }}>
        <p className="a-page-eyebrow">Hệ thống</p>
        <h1 className="a-page-title">
          Cài Đặt <em>Hệ Thống</em>
        </h1>
      </div>

      {/*  BẢO TRÌ + CÀI ĐẶT CHUNG  */}
      {siteSettings && (
        <>
          <MaintenancePanel
            settings={siteSettings}
            saving={updateSiteSettingsMutation.isPending}
            onSave={saveSiteSettings}
          />
          <GeneralSettingsPanel
            settings={siteSettings}
            saving={updateSiteSettingsMutation.isPending}
            onSave={saveSiteSettings}
          />
        </>
      )}
    </AdminLayout>
  );
}
