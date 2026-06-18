const { PrismaClient } = require('@prisma/client')
const { encodeId } = require('./src/utils/hashids')
const p = new PrismaClient()

p.book.findFirst({ where: { slug: 'dai-duong-huyen-bi' } }).then(b => {
  console.log('hashId:', encodeId(b.id))
  process.exit()
})