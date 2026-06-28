const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_API_KEY)

async function verifyEmailTransport() {
  console.log('✓ Resend email service ready')
}

function wrapEmailTemplate({ preheader, bodyHtml, ctaUrl }) {
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
              Phòng IT
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:2;font-weight:300;font-family:'Be Vietnam Pro',Arial,sans-serif;">
              Liên hệ: <a href="mailto:helpdesk.earthoria@gmail.com"
                style="color:rgba(255,255,255,0.6);text-decoration:none;">helpdesk.earthoria@gmail.com</a><br>
              Số điện thoại: 0849 324 423<br>
              Địa chỉ: 123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh
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

// ─── OTP Email ───
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

  return resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: `${otp} — Mã xác thực Earthoria của bạn`,
    html: wrapEmailTemplate({
      preheader: `Mã xác thực của bạn: ${otp}. Hiệu lực trong 10 phút.`,
      bodyHtml,
    }),
  })
}

// ─── Password Changed Email ───
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

  return resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME || 'Earthoria'} <noreply@earthoria.id.vn>`,
    to,
    subject: 'Mật khẩu Earthoria của bạn đã được thay đổi',
    html: wrapEmailTemplate({
      preheader: 'Mật khẩu của bạn vừa được cập nhật thành công.',
      bodyHtml,
    }),
  })
}

module.exports = {
  verifyEmailTransport,
  sendOtpEmail,
  sendPasswordChangedEmail,
}