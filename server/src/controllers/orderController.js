const crypto = require("crypto");
const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { getShippingFee } = require("../utils/shipping");
const { validateAndComputeDiscount } = require("../utils/couponUtil");

const FREE_SHIP_THRESHOLD = 300_000;
const { calcShippingFee: calcFee, WAREHOUSE } = require("../utils/shipping");

// Sinh mã tham chiếu gửi cho cổng thanh toán (VNPay vnp_TxnRef / MoMo orderId).
// Không dùng thẳng order.id vì mỗi lần "thanh toán lại" cần 1 mã MỚI (VNPay không cho trùng TxnRef).
const genPaymentRef = () =>
  `EARTH${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const ONLINE_PAYMENT_METHODS = ["VNPAY", "MOMO"];

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
        ? { title: item.variant.book.title, coverImage: item.variant.book.coverImage }
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
        return formatResponse(res, 400, `Sản phẩm trong giỏ không còn khả dụng`);
      }
      if (!v.isUnlimitedStock && v.stock < item.quantity) {
        return formatResponse(
          res,
          400,
          `Sách "${v.book.title}" không đủ hàng`,
        );
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
        return formatResponse(res, 400, result.reason || "Mã giảm giá không hợp lệ");
      }
      discount = result.discount;
      appliedCoupon = coupon;
    }

    const afterDiscount = subtotal - discount;

    // 5. Tính phí ship theo km
    let shippingFee;
    if (afterDiscount >= FREE_SHIP_THRESHOLD) {
      shippingFee = 0;
    } else {
      const result = getShippingFee(shipping.ward);
      shippingFee = result.fee;
    }

    const total = afterDiscount + shippingFee;

    // 6. Map paymentMethod — MOMO giờ có enum riêng, không còn bị gộp vào VNPAY
    const methodMap = {
      cod: "COD",
      vnpay: "VNPAY",
      momo: "MOMO",
      card: "STRIPE",
    };
    const prismaMethod = methodMap[paymentMethod] || "COD";
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

      // Tăng lượt dùng coupon (nếu có)
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Giảm stock theo variant (bỏ qua hàng không giới hạn)
      for (const item of cart.items) {
        if (item.variant.isUnlimitedStock) continue;
        await tx.bookVariant.update({
          where: { id: item.variant.id },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
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