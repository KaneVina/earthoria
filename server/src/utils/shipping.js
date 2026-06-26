// Tọa độ kho: FPT University Cần Thơ
const WAREHOUSE = { lat: 10.0124518, lng: 105.7324316 }

// Bán kính nội ô Cần Thơ (km) — dựa theo ranh giới TP. Cần Thơ
const NOI_O_RADIUS_KM = 15

// Bảng phí
const SHIPPING_TABLE = {
  noiO: { fee: 15_000, label: 'Nội ô Cần Thơ' },
  ngoaiO: [
    { maxKm: 10,  fee: 25_000 },
    { maxKm: 30,  fee: 35_000 },
    { maxKm: 60,  fee: 45_000 },
    { maxKm: 100, fee: 55_000 },
    { maxKm: 200, fee: 70_000 },
    { maxKm: 500, fee: 90_000 },
    { maxKm: Infinity, fee: 120_000 },
  ]
}

/**
 * Tính khoảng cách đường chim bay (Haversine) — dùng khi OSRM lỗi
 */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Tính phí ship dựa vào lat/lng người dùng
 * @param {number} lat
 * @param {number} lng
 * @param {number} km - km thực từ OSRM (optional, nếu null dùng haversine)
 * @returns {{ km, fee, isNoiO, label }}
 */
function calcShippingFee(lat, lng, kmFromOSRM = null) {
  const km = kmFromOSRM !== null
    ? kmFromOSRM
    : parseFloat(haversine(WAREHOUSE.lat, WAREHOUSE.lng, lat, lng).toFixed(1))

  const isNoiO = km <= NOI_O_RADIUS_KM

  let fee
  if (isNoiO) {
    fee = SHIPPING_TABLE.noiO.fee
  } else {
    const tier = SHIPPING_TABLE.ngoaiO.find(t => km <= t.maxKm)
    fee = tier ? tier.fee : 120_000
  }

  return { km, fee, isNoiO, free: false }
}

module.exports = { calcShippingFee, WAREHOUSE, SHIPPING_TABLE, NOI_O_RADIUS_KM }