// src/components/FullScreenLoader.jsx
//
// Simple version: a single spinning ring (colored with the logo's
// teal → green gradient) plus a message underneath, styled with the
// same gradient and set in "Be Vietnam Pro".
//
// Make sure the font is loaded somewhere globally, e.g. in index.html:
//   <link rel="preconnect" href="https://fonts.googleapis.com">
//   <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&display=swap" rel="stylesheet">
// or install it locally (npm i @fontsource/be-vietnam-pro) and import it.

export default function FullScreenLoader({
  message = 'Chờ một chút! Chúng tôi đang xác thực tài khoản cho bạn.',
}) {
  return (
    <div className="fsl-root">
      <div className="fsl-content" role="status" aria-live="polite">
        <span className="fsl-spinner" aria-hidden="true">
          <span className="fsl-ring-track" />
          <img className="fsl-logo" src="/logo-nho.png" alt="" />
        </span>

        <p className="fsl-message">{message}</p>
      </div>

      <style>{`
        .fsl-root {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
        }

        .fsl-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px 48px;
        }

        /* --- spinner: ring using the logo's teal -> green gradient --- */
        .fsl-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
        }

        /* the ring is its own layer so the mask below doesn't clip the logo */
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
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
          animation: fsl-spin 0.9s linear infinite;
        }

        /* logo sits still in the center while the ring spins around it */
        .fsl-logo {
          position: relative;
          z-index: 1;
          width: 22px;
          height: 22px;
          object-fit: contain;
        }

        .fsl-message {
          margin: 0;
          max-width: 340px;
          text-align: center;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.6;
          background: linear-gradient(90deg, #0d5c63 0%, #2e8b57 55%, #7cb342 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        @keyframes fsl-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fsl-ring-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}