// productFormUtils.js — dùng chung giữa ProductCreate.jsx và ProductDetail.jsx.
// Sau khi tách price/stock/productCode ra BookVariant, 1 sách (Book) có thể
// bán ở nhiều "định dạng" (PHYSICAL - sách giấy / DIGITAL - sách điện tử),
// mỗi định dạng có giá/tồn kho/mã sách riêng -> nằm trong form.variants[].

let keySeq = 0;
const clientKey = () => `v_${Date.now()}_${keySeq++}`;

export const FORMAT_LABEL = {
  PHYSICAL: "Sách giấy",
  DIGITAL: "Sách điện tử",
};

export const EMPTY_FORM = {
  title: "",
  authors: "",
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
  variants: [],
};

export const emptyVariant = (format) => ({
  _key: clientKey(),
  id: null,
  format,
  productCode: null, // chỉ có sau khi lưu, do server sinh
  unit: format === "DIGITAL" ? "Bản" : "Cuốn",
  price: "",
  stock: "",
  isUnlimitedStock: format === "DIGITAL",
  saleMode: "direct",
  salePrice: "",
  salePercent: "",
  dealerMode: "direct",
  dealerPrice: "",
  dealerPercent: "",
  isActive: true,
  sold: 0,
});

/* % giảm hiển thị dạng badge */
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

/* book (từ API, đã có variants[]) -> form state */
export const bookToForm = (product) => ({
  title: product.title ?? "",
  authors: (product.authors ?? []).join(", "),
  categoryId: product.categoryId ?? product.category?.id ?? "",
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
  variants: (product.variants ?? []).map((v) => ({
    _key: clientKey(),
    id: v.id,
    format: v.format,
    productCode: v.productCode ?? null,
    unit: v.unit ?? "Cuốn",
    price: v.price ?? "",
    stock: v.stock ?? "",
    isUnlimitedStock: v.isUnlimitedStock ?? false,
    saleMode: "direct",
    salePrice: v.salePrice ?? "",
    salePercent: "",
    dealerMode: "direct",
    dealerPrice: v.dealerPrice ?? "",
    dealerPercent: "",
    isActive: v.isActive ?? true,
    sold: v.sold ?? 0,
  })),
});

/* form state -> payload gửi API */
export const formToPayload = (form) => ({
  title: form.title,
  authors: form.authors,
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
  variants: form.variants.map((v) => {
    const basePrice = Number(v.price) || 0;
    return {
      ...(v.id ? { id: v.id } : {}),
      format: v.format,
      price: basePrice,
      salePrice: computeModePrice(v.saleMode, v.salePercent, v.salePrice, basePrice),
      dealerPrice: computeModePrice(v.dealerMode, v.dealerPercent, v.dealerPrice, basePrice),
      stock: Number(v.stock) || 0,
      unit: v.unit || "Cuốn",
      isUnlimitedStock: !!v.isUnlimitedStock,
      isActive: v.isActive !== false,
    };
  }),
});