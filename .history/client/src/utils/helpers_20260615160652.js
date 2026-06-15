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

export const truncate = (str, n) => {
  return str?.length > n ? str.substr(0, n - 1) + '...' : str
}

export const getBookUrl = (slug, hashId) => `/books/${slug}/${hashId}`