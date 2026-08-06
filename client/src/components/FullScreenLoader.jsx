export default function FullScreenLoader({
  eyebrow = 'Vui lòng chờ',
  message = 'Đang khôi phục phiên làm việc...',
}) {
  return (
    <div className="fsl-root">
      <span className="fsl-orb fsl-orb-1" aria-hidden="true" />
      <span className="fsl-orb fsl-orb-2" aria-hidden="true" />

      <div className="fsl-content" role="status" aria-live="polite">
        <span className="fsl-spinner" aria-hidden="true">
          <span className="fsl-glow" />
          <span className="fsl-ring-static" />
          <span className="fsl-ring-track" />
          <img className="fsl-logo" src="/logo-nho.png" alt="" />
        </span>

        {eyebrow && (
          <div className="fsl-eyebrow">
            <span className="fsl-eyebrow-line" />
            <span className="fsl-eyebrow-text">{eyebrow}</span>
            <span className="fsl-eyebrow-line" />
          </div>
        )}

        <p className="fsl-message">{message}</p>
      </div>

      <style>{`
        .fsl-root {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          /* Fade in cả màn hình (kể cả nền/orb) khi loader xuất hiện, thay vì
             hiện đột ngột (pop). Vì loader này chỉ mount sau 300ms delay ở
             App.jsx nên animation này không làm chậm trải nghiệm. */
          animation: fsl-root-in 0.35s ease-out both;
        }
        @keyframes fsl-root-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* --- ambient background glow (matches auth-orb / stats-section feel) --- */
        .fsl-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          opacity: 0.35;
          animation: fsl-orb-float 9s ease-in-out infinite;
        }
        .fsl-orb-1 {
          width: 260px;
          height: 260px;
          background: rgba(46,139,87,0.16);
          top: 18%;
          left: 20%;
          animation-delay: 0s;
        }
        .fsl-orb-2 {
          width: 200px;
          height: 200px;
          background: rgba(13,92,99,0.18);
          bottom: 18%;
          right: 20%;
          animation-delay: -4s;
        }
        @keyframes fsl-orb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }

        .fsl-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
          padding: 40px 48px;
          animation: fsl-content-in 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes fsl-content-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- spinner: layered rings around a still, breathing logo --- */
        .fsl-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
        }

        .fsl-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(46,139,87,0.35) 0%, transparent 70%);
          animation: fsl-glow-pulse 2.4s ease-in-out infinite;
        }
        @keyframes fsl-glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        /* faint static ring for depth beneath the animated one */
        .fsl-ring-static {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(46,139,87,0.14);
        }

        .fsl-ring-track {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            #0d5c63 25%,
            #2e8b57 55%,
            #7cb342 80%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
          animation: fsl-spin 1.1s linear infinite;
        }

        .fsl-logo {
          position: relative;
          z-index: 1;
          width: 24px;
          height: 24px;
          object-fit: contain;
          animation: fsl-breathe 2.4s ease-in-out infinite;
        }
        @keyframes fsl-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        /* --- eyebrow label --- */
        .fsl-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fsl-eyebrow-line {
          width: 20px;
          height: 0.5px;
          background: linear-gradient(90deg, transparent, #2e8b57);
        }
        .fsl-eyebrow-line:last-child {
          background: linear-gradient(90deg, #2e8b57, transparent);
        }
        .fsl-eyebrow-text {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #2e8b57;
          white-space: nowrap;
        }

        .fsl-message {
          margin: 0;
          max-width: 340px;
          text-align: center;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.65;
          letter-spacing: 0.01em;
          background: linear-gradient(90deg, #0d5c63 0%, #2e8b57 55%, #7cb342 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        /* --- shimmering progress line under the message --- */
        .fsl-shimmer-track {
          position: relative;
          width: 120px;
          height: 2px;
          overflow: hidden;
          background: rgba(46,139,87,0.12);
        }
        .fsl-shimmer-fill {
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, #2e8b57, transparent);
          animation: fsl-shimmer-slide 1.6s ease-in-out infinite;
        }
        @keyframes fsl-shimmer-slide {
          0% { left: -40%; }
          100% { left: 100%; }
        }

        @keyframes fsl-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fsl-ring-track,
          .fsl-glow,
          .fsl-logo,
          .fsl-orb,
          .fsl-root,
          .fsl-content {
            animation: none !important;
          }
        }

        @media (max-width: 420px) {
          .fsl-content {
            padding: 32px 28px;
            gap: 18px;
          }
          .fsl-message {
            font-size: 13px;
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  )
}