import "./assets/css/ecosystemStrip.css";

const ECOSYSTEM_LOGOS = [
  { src: "/logo/logo-mau/lg-m-chinh.png", alt: "Earthoria" },
  {
    src: "/logo/logo-mau/lg-m-family-studio.png",
    alt: "Earthoria Family Studio",
  },
  { src: "/logo/logo-mau/lg-m-game-studio.png", alt: "Earthoria Game Studio" },
  { src: "/logo/logo-mau/lg-m-kid-studio.png", alt: "Earthoria Kid Studio" },
  { src: "/logo/logo-mau/lg-m-qr-studio.png", alt: "Earthoria QR Studio" },
  { src: "/logo/logo-mau/lg-m-studio.png", alt: "Earthoria Studio" },
];

export default function EcosystemStrip() {
  const track = [...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS];

  return (
    <section className="eco-strip" aria-label="Hệ sinh thái Earthoria">
      <span className="eco-strip-top-accent" aria-hidden="true" />

      <div className="eco-strip-inner">
        <div className="eco-strip-eyebrow-row">
          <span className="eco-strip-eyebrow-line" />
          <span className="eco-strip-eyebrow-text">Hệ Sinh Thái</span>
          <span className="eco-strip-eyebrow-line" />
        </div>
        <h2 className="eco-strip-title">
          Hệ Sinh Thái <em>Earthoria</em>
        </h2>
      </div>

      <div className="eco-strip-marquee">
        <div className="eco-strip-fade eco-strip-fade-left" />
        <div className="eco-strip-fade eco-strip-fade-right" />
        <div className="eco-strip-track">
          {track.map((logo, i) => (
            <div className="eco-strip-logo-item" key={`${logo.alt}-${i}`}>
              <div className="eco-strip-logo">
                <img src={logo.src} alt={logo.alt} loading="lazy" />
              </div>
              <span className="eco-strip-sep" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
