async function userOwnsBook(prisma, userId, bookId) {
  const owns = await prisma.orderItem.findFirst({
    where: {
      variant: { bookId },
      // DELIVERED = đang chờ khách xác nhận, COMPLETED = đã xác nhận nhận hàng — cả 2 đều coi là đã sở hữu.
      order: { userId, status: { in: ['DELIVERED', 'COMPLETED'] } },
    },
    select: { id: true },
  })
  return !!owns
}

module.exports = { userOwnsBook }