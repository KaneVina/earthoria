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
  getOrders,
  updateOrderStatus,
  getUsers,
  getUserDetail,
  toggleUser,
  backfillUserCodes,
  getCoupons,
  createCoupon,
  toggleCoupon,
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

router.use(protect);

router.get("/dashboard", adminOnly, getDashboard);

router.get("/products/search", staffOrAdmin, searchProductsQuick);
router.get("/products/:id", staffOrAdmin, getProductById);
router.get("/products", adminOnly, getProducts);
router.post("/products", adminOnly, createProduct);
router.put("/products/:id", adminOnly, updateProduct);
router.delete("/products/:id", adminOnly, deleteProduct);
router.delete("/products/:id/variants/:variantId", adminOnly, deleteProductVariant);
router.post(
  "/products/:id/images",
  adminOnly,
  uploadImages.array("images"),
  uploadProductImages,
);
router.delete("/products/:id/images", adminOnly, deleteProductImage);
router.patch("/products/:id/cover", adminOnly, setProductCover);

router.get("/categories", adminOnly, getCategories);
router.post("/categories", adminOnly, createCategory);
router.put("/categories/:id", adminOnly, updateCategory);

router.get("/orders", adminOnly, getOrders);
router.put("/orders/:id", adminOnly, updateOrderStatus);

router.use("/emails", adminOnly, require("./emailRoutes"));
router.use("/tickets", staffOrAdmin, require("./adminTicketRoutes"));

router.get("/users", staffOrAdmin, getUsers);
router.get("/users/:id/detail", staffOrAdmin, getUserDetail);
router.post("/users", staffOrAdmin, createManagedUser);
router.put("/users/:id/toggle", staffOrAdmin, toggleUser);
router.post("/users/backfill-codes", adminOnly, backfillUserCodes);
router.put("/users/:id/role", staffOrAdmin, updateUserRole);

router.get("/coupons", adminOnly, getCoupons);
router.post("/coupons", adminOnly, createCoupon);
router.put("/coupons/:id/toggle", adminOnly, toggleCoupon);

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
router.delete("/ar-codes/:id", staffOrAdmin, deleteArCode);
module.exports = router;