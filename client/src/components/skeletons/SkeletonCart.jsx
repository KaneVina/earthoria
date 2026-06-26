// components/skeletons/SkeletonCart.jsx
// Dùng trong Cart.jsx khi loading === true

export function SkeletonCartItem() {
  return (
    <div className="skeleton-cart-item">
      {/* Product col */}
      <div className="skeleton-cart-info">
        <span className="skeleton skeleton-cart-img" />
        <div className="skeleton-cart-text">
          <span className="skeleton skeleton-cart-tag" />
          <span className="skeleton skeleton-cart-title" />
          <span className="skeleton skeleton-cart-action" />
        </div>
      </div>

      {/* Qty */}
      <span className="skeleton skeleton-qty" />

      {/* Price */}
      <span className="skeleton skeleton-price" />

      {/* Delete */}
      <span className="skeleton skeleton-delete" />
    </div>
  )
}

export function SkeletonCartSummary() {
  return (
    <div className="skeleton-summary">
      <div className="skeleton-summary-header" />
      <div className="skeleton-summary-body">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-summary-line">
            <span className="skeleton skeleton-summary-label" />
            <span className="skeleton skeleton-summary-val" />
          </div>
        ))}
        <div style={{ height: 0.5, background: 'var(--border)', margin: '4px 0' }} />
        <div className="skeleton-summary-line">
          <span className="skeleton skeleton-summary-label" style={{ width: 80, height: 17 }} />
          <span className="skeleton skeleton-summary-total" />
        </div>
        <span className="skeleton skeleton-summary-btn" />
        <span className="skeleton skeleton-summary-btn" style={{ height: 44, marginTop: 0 }} />
      </div>
    </div>
  )
}