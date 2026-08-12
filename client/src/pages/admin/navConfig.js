// navConfig.js — Cấu hình menu sidebar, gom theo nhóm để có thể thu gọn/mở rộng
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
      { label: "Đánh giá", href: "/dashboard/reviews", icon: Star },
      { label: "Yêu cầu liên hệ", href: "/dashboard/tickets", icon: MessageSquareText },
    ],
  },
  {
    id: "people",
    label: "Người dùng",
    items: [{ label: "Tài khoản", href: "/dashboard/users", icon: Users }],
  },
  {
    id: "tools",
    label: "Công cụ",
    items: [
      { label: "Tạo mã QR", href: "/dashboard/ar-codes", icon: QrCode },
      { label: "Trò chơi", href: "/dashboard/games", icon: Gamepad2 },
      { label: "Ebook", href: "/dashboard/ebooks", icon: BookOpen },
      { label: "Email", href: "/dashboard/emails", icon: Mail },
      { label: "Cài đặt hệ thống", href: "/dashboard/settings", icon: SettingsIcon },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);