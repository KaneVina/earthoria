async function userOwnsBook(prisma, userId, bookId) {
  const owns = await prisma.orderItem.findFirst({
    where: {
      bookId,
      order: { userId, status: 'DELIVERED' },
    },
    select: { id: true },
  })
  return !!owns
}

module.exports = { userOwnsBook }