// src/controllers/emailController.js
const { Resend } = require('resend')
const { sendCustomEmail } = require('../services/emailService')
const prisma = require('../config/db')
const resend = new Resend(process.env.RESEND_API_KEY)

const isDev = process.env.NODE_ENV !== 'production'
function serverError(res, err, tag) {
  console.error(`[${tag}]`, err)
  return res.status(500).json({
    success: false,
    message: 'Lỗi server',
    ...(isDev ? { debug: err.message } : {}),
  })
}

/* ══════════════════════════════════════════════
   STATUS MAPPING (Resend "last_event" -> hiển thị VI)
══════════════════════════════════════════════ */
const STATUS_LABEL = {
  sent:             'Đã gửi',
  delivered:        'Đã nhận',
  delivery_delayed: 'Bị trễ',
  bounced:          'Trả về (bounce)',
  complained:       'Bị báo cáo spam',
  opened:           'Đã mở',
  clicked:          'Đã click',
  failed:           'Thất bại',
  canceled:         'Đã hủy',
  scheduled:        'Đã lên lịch',
}

function mapEmailItem(item) {
  return {
    id:        item.id,
    from:      item.from,
    to:        Array.isArray(item.to) ? item.to : [item.to].filter(Boolean),
    subject:   item.subject,
    status:    item.last_event || 'sent',
    statusLabel: STATUS_LABEL[item.last_event] || item.last_event || 'Đã gửi',
    createdAt: item.created_at,
  }
}

/* ══════════════════════════════════════════════
   GET /admin/emails — lịch sử email đã gửi
══════════════════════════════════════════════ */
exports.getEmailHistory = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const { data, error } = await resend.emails.list({ limit })

    if (error) {
      return res.status(400).json({ success: false, message: error.message || 'Không lấy được lịch sử email' })
    }

    const rawList = data?.data ?? []
    return res.json({
      success: true,
      data: {
        emails:  rawList.map(mapEmailItem),
        hasMore: data?.has_more ?? false,
      },
    })
  } catch (err) {
    return serverError(res, err, 'getEmailHistory')
  }
}

/* ══════════════════════════════════════════════
   GET /admin/emails/:id — chi tiết 1 email
══════════════════════════════════════════════ */
exports.getEmailDetail = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await resend.emails.get(id)

    if (error) {
      return res.status(404).json({ success: false, message: error.message || 'Không tìm thấy email' })
    }

    return res.json({
      success: true,
      data: {
        ...mapEmailItem(data),
        html:    data.html ?? null,
        text:    data.text ?? null,
        cc:      data.cc ?? [],
        bcc:     data.bcc ?? [],
        replyTo: data.reply_to ?? null,
      },
    })
  } catch (err) {
    return serverError(res, err, 'getEmailDetail')
  }
}

/* ══════════════════════════════════════════════
   GET /admin/emails/me
   Lấy thông tin tài khoản admin/staff đang đăng nhập để tự điền
   chữ ký — vì đã qua middleware protect + adminOnly nên chắc chắn
   là tài khoản đã xác thực.
   Field nào null thì frontend mới cho phép sửa, còn lại khoá cứng.
══════════════════════════════════════════════ */
exports.getSenderProfile = async (req, res) => {
  try {
    // req.user do middleware `protect` gán vào (giải mã từ JWT)
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, role: true },
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    // department chưa có field tương ứng trong schema User -> luôn null,
    // để admin/staff tự điền tay (không khoá field này).
    return res.json({
      success: true,
      data: {
        name:       user.name  ?? null,
        email:      user.email ?? null,
        phone:      user.phone ?? null,
        department: null,
        role:       user.role,
      },
    })
  } catch (err) {
    return serverError(res, err, 'getSenderProfile')
  }
}

/* ══════════════════════════════════════════════
   GET /admin/emails/customers?search=
   Gợi ý email khách hàng (role CUSTOMER) khi admin gõ vào ô "to"
══════════════════════════════════════════════ */
exports.searchCustomers = async (req, res) => {
  try {
    const search = req.query.search?.trim() ?? ''
    if (!search) {
      return res.json({ success: true, data: [] })
    }

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name:  { contains: search, mode: 'insensitive' } },
        ],
      },
      select: { name: true, email: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ success: true, data: customers })
  } catch (err) {
    return serverError(res, err, 'searchCustomers')
  }
}

/* ══════════════════════════════════════════════
   POST /admin/emails/send
   Gửi email thủ công — dùng chung template chuẩn (không nhận HTML thô)
   Body: {
     to, cc?, bcc?, subject, content,
     sender?: { name, department, phone, email }
   }
══════════════════════════════════════════════ */
function splitRecipients(input) {
  if (!input) return undefined
  if (Array.isArray(input)) return input
  return String(input).split(',').map(s => s.trim()).filter(Boolean)
}

exports.sendManualEmail = async (req, res) => {
  try {
    const { to, cc, bcc, subject, content, sender } = req.body

    if (!to || !subject || !content) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (to, subject, content)' })
    }

    const toList = splitRecipients(to)
    if (!toList?.length) {
      return res.status(400).json({ success: false, message: 'Người nhận không hợp lệ' })
    }

    const ccList  = splitRecipients(cc)
    const bccList = splitRecipients(bcc)

    // Bỏ qua sender nếu admin không điền gì
    const senderInfo = sender && (sender.name || sender.email) ? sender : null

    const { data, error } = await sendCustomEmail({
      to:      toList,
      cc:      ccList,
      bcc:     bccList,
      subject,
      heading: subject, // Tiêu đề nhập vào cũng là heading hiển thị trong email
      content,
      sender:  senderInfo,
    })

    if (error) {
      return res.status(400).json({ success: false, message: error.message || 'Gửi email thất bại' })
    }

    return res.status(201).json({
      success: true,
      message: 'Đã gửi email thành công',
      data,
    })
  } catch (err) {
    return serverError(res, err, 'sendManualEmail')
  }
}