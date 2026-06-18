const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Categories
  const nature = await prisma.category.upsert({
    where: { slug: 'thien-nhien' },
    update: {},
    create: { name: 'Thiên Nhiên', slug: 'thien-nhien', description: 'Khám phá thế giới tự nhiên', isActive: true }
  })
  const space = await prisma.category.upsert({
    where: { slug: 'vu-tru' },
    update: {},
    create: { name: 'Vũ Trụ', slug: 'vu-tru', description: 'Khám phá vũ trụ bao la', isActive: true }
  })
  const science = await prisma.category.upsert({
    where: { slug: 'khoa-hoc' },
    update: {},
    create: { name: 'Khoa Học', slug: 'khoa-hoc', description: 'Khoa học kỳ diệu', isActive: true }
  })

  // Books
  const books = [
    {
      title: 'Bí Mật Rừng Mưa',
      slug: 'bi-mat-rung-mua',
      description: 'Mở trang sách — rừng mưa hiện ra. Hơn 120 loài động thực vật nhiệt đới trỗi dậy sống động qua công nghệ AR thế hệ mới.',
      price: 450000, salePrice: 390000,
      stock: 100, sold: 247,
      ageMin: 6, ageMax: 12,
      language: 'VI/EN', pages: 128,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=900&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
      ],
      hasAR: true, hasAI: true, has3DAudio: true,
      isActive: true, isFeatured: true,
      categoryId: nature.id
    },
    {
      title: 'Đại Dương Huyền Bí',
      slug: 'dai-duong-huyen-bi',
      description: '80 loài sinh vật biển sâu trong môi trường AR sống động. Khám phá rạn san hô và đáy đại dương.',
      price: 380000, salePrice: 350000,
      stock: 80, sold: 47,
      ageMin: 6, ageMax: 12,
      language: 'VI/EN', pages: 112,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=900&q=80',
      images: [],
      hasAR: true, hasAI: true, has3DAudio: false,
      isActive: true, isFeatured: false,
      categoryId: nature.id
    },
    {
      title: 'Hành Trình Vũ Trụ',
      slug: 'hanh-trinh-vu-tru',
      description: 'Du hành qua 8 hành tinh với mô hình không gian 3D có âm thanh vòm.',
      price: 420000, salePrice: null,
      stock: 60, sold: 62,
      ageMin: 8, ageMax: 14,
      language: 'VI/EN', pages: 140,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=900&q=80',
      images: [],
      hasAR: true, hasAI: true, has3DAudio: true,
      isActive: true, isFeatured: true,
      categoryId: space.id
    },
    {
      title: 'Khủng Long Trỗi Dậy',
      slug: 'khung-long-troi-day',
      description: 'Hồi sinh 30 loài khủng long theo tỉ lệ thực trong phòng khách.',
      price: 460000, salePrice: null,
      stock: 40, sold: 114,
      ageMin: 6, ageMax: 12,
      language: 'VI/EN', pages: 120,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=900&q=80',
      images: [],
      hasAR: true, hasAI: false, has3DAudio: true,
      isActive: true, isFeatured: true,
      categoryId: nature.id
    },
    {
      title: 'Cơ Thể Con Người',
      slug: 'co-the-con-nguoi',
      description: 'Bóc tách cơ thể người qua mô hình AR tương tác độ nét cao.',
      price: 450000, salePrice: 390000,
      stock: 70, sold: 88,
      ageMin: 8, ageMax: 14,
      language: 'VI/EN', pages: 136,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1537721664796-76f77222a5d0?w=900&q=80',
      images: [],
      hasAR: true, hasAI: true, has3DAudio: true,
      isActive: true, isFeatured: false,
      categoryId: science.id
    },
    {
      title: 'Côn Trùng Kỳ Diệu',
      slug: 'con-trung-ky-dieu',
      description: 'Phóng to 50 loài côn trùng tới kích thước khổng lồ, quan sát từng chi tiết.',
      price: 290000, salePrice: null,
      stock: 90, sold: 31,
      ageMin: 5, ageMax: 10,
      language: 'VI', pages: 96,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&q=80',
      images: [],
      hasAR: true, hasAI: false, has3DAudio: false,
      isActive: true, isFeatured: false,
      categoryId: nature.id
    },
    {
      title: 'Thực Vật Kỳ Bí',
      slug: 'thuc-vat-ky-bi',
      description: 'Quan sát quá trình thụ phấn và phát triển của 60 loài thực vật bằng hoạt hình AR.',
      price: 310000, salePrice: null,
      stock: 85, sold: 28,
      ageMin: 5, ageMax: 10,
      language: 'VI/EN', pages: 104,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1530983822321-fcac2d3c0f06?w=900&q=80',
      images: [],
      hasAR: true, hasAI: true, has3DAudio: false,
      isActive: true, isFeatured: false,
      categoryId: nature.id
    },
    {
      title: 'Khoa Học Kỳ Diệu',
      slug: 'khoa-hoc-ky-dieu',
      description: 'Khám phá các thí nghiệm khoa học thú vị qua mô hình AR sinh động.',
      price: 350000, salePrice: null,
      stock: 75, sold: 55,
      ageMin: 8, ageMax: 14,
      language: 'VI/EN', pages: 120,
      publisher: 'Earthoria Publishing',
      coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80',
      images: [],
      hasAR: true, hasAI: true, has3DAudio: false,
      isActive: true, isFeatured: false,
      categoryId: science.id
    },
  ]

  for (const book of books) {
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: {},
      create: book
    })
  }

  console.log('✅ Seed xong!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())