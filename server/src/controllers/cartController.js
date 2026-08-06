  const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { decodeId, encodeId } = require('../utils/hashids')

const CART_ITEM_INCLUDE = {
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

// Encode book.hashId + tính total. Dùng chung cho getCart và addToCart.
const buildCartResponse = (cart) => {
  const items = cart.items.map((item) => ({
    ...item,
    book: { ...item.book, hashId: encodeId(item.book.id) }
  }))
  const total = items.reduce((sum, item) => {
    const price = item.book.salePrice || item.book.price
    return sum + price * item.quantity
  }, 0)
  return { ...cart, items, total }
}

// Get cart
const getCart = async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: CART_ITEM_INCLUDE
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: CART_ITEM_INCLUDE
      })
    }

    return formatResponse(res, 200, 'OK', buildCartResponse(cart))
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const addToCart = async (req, res) => {
  try {
    const { hashId, quantity = 1 } = req.body
    const qty = parseInt(quantity)
    if (!qty || qty < 1) return formatResponse(res, 400, 'Số lượng không hợp lệ')

    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const updatedCart = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({
        where: { id: realId, isActive: true }
      })
      if (!book) throw Object.assign(new Error('BOOK_NOT_FOUND'), { code: 'BOOK_NOT_FOUND' })

      let cart = await tx.cart.findUnique({ where: { userId: req.user.id } })
      if (!cart) {
        cart = await tx.cart.create({ data: { userId: req.user.id } })
      }

      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: cart.id, bookId: book.id }
      })

      const newQty = existingItem ? existingItem.quantity + qty : qty
      if (book.stock < newQty) {
        throw Object.assign(new Error('OUT_OF_STOCK'), { code: 'OUT_OF_STOCK' })
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty }
        })
      } else {
        await tx.cartItem.create({
          data: { cartId: cart.id, bookId: book.id, quantity: newQty }
        })
      }

      return tx.cart.findUnique({
        where: { id: cart.id },
        include: CART_ITEM_INCLUDE
      })
    })

    return formatResponse(res, 200, 'Đã thêm vào giỏ hàng', buildCartResponse(updatedCart))
  } catch (error) {
    if (error.code === 'BOOK_NOT_FOUND') return formatResponse(res, 404, 'Không tìm thấy sách')
    if (error.code === 'OUT_OF_STOCK') return formatResponse(res, 400, 'Không đủ hàng trong kho')
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