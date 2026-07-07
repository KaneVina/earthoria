// productFormUtils.js — dùng chung giữa ProductCreate.jsx và ProductDetail.jsx
// để 2 trang này luôn đồng bộ cấu trúc field, không lệch nhau khi sửa sau này.

export const EMPTY_FORM = {
  title: "",
  authors: "",
  price: "",
  saleMode: "direct",
  salePrice: "",
  salePercent: "",
  dealerMode: "direct",
  dealerPrice: "",
  dealerPercent: "",
  stock: "",
  categoryId: "",
  description: "",
  isVisible: true,
  publisher: "",
  pages: "",
  language: "VI",
  ageMin: "",
  ageMax: "",
  publishYear: "",
  dimensions: "",
  weightGrams: "",
  coverType: "",
  paperType: "",
};

/* % giảm hiển thị dạng badge, vd giá gốc 420.000 -> giá bán 260.400 => -38% */
export const calcDiscountPercent = (base, sale) => {
  const b = Number(base), s = Number(sale);
  if (!b || !s || s >= b) return 0;
  return Math.round((1 - s / b) * 100);
};

/* Tính giá cuối cùng theo mode: 'percent' (tính từ giá gốc) hoặc 'direct' (nhập thẳng) */
export const computeModePrice = (mode, percent, direct, basePrice) => {
  if (mode === "percent") {
    const pct = Number(percent) || 0;
    const base = Number(basePrice) || 0;
    if (!pct || !base) return null;
    return Math.round(base * (1 - pct / 100));
  }
  return direct !== "" && direct !== null && direct !== undefined
    ? Number(direct)
    : null;
};

/* book (từ API) -> form state, dùng khi mở trang chi tiết để edit */
export const bookToForm = (product) => ({
  title: product.title ?? "",
  authors: (product.authors ?? []).join(", "),
  price: product.price ?? "",
  saleMode: "direct",
  salePrice: product.salePrice ?? "",
  salePercent: "",
  dealerMode: "direct",
  dealerPrice: product.dealerPrice ?? "",
  dealerPercent: "",
  stock: product.stock ?? "",
  categoryId: product.categoryId ?? "",
  description: product.description ?? "",
  isVisible: product.isVisible ?? true,
  publisher: product.publisher ?? "",
  pages: product.pages ?? "",
  language: product.language ?? "VI",
  ageMin: product.ageMin ?? "",
  ageMax: product.ageMax ?? "",
  publishYear: product.publishYear ?? "",
  dimensions: product.dimensions ?? "",
  weightGrams: product.weightGrams ?? "",
  coverType: product.coverType ?? "",
  paperType: product.paperType ?? "",
});

/* form state -> payload gửi API */
export const formToPayload = (form) => {
  const basePrice = Number(form.price) || 0;
  const finalSalePrice = computeModePrice(
    form.saleMode,
    form.salePercent,
    form.salePrice,
    basePrice
  );
  const finalDealerPrice = computeModePrice(
    form.dealerMode,
    form.dealerPercent,
    form.dealerPrice,
    basePrice
  );

  return {
    title: form.title,
    authors: form.authors,
    price: basePrice,
    salePrice: finalSalePrice,
    dealerPrice: finalDealerPrice,
    stock: Number(form.stock) || 0,
    categoryId: form.categoryId,
    description: form.description,
    isVisible: form.isVisible,
    publisher: form.publisher,
    pages: form.pages ? Number(form.pages) : null,
    language: form.language,
    ageMin: form.ageMin !== "" ? Number(form.ageMin) : null,
    ageMax: form.ageMax !== "" ? Number(form.ageMax) : null,
    publishYear: form.publishYear ? Number(form.publishYear) : null,
    dimensions: form.dimensions,
    weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
    coverType: form.coverType,
    paperType: form.paperType,
  };
};