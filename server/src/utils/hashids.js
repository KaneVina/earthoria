const Hashids = require('hashids/cjs')

const hashids = new Hashids(process.env.HASH_SALT || 'earthoria_salt_2026', 6)

const encodeId = (id) => {
  // UUID -> number array -> hash
  const nums = Buffer.from(id.replace(/-/g, ''), 'hex')
  return hashids.encodeHex(id.replace(/-/g, ''))
}

const decodeId = (hash) => {
  const hex = hashids.decodeHex(hash)
  if (!hex) return null
  // Reformat thành UUID
  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

module.exports = { encodeId, decodeId }