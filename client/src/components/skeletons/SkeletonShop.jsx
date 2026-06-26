// components/skeletons/SkeletonShop.jsx
// Dùng trong Shop.jsx khi isLoading === true

export function SkeletonProductCard() {
  return (
    <div className="skeleton-product-card">
      <span className="skeleton skeleton-product-img" />
      <div className="skeleton-product-body">
        <span className="skeleton skeleton-product-rating" />
        <span className="skeleton skeleton-product-title" />
        <span className="skeleton skeleton-product-title2" />
        <span className="skeleton skeleton-product-desc1" />
        <span className="skeleton skeleton-product-desc2" />
        <span className="skeleton skeleton-product-tag" />
      </div>
      <div className="skeleton-product-footer">
        <span className="skeleton skeleton-product-price" />
        <span className="skeleton skeleton-product-btn" />
      </div>
    </div>
  )
}

// Render N cards skeleton (default 6)
export function SkeletonProductGrid({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </>
  )
}