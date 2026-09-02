const prisma = require("../config/db");
const { sendTicketReplyEmail } = require("../services/emailService");

const VALID_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({ success: false, message: "Lỗi server" });
}

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
};

//  GET /admin/tickets — danh sách đầy đủ, staff/admin đều xem được
exports.getTickets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const status = req.query.status?.trim();
    const subject = req.query.subject?.trim();
    const search = req.query.search?.trim();
    const assignedToId = req.query.assignedToId?.trim();

    const where = {
      ...(status && VALID_STATUSES.includes(status) ? { status } : {}),
      ...(subject ? { subject } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [tickets, total, statusCounts] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: staffSelect },
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const counts = VALID_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    statusCounts.forEach((row) => {
      counts[row.status] = row._count._all;
    });

    return res.json({
      success: true,
      data: {
        tickets,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        page,
        counts,
      },
    });
  } catch (err) {
    return serverError(res, err, "getTickets");
  }
};

//  GET /admin/tickets/:id — chi tiết ticket + toàn bộ lịch sử phản hồi
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: staffSelect },
        user: { select: { id: true, name: true, email: true, phone: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { staff: { select: staffSelect } },
        },
      },
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu liên hệ" });
    }

    return res.json({ success: true, data: ticket });
  } catch (err) {
    return serverError(res, err, "getTicketById");
  }
};

//  PATCH /admin/tickets/:id/status — cập nhật trạng thái xử lý
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status },
      include: { assignedTo: { select: staffSelect } },
    });

    return res.json({
      success: true,
      message: "Đã cập nhật trạng thái",
      data: ticket,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu liên hệ" });
    }
    return serverError(res, err, "updateTicketStatus");
  }
};

//  PATCH /admin/tickets/:id/assign — phân công staff/admin phụ trách
exports.assignTicket = async (req, res) => {
  try {
    const { assignedToId } = req.body;

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
      });
      if (!assignee || !["STAFF", "ADMIN"].includes(assignee.role)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Người được phân công không hợp lệ",
          });
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { assignedToId: assignedToId || null },
      include: { assignedTo: { select: staffSelect } },
    });

    // Nếu ticket đang ở trạng thái NEW mà vừa được nhận việc thì tự chuyển IN_PROGRESS
    if (assignedToId && ticket.status === "NEW") {
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "IN_PROGRESS" },
        include: { assignedTo: { select: staffSelect } },
      });
      return res.json({
        success: true,
        message: "Đã phân công",
        data: updated,
      });
    }

    return res.json({ success: true, message: "Đã phân công", data: ticket });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu liên hệ" });
    }
    return serverError(res, err, "assignTicket");
  }
};

//  POST /admin/tickets/:id/reply — staff/admin phản hồi
exports.replyToTicket = async (req, res) => {
  try {
    const { message, nextStatus } = req.body;
    if (!message?.trim()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nội dung phản hồi không được để trống",
        });
    }
    if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu liên hệ" });
    }
    const resolvedStatus =
      nextStatus || (ticket.status === "NEW" ? "IN_PROGRESS" : ticket.status);

    const [reply, updatedTicket] = await prisma.$transaction([
      prisma.ticketReply.create({
        data: {
          ticketId: ticket.id,
          staffId: req.user.id,
          message: message.trim(),
        },
        include: { staff: { select: staffSelect } },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: resolvedStatus,
          // Nếu chưa ai nhận thì người phản hồi đầu tiên mặc nhiên là người phụ trách
          assignedToId: ticket.assignedToId || req.user.id,
        },
        include: { assignedTo: { select: staffSelect } },
      }),
    ]);

    let emailSent = false;
    try {
      await sendTicketReplyEmail({
        to: ticket.email,
        name: ticket.name,
        code: ticket.code,
        subject: ticket.subject,
        message: reply.message,
        staff: { name: req.user.name, email: req.user.email },
      });
      emailSent = true;
    } catch (err) {
      console.error("[sendTicketReplyEmail]", err);
    }

    if (emailSent) {
      await prisma.ticketReply.update({
        where: { id: reply.id },
        data: { emailSent: true },
      });
      reply.emailSent = true;
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Đã gửi phản hồi và thông báo email cho khách hàng"
        : "Đã lưu phản hồi nhưng gửi email thất bại — vui lòng kiểm tra lại cấu hình gửi mail",
      data: { reply, ticket: updatedTicket },
    });
  } catch (err) {
    return serverError(res, err, "replyToTicket");
  }
};
