// Pagination.jsx — Shared smart pagination for admin pages
// Usage:
//   <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} label="người dùng" />

import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Generates the page window to display.
 * Always shows: first, last, current ±2, with "…" gaps.
 * e.g. totalPages=20, page=8  →  [1, '…', 6, 7, 8, 9, 10, '…', 20]
 */
function buildPageWindow(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const delta = 2
  const left  = page - delta
  const right = page + delta

  const pages = new Set([1, totalPages])
  for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) {
    pages.add(p)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result = []

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i])
    const next = sorted[i + 1]
    if (next && next - sorted[i] > 1) {
      result.push('…')
    }
  }

  return result
}

export default function Pagination({ page, totalPages, onPageChange, total, label = 'mục' }) {
  if (totalPages <= 1 && !total) return null

  const window = buildPageWindow(page, totalPages)

  return (
    <div className="a-pagination">
      <span className="a-pagination-info">
        Tổng <strong style={{ color: 'var(--a-ink)' }}>{total}</strong> {label}
      </span>

      <div className="a-pagination-btns">
        {/* Prev */}
        <button
          className="a-page-btn"
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Trang trước"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Page numbers */}
        {window.map((item, i) =>
          item === '…' ? (
            <span
              key={`gap-${i}`}
              style={{
                padding: '0 4px',
                fontSize: 12,
                color: 'rgba(13,51,48,0.35)',
                userSelect: 'none',
                alignSelf: 'center',
              }}
            >
              …
            </span>
          ) : (
            <button
              key={item}
              className={`a-page-btn${item === page ? ' active' : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          className="a-page-btn"
          onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}