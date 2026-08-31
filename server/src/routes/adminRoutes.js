const express = require("express");
const router = express.Router();
const uploadGlb = require("../middlewares/uploadGlb");
const {
  getDashboard,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVariant,
  searchProductsQuick,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getUsers,
  getUserDetail,
  toggleUser,
  bulkToggleUsers,
  exportUsersCsv,
  backfillUserCodes,
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  getArCodes,
  createArCode,
  updateArCode,
  toggleArCode,
  deleteArCode,
  getArCodesGroupedAll,
  updateArCodeAccess,
  getArCodeById,
  createInventoryImport,
  updateUserRole,
  createManagedUser,
  draftBookAiContent,
} = require("../controllers/adminController");
const {
  protect,
  adminOnly,
  staffOrAdmin,
} = require("../middlewares/authMiddleware");
const {
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/settingsController");
const uploadImages = require("../middlewares/uploadImages");
const {
  uploadProductImages,
  deleteProductImage,
  setProductCover,
} = require("../controllers/adminController");

router.use(protect);

router.get("/dashboard", adminOnly, getDashboard);

// Cài đặt hệ thống (bảo trì + cấu hình chung) — chỉ ADMIN, STAFF không có quyền
router.get("/settings", adminOnly, getAdminSettings);
router.put("/settings", adminOnly, updateAdminSettings);

router.get("/products/search", staffOrAdmin, searchProductsQuick);
router.get("/products/:id", staffOrAdmin, getProductById);
router.get("/products", staffOrAdmin, getProducts);
router.post("/products", staffOrAdmin, createProduct);
router.put("/products/:id", staffOrAdmin, updateProduct);
router.delete("/products/:id", staffOrAdmin, deleteProduct);
router.delete("/products/:id/variants/:variantId", staffOrAdmin, deleteProductVariant);
router.post(
  "/products/:id/images",
  staffOrAdmin,
  uploadImages.array("images"),
  uploadProductImages,
);
router.delete("/products/:id/images", staffOrAdmin, deleteProductImage);
router.patch("/products/:id/cover", staffOrAdmin, setProductCover);
router.post("/products/:id/ai-draft-content", staffOrAdmin, draftBookAiContent);

router.get("/categories", staffOrAdmin, getCategories);
router.post("/categories", staffOrAdmin, createCategory);
router.put("/categories/:id", staffOrAdmin, updateCategory);
router.delete("/categories/:id", staffOrAdmin, deleteCategory);

router.get("/orders", staffOrAdmin, getOrders);
router.get("/orders/:id", staffOrAdmin, getOrderById);
router.put("/orders/:id", staffOrAdmin, updateOrderStatus);

router.use("/emails", staffOrAdmin, require("./emailRoutes"));
router.use("/tickets", staffOrAdmin, require("./adminTicketRoutes"));
router.use("/reviews", staffOrAdmin, require("./adminReviewRoutes"));

router.get("/users", staffOrAdmin, getUsers);
router.get("/users/export", staffOrAdmin, exportUsersCsv);
router.get("/users/:id/detail", staffOrAdmin, getUserDetail);
router.post("/users", adminOnly, createManagedUser);
router.put("/users/:id/toggle", staffOrAdmin, toggleUser);
router.post("/users/bulk-toggle", staffOrAdmin, bulkToggleUsers);
router.post("/users/backfill-codes", adminOnly, backfillUserCodes);
router.put("/users/:id/role", staffOrAdmin, updateUserRole);

router.get("/coupons", staffOrAdmin, getCoupons);
router.post("/coupons", staffOrAdmin, createCoupon);
router.put("/coupons/:id/toggle", staffOrAdmin, toggleCoupon);
router.put("/coupons/:id", staffOrAdmin, updateCoupon);
router.delete("/coupons/:id", staffOrAdmin, deleteCoupon);

// Tạo mã QR: chỉ ADMIN (theo bảng phân quyền) — trước đây là staffOrAdmin, đã siết lại
router.get("/ar-codes", adminOnly, getArCodesGroupedAll);
router.get("/ar-codes/:id", adminOnly, getArCodeById);
router.patch("/ar-codes/:id/access", adminOnly, updateArCodeAccess);
router.get("/products/:bookId/ar-codes", adminOnly, getArCodes);
router.post(
  "/products/:bookId/ar-codes",
  adminOnly,
  uploadGlb.single("model"),
  createArCode,
);
router.put(
  "/ar-codes/:id",
  adminOnly,
  uploadGlb.single("model"),
  updateArCode,
);
router.put("/ar-codes/:id/toggle", adminOnly, toggleArCode);

router.use("/games", staffOrAdmin, require("./adminGameRoutes"));
router.use("/ebooks", staffOrAdmin, require("./adminEbookRoutes"));

router.post("/inventory/imports", staffOrAdmin, createInventoryImport);

router.get("/server-status", async (req, res) => {
  try {
    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: process.env.UPTIMEROBOT_API_KEY,
        monitors: process.env.UPTIMEROBOT_MONITOR_ID,
        response_times: "1",
        response_times_limit: "10",
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ stat: "fail", message: err.message });
  }
});
router.delete("/ar-codes/:id", adminOnly, deleteArCode);
module.exports = router;