// navConfig.js — Cấu hình menu sidebar, gom theo nhóm để có thể thu gọn/mở rộng
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  QrCode,
  BarChart2,
  Mail,
} from "lucide-react";

/**
 * NAV_GROUPS
 *
 * Mỗi nhóm có:
 * - id: khoá dùng để lưu trạng thái collapsed (localStorage / state)
 * - label: tên nhóm hiển thị, bấm vào để thu gọn/mở rộng
 * - items: danh sách menu con trong nhóm
 *
 * Muốn thêm/bớt mục chỉ cần sửa ở đây, không cần đụng vào Sidebar.jsx
 */
export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "sales",
    label: "Bán hàng",
    items: [
      { label: "Sản phẩm", href: "/dashboard/products", icon: Package },
      { label: "Đơn hàng", href: "/dashboard/orders", icon: ShoppingBag },
      { label: "Mã giảm giá", href: "/dashboard/coupons", icon: Tag },
    ],
  },
  {
    id: "people",
    label: "Người dùng",
    items: [{ label: "Người dùng", href: "/dashboard/users", icon: Users }],
  },
  {
    id: "tools",
    label: "Công cụ",
    items: [
      { label: "Tạo mã QR", href: "/dashboard/ar-codes", icon: QrCode },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { label: "Email", href: "/dashboard/emails", icon: Mail },
    ],
  },
];

// Dùng để tra breadcrumb mặc định (label theo path hiện tại)
export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);