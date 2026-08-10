const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_API_KEY)

async function sendMail(payload) {
  const { data, error } = await resend.emails.send(payload)
  if (error) {
    const err = new Error(error.message || 'Gửi email thất bại')
    err.name = 'ResendError'
    err.cause = error
    throw err
  }
  return data
}

async function verifyEmailTransport() {
  console.log('✓ Resend email service ready')
}

function wrapEmailTemplate({ preheader, bodyHtml, ctaUrl, footerDepartment = 'IT' }) {
  const logoUrl = process.env.EMAIL_LOGO_URL || ''
  const clientUrl = ctaUrl || process.env.CLIENT_URL || '#'

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Earthoria</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#eceae3;font-family:'Be Vietnam Pro',Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#eceae3;max-height:0;overflow:hidden;">${preheader}</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceae3;padding:40px 20px 56px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- HEADER -->
  <tr>
    <td style="background:#0b2e2b;padding:30px 40px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="${logoUrl}" alt="Earthoria" height="46" style="display:block;margin:0 auto;height:46px;width:auto;">
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#faf8f2;padding:48px 48px 0;">
      ${bodyHtml}
    </td>
  </tr>

  <!-- CTA BAND -->
  <tr>
    <td style="background:#f0f7ec;border-top:1px solid rgba(74,158,63,0.12);padding:36px 40px;text-align:center;">
      <div style="font-size:9.5px;letter-spacing:3px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:10px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        Earthoria Platform
      </div>
      <p style="font-size:15px;font-weight:500;color:#0b2e2b;margin:0 0 22px;line-height:1.5;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        Khám phá thư viện sách AR<br>của bạn ngay hôm nay
      </p>
      <a href="${clientUrl}"
         style="display:inline-block;background:#0b2e2b;color:#faf8f2;font-size:11.5px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;padding:14px 36px;border-radius:6px;text-decoration:none;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        Truy cập ngay
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0b2e2b;border-radius:0 0 12px 12px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:32px 40px 24px;">
            <img src="${logoUrl}" alt="Earthoria" height="28"
                 style="display:block;margin-bottom:18px;height:28px;width:auto;filter:brightness(0) invert(1);opacity:0.8;">
            <div style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:500;margin-bottom:14px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              Phòng ${footerDepartment}
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:2;font-weight:300;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              Liên hệ: <a href="mailto:helpdesk.earthoria@gmail.com"
                style="color:rgba(255,255,255,0.6);text-decoration:none;">helpdesk.earthoria@gmail.com</a><br>
              Số điện thoại: 0849 324 423<br>
              Địa chỉ: 600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ
            </div>
          </td>
        </tr>
        <tr>
          <td style="height:1px;background:rgba(255,255,255,0.06);padding:0 40px;">
            <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 40px 10px;font-size:11px;color:rgba(255,255,255,0.25);font-weight:300;font-style:italic;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Đây là email được gửi tự động. Vui lòng không phản hồi.
          </td>
        </tr>
        <tr>
          <td style="padding:10px 40px 20px;text-align:center;">
            <p style="font-size:10.5px;color:rgba(255,255,255,0.2);font-weight:300;margin:0;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              © 2026 Earthoria. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─ OTP Email ─
async function sendOtpEmail({ to, name, otp }) {
  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:28px;font-weight:600;color:#0b2e2b;line-height:1.2;margin:0 0 32px;text-align:center;letter-spacing:2px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Khôi Phục Mật Khẩu
    </h1>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 32px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã bên dưới để tiếp tục:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#fff;border:1px solid rgba(11,46,43,0.09);border-radius:10px;padding:32px 28px;text-align:center;">
          <div style="font-size:9.5px;letter-spacing:3px;text-transform:uppercase;color:#a0b8a8;font-weight:500;margin-bottom:20px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Mã xác thực của bạn
          </div>
          <div style="font-size:42px;font-weight:600;color:#0b2e2b;letter-spacing:16px;margin-bottom:22px;text-indent:16px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            ${otp}
          </div>
          <div style="display:inline-block;font-size:11.5px;color:#b8862e;background:rgba(184,134,46,0.07);padding:7px 18px;border-radius:100px;border:1px solid rgba(184,134,46,0.22);font-weight:400;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Hiệu lực trong 10 phút
          </div>
        </td>
      </tr>
    </table>

    <div style="background:rgba(74,158,63,0.04);border:1px solid rgba(74,158,63,0.14);border-radius:8px;padding:16px 20px;margin-bottom:32px;">
      <p style="font-size:12px;color:#5a6b60;line-height:1.85;font-weight:300;margin:0;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        <strong style="color:#0b2e2b;font-weight:500;">Lưu ý bảo mật:</strong>
        Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này và tài khoản của bạn được an toàn.
        Không chia sẻ mã này với bất kỳ ai và không chuyển tiếp email này, kể cả nhân viên Earthoria.
      </p>
    </div>
  `

  return sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: `${otp} — Mã xác thực Earthoria của bạn`,
    html: wrapEmailTemplate({
      preheader: `Mã xác thực của bạn: ${otp}. Hiệu lực trong 10 phút.`,
      bodyHtml,
    }),
  })
}

// ─ Password Changed Email ─
async function sendPasswordChangedEmail({ to, name }) {
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:28px;font-weight:600;color:#0b2e2b;line-height:1.2;margin:0 0 32px;text-align:center;letter-spacing:2px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Cập Nhật Mật Khẩu
    </h1>

    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(74,158,63,0.08);border:1px solid rgba(74,158,63,0.25);display:inline-block;line-height:52px;font-size:20px;color:#4a9e3f;text-align:center;">
        ✓
      </div>
    </div>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 24px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Mật khẩu tài khoản Earthoria của bạn vừa được cập nhật thành công vào lúc
      <strong style="color:#0b2e2b;font-weight:500;">${time}</strong>.
    </p>

    <div style="background:rgba(192,80,80,0.05);border:1px solid rgba(192,80,80,0.18);border-radius:8px;padding:16px 20px;margin-bottom:32px;">
      <p style="font-size:12px;color:#7a4440;line-height:1.85;font-weight:300;margin:0;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        <strong style="color:#5a2820;font-weight:500;">Không phải bạn thực hiện?</strong>
        Liên hệ ngay
        <a href="mailto:helpdesk.earthoria@gmail.com" style="color:#b25450;text-decoration:none;font-weight:500;">helpdesk.earthoria@gmail.com</a>
        để được hỗ trợ khẩn cấp.
      </p>
    </div>
  `

  return sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: 'Mật khẩu Earthoria của bạn đã được thay đổi',
    html: wrapEmailTemplate({
      preheader: 'Mật khẩu của bạn vừa được cập nhật thành công.',
      bodyHtml,
    }),
  })
}

const SIGNATURE_LOGO_URL = 'https://earthoria.id.vn/logo-chinh.png'

/**
 * Suy ra tên hiển thị từ phần trước @ của email.
 * vd: "nguyen.phuc.khang@fpt.edu.vn" -> "Nguyen Phuc Khang"
 *     "khangnpce181578@fpt.edu.vn"   -> "Khangnpce181578" (không tách được thì giữ nguyên, viết hoa chữ đầu)
 */
function nameFromEmail(email) {
  if (!email) return 'bạn'
  const local = email.split('@')[0]
  const parts = local.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'bạn'
  return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function buildSignatureBlock({ name, department, phone, email } = {}) {
  if (!name && !email) return ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 6px;">
      <tr>
        <td style="vertical-align:middle;padding-right:18px;">
          <img src="${SIGNATURE_LOGO_URL}" alt="Earthoria" height="42"
               style="display:block;height:42px;width:auto;">
        </td>
        <td style="border-left:1.5px solid rgba(11,46,43,0.15);padding-left:18px;vertical-align:middle;">
          ${name ? `
          <div style="font-size:14px;font-weight:600;color:#0b2e2b;margin-bottom:3px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            ${name}
          </div>` : ''}
          ${department ? `
          <div style="font-size:12px;font-weight:500;color:#4a9e3f;margin-bottom:8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Phòng ${department} — Earthoria
          </div>` : ''}
          ${phone ? `
          <div style="font-size:12px;color:#5a6b60;line-height:1.8;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            <strong style="color:#0b2e2b;font-weight:500;">Mobile:</strong> ${phone}
          </div>` : ''}
          ${email ? `
          <div style="font-size:12px;color:#5a6b60;line-height:1.8;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            <strong style="color:#0b2e2b;font-weight:500;">Email:</strong>
            <a href="mailto:${email}" style="color:#1a5a9e;text-decoration:none;">${email}</a>
          </div>` : ''}
        </td>
      </tr>
    </table>
  `
}

// Regex bắt link http/https trong nội dung admin gõ (chặn ký tự ) ] " ' cuối để tránh dính dấu câu)
const URL_REGEX = /(https?:\/\/[^\s<>"'\)\]]+)/g

/**
 * Render 1 link thành nút bấm "Xem ngay"
 */
function renderLinkButton(url) {
  return `
    <div style="text-align:center;margin:4px 0 24px;">
      <a href="${url}"
         style="display:inline-block;background:#0b2e2b;color:#faf8f2;font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;padding:13px 34px;border-radius:6px;text-decoration:none;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        Xem ngay
      </a>
    </div>`
}

/**
 * Build phần nội dung (bodyHtml) cho email soạn thủ công từ admin.
 * @param {string} heading      - Tiêu đề hiển thị (vd: "Thông Báo Bảo Trì")
 * @param {string} greetingName - Tên người nhận (tự suy ra từ email)
 * @param {string} bodyText     - Nội dung admin gõ (plain text, có thể nhiều đoạn cách nhau bằng dòng trống).
 *                                 Nếu trong đoạn có chứa link http(s), link sẽ tự động được tách ra
 *                                 và hiển thị thành nút "Xem ngay" để click vào xem.
 * @param {object} sender       - { name, department, phone, email }
 */
function buildCustomEmailBody({ heading, greetingName, bodyText, sender }) {
  const paragraphs = (bodyText || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      // Tách các link ra khỏi đoạn văn
      const links = p.match(URL_REGEX) || []
      const textOnly = p
        .replace(URL_REGEX, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()

      const textHtml = textOnly
        ? `<p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 16px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
             ${textOnly.replace(/\n/g, '<br>')}
           </p>`
        : ''

      // Mỗi link tìm được sẽ thành 1 nút "Xem ngay"
      const buttonsHtml = links.map(renderLinkButton).join('')

      return textHtml + buttonsHtml
    })
    .join('')

  return `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      ${heading}
    </h1>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${greetingName}.
    </p>

    ${paragraphs}

    <p style="font-size:13.5px;color:#0b2e2b;font-weight:500;margin:24px 0 4px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Trân trọng,
    </p>
    ${buildSignatureBlock(sender)}
  `
}

/**
 * Dựng HTML hoàn chỉnh cho email thủ công — dùng chung cho cả gửi thật (sendCustomEmail)
 * và xem trước (preview), để đảm bảo preview luôn khớp 100% với email thật sự được gửi.
 * @param {string|string[]} to - người nhận đầu tiên dùng để suy ra tên chào (nếu không truyền greetingName)
 */
function renderCustomEmailHtml({ to, subject, heading, content, sender, greetingName: greetingNameOverride }) {
  const firstTo = Array.isArray(to) ? to[0] : String(to || '').split(',')[0].trim()
  const greetingName = greetingNameOverride || nameFromEmail(firstTo)

  return wrapEmailTemplate({
    preheader: subject,
    footerDepartment: (sender && sender.department) || 'IT',
    bodyHtml: buildCustomEmailBody({
      heading: heading || subject,
      greetingName,
      bodyText: content,
      sender,
    }),
  })
}

/**
 * Gửi email tuỳ chỉnh do admin soạn (dùng chung layout wrapEmailTemplate có sẵn).
 * Footer sẽ tự lấy tên phòng ban theo sender.department (nếu admin không nhập thì mặc định "IT").
 */
async function sendCustomEmail({ to, cc, bcc, subject, heading, content, sender }) {
  const html = renderCustomEmailHtml({ to, subject, heading, content, sender })

  const payload = {
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject,
    html,
  }
  if (cc)  payload.cc  = cc
  if (bcc) payload.bcc = bcc

  return sendMail(payload)
}

const ROLE_LABEL_VI = {
  CUSTOMER: 'Khách hàng',
  DEALER: 'Đại lý (Dealer)',
  STAFF: 'Nhân viên (Staff)',
  ADMIN: 'Quản trị viên',
}

// Icon triangle-alert (Lucide), nhúng trực tiếp SVG vì email client không load icon font/JS được
const ALERT_TRIANGLE_ICON = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b23a30" stroke-width="2.2"
       stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;display:inline-block;">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
`

function buildSystemSignatureBlock() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 6px;">
      <tr>
        <td style="vertical-align:middle;padding-right:18px;">
          <img src="${SIGNATURE_LOGO_URL}" alt="Earthoria" height="42"
               style="display:block;height:42px;width:auto;">
        </td>
        <td style="border-left:1.5px solid rgba(11,46,43,0.15);padding-left:18px;vertical-align:middle;">
          <div style="font-size:14px;font-weight:600;color:#0b2e2b;margin-bottom:3px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Earthoria System
          </div>
          <div style="font-size:12px;font-weight:500;color:#4a9e3f;margin-bottom:8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Phòng ITD | IT Department
          </div>
          <div style="font-size:12px;color:#5a6b60;line-height:1.8;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            <strong style="color:#0b2e2b;font-weight:500;">Email:</strong>
            <a href="mailto:helpdesk.earthoria@gmail.com" style="color:#1a5a9e;text-decoration:none;">helpdesk.earthoria@gmail.com</a>
          </div>
        </td>
      </tr>
    </table>
  `
}

async function sendAccountProvisionedEmail({ to, role, name, userCode, password, dateIssued, isUpgrade }) {
  const dateStr = dateIssued.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const heading = isUpgrade ? 'Tài Khoản Đã Được Nâng Cấp' : 'Chào Mừng Đến Với Earthoria'
  const roleLabel = ROLE_LABEL_VI[role] || role
  const changePasswordUrl = 'https://www.earthoria.id.vn/forgot-password'

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      ${heading}
    </h1>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 28px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      ${isUpgrade
        ? `Tài khoản của bạn vừa được nâng cấp lên vai trò <strong style="color:#0b2e2b;font-weight:500;">${roleLabel}</strong> trên hệ thống Earthoria. Dưới đây là thông tin đăng nhập mới của bạn.`
        : `Một tài khoản với vai trò <strong style="color:#0b2e2b;font-weight:500;">${roleLabel}</strong> vừa được khởi tạo cho bạn trên hệ thống Earthoria. Vui lòng lưu lại thông tin đăng nhập bên dưới.`
      }
    </p>

    <!-- THÔNG TIN TÀI KHOẢN -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#fff;border:1px solid rgba(11,46,43,0.09);border-radius:10px;overflow:hidden;">
          <div style="background:#f0f7ec;padding:14px 28px;border-bottom:1px solid rgba(11,46,43,0.06);">
            <div style="font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:#4a9e3f;font-weight:600;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              Thông tin tài khoản
            </div>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:6px 0;">
            <tr>
              <td style="padding:12px 28px;font-size:12.5px;color:#8a9690;font-weight:400;width:38%;font-family:'Be Vietnam Pro',Arial,sans-serif;">Vai trò</td>
              <td style="padding:12px 28px 12px 0;font-size:13px;color:#0b2e2b;font-weight:500;font-family:'Be Vietnam Pro',Arial,sans-serif;">${roleLabel}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px;font-size:12.5px;color:#8a9690;font-weight:400;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">Họ và tên</td>
              <td style="padding:12px 28px 12px 0;font-size:13px;color:#0b2e2b;font-weight:500;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px;font-size:12.5px;color:#8a9690;font-weight:400;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">Email đăng nhập</td>
              <td style="padding:12px 28px 12px 0;font-size:13px;color:#0b2e2b;font-weight:500;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">${to}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px;font-size:12.5px;color:#8a9690;font-weight:400;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">Mã định danh (ETR)</td>
              <td style="padding:12px 28px 12px 0;font-size:13px;color:#0b2e2b;font-weight:500;letter-spacing:0.5px;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">${userCode}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px;font-size:12.5px;color:#8a9690;font-weight:400;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">Ngày cấp</td>
              <td style="padding:12px 28px 12px 0;font-size:13px;color:#0b2e2b;font-weight:500;border-top:1px solid rgba(11,46,43,0.05);font-family:'Be Vietnam Pro',Arial,sans-serif;">${dateStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- MẬT KHẨU TẠM THỜI -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#faf8f2;border:1.5px dashed rgba(11,46,43,0.25);border-radius:10px;padding:24px 28px;text-align:center;">
          <div style="font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:#a0b8a8;font-weight:600;margin-bottom:12px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Mật khẩu tạm thời
          </div>
          <div style="font-size:24px;font-weight:600;color:#0b2e2b;letter-spacing:2px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            ${password}
          </div>
        </td>
      </tr>
    </table>

    <!-- CẢNH BÁO BẢO MẬT + NÚT ĐỔI MẬT KHẨU -->
    <div style="background:rgba(192,80,80,0.05);border:1px solid rgba(192,80,80,0.18);border-radius:8px;padding:20px 22px;margin-bottom:8px;">
      <p style="font-size:13px;color:#5a2820;font-weight:600;margin:0 0 10px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        ${ALERT_TRIANGLE_ICON}Lưu ý bảo mật quan trọng
      </p>
      <p style="font-size:12px;color:#7a4440;line-height:1.9;font-weight:300;margin:0 0 18px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        Vì lý do an toàn, vui lòng đổi mật khẩu ngay trong lần đăng nhập đầu tiên. Không chia sẻ thông tin đăng nhập này với bất kỳ ai, kể cả nhân viên Earthoria. Nếu bạn không yêu cầu thao tác này, vui lòng liên hệ ngay với chúng tôi để được hỗ trợ.
      </p>
      <div style="text-align:center;">
        <a href="${changePasswordUrl}"
           style="display:inline-block;background:#b23a30;color:#fff8f6;font-size:11.5px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;padding:12px 30px;border-radius:6px;text-decoration:none;font-family:'Be Vietnam Pro',Arial,sans-serif;">
          Đổi mật khẩu ngay
        </a>
      </div>
    </div>

    ${buildSystemSignatureBlock()}
  `

  return sendMail({
    from: `Earthoria System <noreply@earthoria.id.vn>`,
    to,
    subject: isUpgrade
      ? `Tài khoản của bạn đã được nâng cấp lên ${roleLabel}`
      : `Tài khoản ${roleLabel} của bạn đã sẵn sàng`,
    html: wrapEmailTemplate({
      preheader: isUpgrade
        ? 'Tài khoản của bạn vừa được nâng cấp — xem thông tin đăng nhập mới.'
        : 'Tài khoản mới của bạn đã được khởi tạo — xem thông tin đăng nhập.',
      bodyHtml,
      ctaUrl: 'https://www.earthoria.id.vn',
      footerDepartment: 'ITD',
    }),
  })
}

async function sendAccountLockedEmail({ to, name, reason, dateLocked }) {
  const dateStr = (dateLocked || new Date()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Tài Khoản Đã Bị Khóa
    </h1>

    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(192,80,80,0.08);border:1px solid rgba(192,80,80,0.25);display:inline-block;line-height:52px;font-size:20px;color:#b23a30;text-align:center;">
        !
      </div>
    </div>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 24px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Tài khoản Earthoria của bạn vừa bị <strong style="color:#0b2e2b;font-weight:500;">khóa</strong> vào lúc
      <strong style="color:#0b2e2b;font-weight:500;">${dateStr}</strong>. Bạn sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa trở lại.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fff;border:1px solid rgba(11,46,43,0.09);border-radius:10px;overflow:hidden;">
          <div style="background:#faf1ef;padding:14px 28px;border-bottom:1px solid rgba(11,46,43,0.06);">
            <div style="font-size:9.5px;letter-spacing:2.5px;text-transform:uppercase;color:#b23a30;font-weight:600;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              Lý do khóa tài khoản
            </div>
          </div>
          <div style="padding:16px 28px;font-size:13px;color:#0b2e2b;line-height:1.8;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            ${reason}
          </div>
        </td>
      </tr>
    </table>

    <div style="background:rgba(192,80,80,0.05);border:1px solid rgba(192,80,80,0.18);border-radius:8px;padding:16px 20px;margin-bottom:8px;">
      <p style="font-size:12px;color:#7a4440;line-height:1.85;font-weight:300;margin:0;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        <strong style="color:#5a2820;font-weight:500;">Bạn nghĩ đây là nhầm lẫn?</strong>
        Liên hệ ngay
        <a href="mailto:helpdesk.earthoria@gmail.com" style="color:#b25450;text-decoration:none;font-weight:500;">helpdesk.earthoria@gmail.com</a>
        để được hỗ trợ.
      </p>
    </div>

    ${buildSystemSignatureBlock()}
  `

  return sendMail({
    from: `Earthoria System <noreply@earthoria.id.vn>`,
    to,
    subject: 'Tài khoản Earthoria của bạn đã bị khóa',
    html: wrapEmailTemplate({
      preheader: 'Tài khoản của bạn vừa bị khóa — xem lý do chi tiết.',
      bodyHtml,
      footerDepartment: 'ITD',
    }),
  })
}

async function sendAccountUnlockedEmail({ to, name, dateUnlocked }) {
  const dateStr = (dateUnlocked || new Date()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Tài Khoản Đã Được Mở Khóa
    </h1>

    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(74,158,63,0.08);border:1px solid rgba(74,158,63,0.25);display:inline-block;line-height:52px;font-size:20px;color:#4a9e3f;text-align:center;">
        ✓
      </div>
    </div>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 24px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Tài khoản Earthoria của bạn đã được <strong style="color:#0b2e2b;font-weight:500;">mở khóa</strong> vào lúc
      <strong style="color:#0b2e2b;font-weight:500;">${dateStr}</strong>. Bạn có thể đăng nhập và sử dụng bình thường trở lại.
    </p>

    ${buildSystemSignatureBlock()}
  `

  return sendMail({
    from: `Earthoria System <noreply@earthoria.id.vn>`,
    to,
    subject: 'Tài khoản Earthoria của bạn đã được mở khóa',
    html: wrapEmailTemplate({
      preheader: 'Tài khoản của bạn vừa được mở khóa.',
      bodyHtml,
      footerDepartment: 'ITD',
    }),
  })
}
// ─ Ticket: Xác nhận đã tiếp nhận yêu cầu liên hệ ─
const TICKET_SUBJECT_LABEL_VI = {
  PRODUCT_ADVICE: 'Tư vấn sản phẩm',
  BUSINESS: 'Hợp tác kinh doanh',
  TECHNICAL_SUPPORT: 'Hỗ trợ kỹ thuật',
  FEEDBACK: 'Phản hồi / Góp ý',
  OTHER: 'Khác',
}

async function sendTicketCreatedEmail({ to, name, code, subject }) {
  const subjectLabel = TICKET_SUBJECT_LABEL_VI[subject] || subject

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Đã Tiếp Nhận Yêu Cầu
    </h1>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 28px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Chúng tôi đã nhận được yêu cầu liên hệ của bạn về chủ đề
      <strong style="color:#0b2e2b;font-weight:500;">${subjectLabel}</strong>.
      Đội ngũ Earthoria sẽ phản hồi trong vòng 24 giờ làm việc.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fff;border:1px solid rgba(11,46,43,0.09);border-radius:10px;padding:28px;text-align:center;">
          <div style="font-size:9.5px;letter-spacing:3px;text-transform:uppercase;color:#a0b8a8;font-weight:500;margin-bottom:16px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            Mã yêu cầu của bạn
          </div>
          <div style="font-size:26px;font-weight:600;color:#0b2e2b;letter-spacing:2px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
            ${code}
          </div>
        </td>
      </tr>
    </table>

    <div style="background:rgba(74,158,63,0.04);border:1px solid rgba(74,158,63,0.14);border-radius:8px;padding:16px 20px;margin-bottom:8px;">
      <p style="font-size:12px;color:#5a6b60;line-height:1.85;font-weight:300;margin:0;font-family:'Be Vietnam Pro',Arial,sans-serif;">
        <strong style="color:#0b2e2b;font-weight:500;">Lưu ý:</strong>
        Vui lòng lưu lại mã trên để tiện tra cứu khi cần trao đổi thêm với chúng tôi.
      </p>
    </div>
  `

  return sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: `[${code}] Đã tiếp nhận yêu cầu liên hệ của bạn`,
    html: wrapEmailTemplate({
      preheader: `Mã yêu cầu của bạn: ${code}. Chúng tôi sẽ phản hồi trong 24 giờ.`,
      bodyHtml,
    }),
  })
}

// ─ Ticket: Thông báo staff/admin vừa phản hồi ─
async function sendTicketReplyEmail({ to, name, code, subject, message, staff }) {
  const subjectLabel = TICKET_SUBJECT_LABEL_VI[subject] || subject
  const messageHtml = String(message || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 14px;font-family:'Be Vietnam Pro',Arial,sans-serif;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const bodyHtml = `
    <div style="font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#8fb09a;font-weight:500;margin-bottom:12px;text-align:center;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Thông báo hệ thống
    </div>
    <h1 style="font-size:26px;font-weight:600;color:#0b2e2b;line-height:1.3;margin:0 0 28px;text-align:center;letter-spacing:1px;text-transform:uppercase;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Earthoria Đã Phản Hồi
    </h1>

    <p style="font-size:14px;color:#0b2e2b;font-weight:500;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Xin chào, ${name || 'bạn'}.
    </p>
    <p style="font-size:13.5px;color:#5a6b60;line-height:1.9;font-weight:300;margin:0 0 24px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Yêu cầu <strong style="color:#0b2e2b;font-weight:500;">${code}</strong>
      (${subjectLabel}) của bạn vừa nhận được phản hồi mới từ đội ngũ Earthoria:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#faf8f2;border-left:3px solid #4a9e3f;border-radius:0 8px 8px 0;padding:20px 24px;">
          ${messageHtml}
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#8a9690;line-height:1.8;font-weight:300;margin:0 0 8px;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      Nếu cần trao đổi thêm, vui lòng phản hồi lại email này hoặc liên hệ
      <a href="mailto:helpdesk.earthoria@gmail.com" style="color:#1a5a9e;text-decoration:none;">helpdesk.earthoria@gmail.com</a>
      và nhắc mã yêu cầu <strong style="color:#0b2e2b;">${code}</strong>.
    </p>

    ${staff && (staff.name || staff.email) ? buildSignatureBlock(staff) : ''}
  `

  return sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: `[${code}] Earthoria vừa phản hồi yêu cầu của bạn`,
    html: wrapEmailTemplate({
      preheader: `Yêu cầu ${code} của bạn vừa có phản hồi mới.`,
      bodyHtml,
    }),
  })
}

module.exports = {
  verifyEmailTransport,
  sendOtpEmail,
  sendPasswordChangedEmail,
  sendCustomEmail,
  renderCustomEmailHtml,
  nameFromEmail,
  sendAccountProvisionedEmail,
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
}