const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { books: true } } }
    })
    return formatResponse(res, 200, 'OK', categories)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const getCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug }
    })
    if (!category) return formatResponse(res, 404, 'Không tìm thấy danh mục')
    return formatResponse(res, 200, 'OK', category)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { getCategories, getCategory }