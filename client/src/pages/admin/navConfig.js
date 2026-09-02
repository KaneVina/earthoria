import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  QrCode,
  Gamepad2,
  Mail,
  BookOpen,
  MessageSquareText,
  Star,
  Settings as SettingsIcon,
} from "lucide-react";

// Mỗi item có field `roles` — vai trò nào được thấy item này trong sidebar.
// Phải khớp với guard tương ứng trong App.jsx (StaffOrAdminRoute / AdminRoute).
export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "STAFF"],
      },
    ],
  },
  {
    id: "sales",
    label: "Bán hàng",
    items: [
      {
        label: "Sản phẩm",
        href: "/dashboard/products",
        icon: Package,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Đơn hàng",
        href: "/dashboard/orders",
        icon: ShoppingBag,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Mã giảm giá",
        href: "/dashboard/coupons",
        icon: Tag,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Đánh giá",
        href: "/dashboard/reviews",
        icon: Star,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Yêu cầu liên hệ",
        href: "/dashboard/tickets",
        icon: MessageSquareText,
        roles: ["ADMIN", "STAFF"],
      },
    ],
  },
  {
    id: "people",
    label: "Người dùng",
    items: [
      {
        label: "Tài khoản",
        href: "/dashboard/users",
        icon: Users,
        roles: ["ADMIN", "STAFF"],
      },
    ],
  },
  {
    id: "tools",
    label: "Công cụ",
    items: [
      {
        label: "Tạo mã QR",
        href: "/dashboard/ar-codes",
        icon: QrCode,
        roles: ["ADMIN"],
      },
      {
        label: "Trò chơi",
        href: "/dashboard/games",
        icon: Gamepad2,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Ebook",
        href: "/dashboard/ebooks",
        icon: BookOpen,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Email",
        href: "/dashboard/emails",
        icon: Mail,
        roles: ["ADMIN", "STAFF"],
      },
      {
        label: "Cài đặt hệ thống",
        href: "/dashboard/settings",
        icon: SettingsIcon,
        roles: ["ADMIN"],
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
