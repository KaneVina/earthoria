const crypto = require("crypto");
const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { encodeId } = require("../utils/hashids");
const { validateAndComputeDiscount } = require("../utils/couponUtil");
const {
  getUserLoyaltyProfile,
  computeTierDiscount,
  getFreeShipThreshold,
} = require("../utils/loyaltyTier");
const {
  sendOrderConfirmedEmail,
  sendOrderCancelledEmail,
} = require("../services/emailService");

// Gửi email không được phép làm hỏng/làm chậm luồng chính (tạo đơn, huỷ đơn...) — luôn tự bắt lỗi,
// chỉ log lại để không ném unhandled rejection và không trì hoãn response trả về cho client.
const sendOrderEmailSafe = (sendFn, payload) => {
  sendFn(payload).catch((err) => {
    console.error(
      `[orderController] Gửi email thất bại (${sendFn.name}):`,
      err,
    );
  });
};

const { calcShippingFee: calcFee, WAREHOUSE } = require("../utils/shipping");

// Sinh mã tham chiếu gửi cho cổng thanh toán (VNPay vnp_TxnRef / MoMo orderId).
// Không dùng thẳng order.id vì mỗi lần "thanh toán lại" cần 1 mã MỚI (VNPay không cho trùng TxnRef).
const genPaymentRef = () =>
  `EARTH${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const ONLINE_PAYMENT_METHODS = ["VNPAY", "MOMO", "BANKQR"];

const ORDER_CODE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// Mã đơn hiển thị dạng ODE-aabbccdef: aa = tháng, bb = ngày, cc = 2 số cuối năm đặt đơn,
// def = 3 ký tự chữ/số sinh ổn định từ id đơn — PHẢI khớp 100% với hàm getOrderCode() bên FE
// (client/src/pages/Profile.jsx) vì dùng để xác nhận huỷ đơn.
const getOrderCode = (order) => {
  if (!order) return "";
  if (order.orderCode) return order.orderCode;
  const d = new Date(order.createdAt || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const seed = String(order.id || "");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let suffix = "";
  for (let i = 0; i < 3; i++) {
    suffix += ORDER_CODE_CHARS[hash % ORDER_CODE_CHARS.length];
    hash = Math.floor(hash / ORDER_CODE_CHARS.length) + i + 1;
  }
  return `ODE-${mm}${dd}${yy}${suffix}`;
};

// Ném ra TRONG transaction tạo đơn khi 1 request khác đã "thắng cuộc đua" giành mất stock/lượt
// coupon ngay giữa lúc request này xử lý — bước kiểm tra sơ bộ ở trên (đọc stock/coupon TRƯỚC khi
// vào transaction) chỉ là fast-fail, không đủ để chống race giữa 2 request đến gần như đồng thời.
class StockRaceError extends Error {
  constructor(bookTitle) {
    super(`Sách "${bookTitle}" vừa hết hàng, vui lòng thử lại`);
    this.bookTitle = bookTitle;
  }
}
class CouponRaceError extends Error {
  constructor(code) {
    super(`Mã giảm giá "${code}" vừa hết lượt sử dụng, vui lòng thử lại`);
    this.code = code;
  }
}

// Đơn được đưa qua đây khi include items -> variant -> book (đúng schema hiện tại)
const ORDER_ITEMS_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          book: { select: { id: true, slug: true, title: true, coverImage: true } },
        },
      },
    },
  },
  address: true,
};

// Trả về order theo format cũ mà FE đang đọc (item.book.title / item.book.coverImage)
// để không phải sửa lại toàn bộ Profile.jsx / admin — chỉ "duỗi" variant.book ra ngoài item.
// hashId được sinh thêm để FE dựng link `/books/:slug/:hashId` khi bấm vào sản phẩm.
const flattenOrderItems = (order) => {
  if (!order) return order;
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      book: item.variant?.book
        ? {
            id: item.variant.book.id,
            slug: item.variant.book.slug,
            hashId: encodeId(item.variant.book.id),
            title: item.variant.book.title,
            coverImage: item.variant.book.coverImage,
          }
        : null,
    })),
  };
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping, paymentMethod, couponCode, note, requestInvoice } = req.body;
    // shipping: { fullName, phone, email, province, district, ward, street }
    // district là tên (ví dụ "Ninh Kiều") từ form frontend

    // 1. Lấy cart (CartItem gắn với BookVariant, không phải Book trực tiếp)
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                book: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      return formatResponse(res, 400, "Giỏ hàng trống");
    }

    // 2. Kiểm tra stock (bỏ qua nếu variant là hàng không giới hạn - ví dụ sách điện tử)
    for (const item of cart.items) {
      const v = item.variant;
      if (!v.isActive || !v.book) {
        return formatResponse(
          res,
          400,
          `Sản phẩm trong giỏ không còn khả dụng`,
        );
      }
      if (!v.isUnlimitedStock && v.stock < item.quantity) {
        return formatResponse(res, 400, `Sách "${v.book.title}" không đủ hàng`);
      }
    }

    const isDigitalOrder = cart.items.every(
      (item) => item.variant.format === "DIGITAL",
    );

    // 3. Tính subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant.salePrice ?? item.variant.price;
      return sum + price * item.quantity;
    }, 0);

    // 3b. Hạng thành viên (hệ thống "Vùng Đất") — tính từ lịch sử chi tiêu đã thanh toán
    // thành công TRƯỚC đơn này, luôn tự động áp dụng, không cần user tự nhập mã.
    const loyaltyProfile = await getUserLoyaltyProfile(userId);
    const tierDiscount = computeTierDiscount(loyaltyProfile.tier, subtotal);

    // 4. Tính discount từ coupon (tra DB, kiểm tra đầy đủ: active/hết hạn/hết lượt/minOrder)
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).trim().toUpperCase() },
      });
      const result = validateAndComputeDiscount(coupon, subtotal);
      if (!result.ok) {
        return formatResponse(
          res,
          400,
          result.reason || "Mã giảm giá không hợp lệ",
        );
      }
      couponDiscount = result.discount;
      appliedCoupon = coupon;
    }

    // Tổng giảm giá = ưu đãi hạng + coupon, không vượt quá giá trị đơn hàng.
    const discount = Math.min(tierDiscount + couponDiscount, subtotal);
    const afterDiscount = subtotal - discount;

    // 5. Tính phí ship theo km (dùng cùng hàm calcFee với endpoint xem trước /orders/shipping-fee)
    // Sách điện tử không giao hàng nên luôn miễn phí ship. Ngưỡng miễn phí ship co giãn theo hạng
    // thành viên — hạng càng cao ngưỡng càng thấp (Nha Trang/TP.HCM luôn miễn phí).
    const freeShipThreshold = getFreeShipThreshold(loyaltyProfile.tier);
    let shippingFee;
    if (isDigitalOrder) {
      shippingFee = 0;
    } else if (shipping.deliveryMode === "pickup") {
      shippingFee = 0;
    } else if (afterDiscount >= freeShipThreshold) {
      shippingFee = 0;
    } else if (shipping.lat != null && shipping.lng != null) {
      const result = calcFee(shipping.lat, shipping.lng);
      shippingFee = result.fee;
    } else {
      // Không có tọa độ (geocode lúc chọn phường/xã lỗi) → phí mặc định, khớp fallback bên FE
      shippingFee = 30_000;
    }

    const total = afterDiscount + shippingFee;

  const methodMap = {
      cod: "COD",
      vnpay: "VNPAY",
      momo: "MOMO",
      bankqr: "BANKQR",
    };
    const prismaMethod = methodMap[paymentMethod];
    if (!prismaMethod) {
      return formatResponse(
        res,
        400,
        "Phương thức thanh toán không hợp lệ hoặc chưa được hỗ trợ",
      );
    }
    if (isDigitalOrder && prismaMethod === "COD") {
      return formatResponse(
        res,
        400,
         "Sách điện tử chỉ hỗ trợ thanh toán online qua VNPay, MoMo hoặc chuyển khoản QR",
      );
    }
    const isOnlinePayment = ONLINE_PAYMENT_METHODS.includes(prismaMethod);

    // 7. Tạo Address snapshot (lưu vào bảng Address)
    let address;
    if (isDigitalOrder) {
      const fullName = shipping?.fullName || req.user.name;
      const phone = shipping?.phone || req.user.phone || "";
      address = await prisma.address.findFirst({
        where: {
          userId,
          isSaved: false,
          fullName,
          phone,
          province: "",
          ward: "",
          street: "",
        },
      });
      if (!address) {
        address = await prisma.address.create({
          data: {
            userId,
            fullName,
            phone,
            province: "",
            district: "",
            ward: "",
            street: "",
            isSaved: false,
          },
        });
      }
    } else {
      address = await prisma.address.findFirst({
        where: {
          userId,
          isSaved: false,
          fullName: shipping.fullName,
          phone: shipping.phone,
          province: shipping.province,
          ward: shipping.ward,
          street: shipping.street,
        },
      });

      if (!address) {
        address = await prisma.address.create({
          data: {
            userId,
            fullName: shipping.fullName,
            phone: shipping.phone,
            province: shipping.province,
            district: "",
            ward: shipping.ward,
            street: shipping.street,
            lat: shipping.lat ?? null,
            lng: shipping.lng ?? null,
            isSaved: false,
          },
        });
      }
    }

    // 8. Tạo Order + OrderItems trong transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentMethod: prismaMethod,
          isDigital: isDigitalOrder,
          subtotal,
          discount,
          shippingFee,
          total,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          loyaltyTier: loyaltyProfile.tier.code,
          loyaltyDiscount: tierDiscount,
          note: note || null,
          requestInvoice: Boolean(requestInvoice),
          // Online payment (VNPay/MoMo) cần 1 mã tham chiếu để đối chiếu lúc gateway redirect về
          paymentRef: isOnlinePayment ? genPaymentRef() : null,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variant.id,
              quantity: item.quantity,
              price: item.variant.salePrice ?? item.variant.price,
            })),
          },
        },
        include: { items: true },
      });

      // Tăng lượt dùng coupon (nếu có) — update CÓ ĐIỀU KIỆN (usedCount < usageLimit) để 2 request
      // cùng dùng 1 coupon còn đúng 1 lượt, đến gần như đồng thời, chỉ đúng 1 request được tăng;
      // request thua cuộc đua ném lỗi → cả transaction (kể cả order vừa tạo) tự rollback sạch.
      if (appliedCoupon) {
        const couponWhere = { id: appliedCoupon.id };
        if (appliedCoupon.usageLimit != null) {
          couponWhere.usedCount = { lt: appliedCoupon.usageLimit };
        }
        const couponResult = await tx.coupon.updateMany({
          where: couponWhere,
          data: { usedCount: { increment: 1 } },
        });
        if (couponResult.count === 0) {
          throw new CouponRaceError(appliedCoupon.code);
        }
      }

      // Giảm stock theo variant (bỏ qua hàng không giới hạn) — update CÓ ĐIỀU KIỆN (stock >= quantity)
      // cùng lý do: check ở bước 2 phía trên đọc TRƯỚC transaction nên không chống được race, đây mới
      // là chỗ đảm bảo thật — nếu không sẽ có thể trừ thành stock âm khi 2 đơn cùng giành 1 cuốn cuối.
      for (const item of cart.items) {
        if (item.variant.isUnlimitedStock) continue;
        const stockResult = await tx.bookVariant.updateMany({
          where: { id: item.variant.id, stock: { gte: item.quantity } },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
        if (stockResult.count === 0) {
          throw new StockRaceError(item.variant.book.title);
        }
      }

      // Xóa cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // Gửi email xác nhận đơn hàng (không chặn response) — dùng luôn dữ liệu cart/address đã có
    // trong tay thay vì query lại DB, vì đúng những gì vừa được lưu vào Order/OrderItem.
    sendOrderEmailSafe(sendOrderConfirmedEmail, {
      to: req.user.email,
      name: req.user.name,
      order: {
        id: order.id,
        createdAt: order.createdAt,
         items: cart.items.map((item) => ({
          title: item.variant.book?.title || "",
          quantity: item.quantity,
          price: item.variant.salePrice ?? item.variant.price,
          format: item.variant.format,
        })),
        subtotal,
        discount,
        shippingFee,
        total,
        paymentMethod: prismaMethod,
        isDigital: isDigitalOrder,
        address: isDigitalOrder
          ? null
          : {
              fullName: shipping.fullName,
              phone: shipping.phone,
              street: shipping.street,
              ward: shipping.ward,
              district: "",
              province: shipping.province,
            },
      },
    });

    return formatResponse(res, 201, "Đặt hàng thành công", {
      orderId: order.id,
      total,
      paymentMethod: prismaMethod,
      requiresOnlinePayment: isOnlinePayment,
    });
  } catch (error) {
    if (error instanceof StockRaceError || error instanceof CouponRaceError) {
      return formatResponse(res, 409, error.message);
    }
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: ORDER_ITEMS_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return formatResponse(res, 200, "OK", orders.map(flattenOrderItems));
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const calcShippingFee = async (req, res) => {
  try {
    const { lat, lng, subtotal = 0 } = req.body;

    if (!lat || !lng) return formatResponse(res, 400, "Thiếu tọa độ lat/lng");

    const loyaltyProfile = await getUserLoyaltyProfile(req.user.id);
    const freeShipThreshold = getFreeShipThreshold(loyaltyProfile.tier);

    if (subtotal >= freeShipThreshold) {
      return formatResponse(res, 200, "OK", {
        km: null,
        fee: 0,
        free: true,
        isNoiO: false,
      });
    }

    // Gọi OSRM để lấy km đường thực tế
    let kmFromOSRM = null;
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${WAREHOUSE.lng},${WAREHOUSE.lat};${lng},${lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl, {
        signal: AbortSignal.timeout(4000),
      });
      const osrmData = await osrmRes.json();
      if (osrmData.routes?.[0]?.distance) {
        kmFromOSRM = parseFloat(
          (osrmData.routes[0].distance / 1000).toFixed(1),
        );
      }
    } catch {
      // OSRM timeout → fallback haversine, không cần báo lỗi
    }

    const result = calcFee(lat, lng, kmFromOSRM);
    return formatResponse(res, 200, "OK", { ...result });
  } catch (error) {
    return formatResponse(res, 500, "Lỗi server");
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_ITEMS_INCLUDE,
    });

    if (!order) return formatResponse(res, 404, "Không tìm thấy đơn hàng");
    if (order.userId !== req.user.id)
      return formatResponse(res, 403, "Không có quyền xem đơn hàng này");

    return formatResponse(res, 200, "OK", flattenOrderItems(order));
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

const cancelOrder = async (req, res) => {
  try {
    const { reason, confirmCode } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            variant: { include: { book: { select: { title: true } } } },
          },
        },
      },
    });

    if (!order) return formatResponse(res, 404, "Không tìm thấy đơn hàng");
    if (order.userId !== req.user.id)
      return formatResponse(res, 403, "Không có quyền huỷ đơn hàng này");
    // Đơn đã thanh toán online (VNPay/MoMo) rồi thì KHÔNG cho tự huỷ ở đây — huỷ ở bước này chỉ hoàn
    // kho/coupon chứ không hề động đến tiền đã thu, nên phải qua quy trình yêu cầu hoàn tiền có kiểm soát.
    if (order.paymentStatus === "PAID") {
      return formatResponse(
        res,
        400,
        "Đơn hàng đã được thanh toán — vui lòng liên hệ để được hỗ trợ hoàn tiền thay vì tự huỷ",
      );
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return formatResponse(
        res,
        400,
        "Đơn hàng đang ở trạng thái không thể huỷ",
      );
    }

    // Bắt buộc gõ đúng mã đơn hàng hiển thị trên FE (dạng ODE-aabbccdef, xem getOrderCode()) trước khi
    // cho huỷ — tránh thao tác nhầm, và bắt buộc phải có lý do để lưu vết + đưa vào email báo huỷ cho khách.
    const expectedCode = getOrderCode(order).toLowerCase();
    if (
      !confirmCode ||
      String(confirmCode).trim().toLowerCase() !== expectedCode
    ) {
      return formatResponse(res, 400, "Mã đơn hàng xác nhận không đúng");
    }
    if (!reason || !String(reason).trim()) {
      return formatResponse(res, 400, "Vui lòng nhập lý do huỷ đơn");
    }
    const cancelReason = String(reason).trim();

    const updated = await prisma.$transaction(async (tx) => {
      // Hoàn lại stock đã trừ lúc đặt hàng (bỏ qua hàng không giới hạn)
      for (const item of order.items) {
        if (item.variant.isUnlimitedStock) continue;
        await tx.bookVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
            sold: { decrement: item.quantity },
          },
        });
      }

      // Hoàn lượt dùng coupon nếu đơn có áp mã và chưa thanh toán
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
    });

    // Gửi email báo huỷ đơn kèm lý do khách vừa nhập (không chặn response).
    sendOrderEmailSafe(sendOrderCancelledEmail, {
      to: req.user.email,
      name: req.user.name,
      order: {
        id: order.id,
        createdAt: order.createdAt,
       items: order.items.map((item) => ({
          title: item.variant.book?.title || "",
          quantity: item.quantity,
          price: item.price,
          format: item.variant.format,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        paymentStatus: updated.paymentStatus,
      },
      reason: cancelReason,
    });

    return formatResponse(res, 200, "Đã huỷ đơn hàng", updated);
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const confirmOrderReceived = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) return formatResponse(res, 404, "Không tìm thấy đơn hàng");
    if (order.userId !== req.user.id)
      return formatResponse(res, 403, "Không có quyền với đơn hàng này");
    if (order.isDigital)
      return formatResponse(
        res,
        400,
        "Đơn hàng sách điện tử tự động hoàn thành ngay sau khi thanh toán",
      );
    if (order.status !== "DELIVERED")
      return formatResponse(
        res,
        400,
        "Đơn hàng chưa ở trạng thái đã giao, chưa thể xác nhận đã nhận",
      );

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", paymentStatus: "PAID" },
    });

    return formatResponse(res, 200, "Đã xác nhận nhận hàng, cảm ơn bạn!", updated);
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  calcShippingFee,
  getOrderById,
  cancelOrder,
  confirmOrderReceived,
  ORDER_ITEMS_INCLUDE,
  flattenOrderItems,
  genPaymentRef,
  getOrderCode,
  ONLINE_PAYMENT_METHODS,
};