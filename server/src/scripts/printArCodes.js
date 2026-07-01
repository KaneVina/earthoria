// src/scripts/printArCodes.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const codes = await prisma.arCode.findMany({
    include: { book: true },
    orderBy: { createdAt: "desc" },
  });

  if (codes.length === 0) {
    console.log("Không có bản ghi ArCode nào trong DB.");
    return;
  }

  console.table(
    codes.map((c) => ({
      code: c.code,
      label: c.label,
      book: c.book?.title,
      bookSlug: c.book?.slug,
      modelUrl: c.modelUrl,
      isActive: c.isActive,
      scanCount: c.scanCount,
    }))
  );
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());