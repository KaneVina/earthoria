const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { generateTicketCode } = require("../utils/generateTicketCode");
const { sendTicketCreatedEmail } = require("../services/emailService");

const VALID_SUBJECTS = [
  "PRODUCT_ADVICE",
  "BUSINESS",
  "TECHNICAL_SUPPORT",
  "FEEDBACK",
  "OTHER",
];
const VALID_CONTACT_METHODS = ["phone", "zalo", "email", "facebook"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* POST /api/v1/tickets*/
const createTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      subject,
      extraFields,
      message,
      contactMethods,
    } = req.body;

    // ─ Validate dữ liệu bắt buộc ─
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return formatResponse(
        res,
        400,
        "Vui lòng điền đầy đủ họ tên, email và tin nhắn",
      );
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return formatResponse(res, 400, "Email không hợp lệ");
    }
    if (!VALID_SUBJECTS.includes(subject)) {
      return formatResponse(res, 400, "Chủ đề yêu cầu không hợp lệ");
    }
    if (!Array.isArray(contactMethods) || contactMethods.length === 0) {
      return formatResponse(
        res,
        400,
        "Vui lòng chọn ít nhất một phương thức liên hệ",
      );
    }
    const cleanMethods = contactMethods.filter((m) =>
      VALID_CONTACT_METHODS.includes(m),
    );
    if (cleanMethods.length === 0) {
      return formatResponse(res, 400, "Phương thức liên hệ không hợp lệ");
    }

    // ─ Sinh mã ticket duy nhất: ETK-YYMMDD + 3 ký tự random ─
    const code = await generateTicketCode(prisma);

    const ticket = await prisma.ticket.create({
      data: {
        code,
        userId: req.user?.id || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        subject,
        extraFields:
          extraFields && typeof extraFields === "object"
            ? extraFields
            : undefined,
        message: message.trim(),
        contactMethods: cleanMethods,
      },
    });

    // ─ Gửi email xác nhận tự động — không chặn phản hồi API nếu gửi mail lỗi ─
    sendTicketCreatedEmail({
      to: ticket.email,
      name: ticket.name,
      code: ticket.code,
      subject: ticket.subject,
    }).catch((err) => console.error("[sendTicketCreatedEmail]", err));

    return formatResponse(res, 201, "Gửi yêu cầu liên hệ thành công", {
      code: ticket.code,
      status: ticket.status,
    });
  } catch (error) {
    console.error("[createTicket]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = { createTicket };
