const express = require("express");
const router = express.Router();
const uploadGlb = require("../middlewares/uploadGlb");
const {
  getDashboard,
  // Products (books)
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProductsQuick,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  // Orders
  getOrders,
  updateOrderStatus,
  // Users
  getUsers,
  toggleUser,
  backfillUserCodes,
  // Coupons
  getCoupons,
  createCoupon,
  toggleCoupon,
  // Ar
  getArCodes,
  createArCode,
  updateArCode,
  toggleArCode,
  deleteArCode,
  getArCodesGroupedAll,
  updateArCodeAccess,
  getArCodeById,
  // Inventory
  createInventoryImport,
  updateUserRole,
  createManagedUser,
} = require("../controllers/adminController");
const {
  protect,
  adminOnly,
  staffOrAdmin,
} = require("../middlewares/authMiddleware");
const uploadImages = require("../middlewares/uploadImages");
const {
  uploadProductImages,
  deleteProductImage,
  setProductCover,
} = require("../controllers/adminController");

// Chỉ xác thực đăng nhập ở đây
router.use(protect);

//   Dashboard
router.get("/dashboard", adminOnly, getDashboard);

//   Products (/admin/products)
router.get("/products/search", staffOrAdmin, searchProductsQuick);
router.get("/products/:id", staffOrAdmin, getProductById);
router.get("/products", adminOnly, getProducts);
router.post("/products", adminOnly, createProduct);
router.put("/products/:id", adminOnly, updateProduct);
router.delete("/products/:id", adminOnly, deleteProduct);
router.post(
  "/products/:id/images",
  adminOnly,
  uploadImages.array("images"),
  uploadProductImages,
);
router.delete("/products/:id/images", adminOnly, deleteProductImage);
router.patch("/products/:id/cover", adminOnly, setProductCover);

//   Categories
router.get("/categories", adminOnly, getCategories);
router.post("/categories", adminOnly, createCategory);
router.put("/categories/:id", adminOnly, updateCategory);

//   Orders
router.get("/orders", adminOnly, getOrders);
router.put("/orders/:id", adminOnly, updateOrderStatus);

//Email
router.use("/emails", adminOnly, require("./emailRoutes"));

//   Users
router.get("/users", staffOrAdmin, getUsers);
router.post("/users", staffOrAdmin, createManagedUser);
router.put("/users/:id/toggle", staffOrAdmin, toggleUser);
router.post("/users/backfill-codes", adminOnly, backfillUserCodes);
router.put("/users/:id/role", staffOrAdmin, updateUserRole);

//   Coupons
router.get("/coupons", adminOnly, getCoupons);
router.post("/coupons", adminOnly, createCoupon);
router.put("/coupons/:id/toggle", adminOnly, toggleCoupon);

//   AR Codes (staff + admin đều được quản lý)
router.get("/ar-codes", staffOrAdmin, getArCodesGroupedAll);
router.get("/ar-codes/:id", staffOrAdmin, getArCodeById);
router.patch("/ar-codes/:id/access", staffOrAdmin, updateArCodeAccess);
router.get("/products/:bookId/ar-codes", staffOrAdmin, getArCodes);
router.post(
  "/products/:bookId/ar-codes",
  staffOrAdmin,
  uploadGlb.single("model"),
  createArCode,
);
router.put(
  "/ar-codes/:id",
  staffOrAdmin,
  uploadGlb.single("model"),
  updateArCode,
);
router.put("/ar-codes/:id/toggle", staffOrAdmin, toggleArCode);

//   Nhập kho
router.post("/inventory/imports", staffOrAdmin, createInventoryImport);

//   UptimeRobot proxy
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
router.delete("/ar-codes/:id", staffOrAdmin, deleteArCode);
module.exports = router;
