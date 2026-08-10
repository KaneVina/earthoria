const crypto = require("crypto");
const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { validateAndComputeDiscount } = require("../utils/couponUtil");

const FREE_SHIP_THRESHOLD = 300_000;
const { calcShippingFee: calcFee, WAREHOUSE } = require("../utils/shipping");

// Sinh mã tham chiếu gửi cho cổng thanh toán (VNPay vnp_TxnRef / MoMo orderId).
// Không dùng thẳng order.id vì mỗi lần "thanh toán lại" cần 1 mã MỚI (VNPay không cho trùng TxnRef).
const genPaymentRef = () =>
  `EARTH${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const ONLINE_PAYMENT_METHODS = ["VNPAY", "MOMO"];

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
        include: { book: { select: { title: true, coverImage: true } } },
      },
    },
  },
  address: true,
};

// Trả về order theo format cũ mà FE đang đọc (item.book.title / item.book.coverImage)
// để không phải sửa lại toàn bộ Profile.jsx / admin — chỉ "duỗi" variant.book ra ngoài item.
const flattenOrderItems = (order) => {
  if (!order) return order;
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      book: item.variant?.book
        ? {
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
    const { shipping, paymentMethod, couponCode, note } = req.body;
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

    // 3. Tính subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant.salePrice ?? item.variant.price;
      return sum + price * item.quantity;
    }, 0);

    // 4. Tính discount từ coupon (tra DB, kiểm tra đầy đủ: active/hết hạn/hết lượt/minOrder)
    let discount = 0;
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
      discount = result.discount;
      appliedCoupon = coupon;
    }

    const afterDiscount = subtotal - discount;

    // 5. Tính phí ship theo km (dùng cùng hàm calcFee với endpoint xem trước /orders/shipping-fee)
    let shippingFee;
    if (shipping.deliveryMode === "pickup") {
      shippingFee = 0;
    } else if (afterDiscount >= FREE_SHIP_THRESHOLD) {
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
    };
    const prismaMethod = methodMap[paymentMethod];
    if (!prismaMethod) {
      return formatResponse(
        res,
        400,
        "Phương thức thanh toán không hợp lệ hoặc chưa được hỗ trợ",
      );
    }
    const isOnlinePayment = ONLINE_PAYMENT_METHODS.includes(prismaMethod);

    // 7. Tạo Address snapshot (lưu vào bảng Address)
    const address = await prisma.address.create({
      data: {
        userId,
        fullName: shipping.fullName,
        phone: shipping.phone,
        province: shipping.province,
        district: "",
        ward: shipping.ward,
        street: shipping.street,
      },
    });

    // 8. Tạo Order + OrderItems trong transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentMethod: prismaMethod,
          subtotal,
          discount,
          shippingFee,
          total,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          note: note || null,
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

    if (subtotal >= FREE_SHIP_THRESHOLD) {
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
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { variant: true } } },
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

    return formatResponse(res, 200, "Đã huỷ đơn hàng", updated);
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
  ORDER_ITEMS_INCLUDE,
  flattenOrderItems,
  genPaymentRef,
  ONLINE_PAYMENT_METHODS,
};