export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(date))
}

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export const truncate = (str, n) => {
  return str?.length > n ? str.substr(0, n - 1) + '...' : str
}

export const getBookUrl = (slug, hashId) => `/books/${slug}/${hashId}`

const ORDER_CODE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// Mã đơn hiển thị dạng ODE-aabbccdef: aa = tháng, bb = ngày, cc = 2 số cuối năm đặt đơn,
// def = 3 ký tự chữ/số sinh ổn định từ id đơn (cùng 1 đơn luôn ra cùng 1 mã, không đổi theo lần render).
// PHẢI khớp 100% với hàm getOrderCode() bên BE (server/src/controllers/orderController.js) vì
// dùng để xác nhận huỷ đơn.
export const getOrderCode = (order) => {
  if (!order) return ''
  if (order.orderCode) return order.orderCode
  const d = new Date(order.createdAt || Date.now())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const seed = String(order.id || '')
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  let suffix = ''
  for (let i = 0; i < 3; i++) {
    suffix += ORDER_CODE_CHARS[hash % ORDER_CODE_CHARS.length]
    hash = Math.floor(hash / ORDER_CODE_CHARS.length) + i + 1
  }
  return `ODE-${mm}${dd}${yy}${suffix}`
}