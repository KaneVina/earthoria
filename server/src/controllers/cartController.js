const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { decodeId } = require('../utils/hashids')

// Get cart
const getCart = async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true, title: true, slug: true,
                price: true, salePrice: true,
                coverImage: true, stock: true
              }
            }
          }
        }
      }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: { include: { book: true } } }
      })
    }

    const total = cart.items.reduce((sum, item) => {
      const price = item.book.salePrice || item.book.price
      return sum + price * item.quantity
    }, 0)

    return formatResponse(res, 200, 'OK', { ...cart, total })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { hashId, quantity = 1 } = req.body

    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const book = await prisma.book.findFirst({
      where: { id: realId, isActive: true }
    })
    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')
    if (book.stock < quantity) return formatResponse(res, 400, 'Không đủ hàng trong kho')

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, bookId: book.id }
    })

    if (existingItem) {
      const newQty = existingItem.quantity + parseInt(quantity)
      if (book.stock < newQty) return formatResponse(res, 400, 'Không đủ hàng trong kho')

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty }
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, bookId: book.id, quantity: parseInt(quantity) }
      })
    }

    return formatResponse(res, 200, 'Đã thêm vào giỏ hàng')
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Update quantity
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body
    const { itemId } = req.params

    if (quantity < 1) return formatResponse(res, 400, 'Số lượng không hợp lệ')

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } })
    if (!cart) return formatResponse(res, 404, 'Giỏ hàng không tồn tại')

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { book: true }
    })
    if (!item) return formatResponse(res, 404, 'Không tìm thấy sản phẩm trong giỏ')
    if (item.book.stock < quantity) return formatResponse(res, 400, 'Không đủ hàng trong kho')

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parseInt(quantity) }
    })

    return formatResponse(res, 200, 'Đã cập nhật giỏ hàng')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Remove item
const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } })
    if (!cart) return formatResponse(res, 404, 'Giỏ hàng không tồn tại')

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id }
    })

    return formatResponse(res, 200, 'Đã xóa sản phẩm khỏi giỏ')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } })
    if (!cart) return formatResponse(res, 404, 'Giỏ hàng không tồn tại')

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return formatResponse(res, 200, 'Đã xóa giỏ hàng')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart }