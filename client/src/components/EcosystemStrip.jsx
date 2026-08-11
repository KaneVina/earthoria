import "./assets/css/ecosystemStrip.css";

const ECOSYSTEM_LOGOS = [
  { src: "/logo-chinh.png", alt: "Earthoria" },
  { src: "/lg-m-family-studio.png", alt: "Earthoria Family Studio" },
  { src: "/lg-m-game-studio.png", alt: "Earthoria Game Studio" },
  { src: "/lg-m-kid-studio.png", alt: "Earthoria Kid Studio" },
  { src: "/lg-m-qr-studio.png", alt: "Earthoria QR Studio" },
  { src: "/lg-m-studio.png", alt: "Earthoria Studio" },
];

export default function EcosystemStrip() {
  const track = [...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS];

  return (
    <section className="eco-strip" aria-label="Hệ sinh thái Earthoria">
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
            <div className="eco-strip-logo" key={`${logo.alt}-${i}`}>
              <img src={logo.src} alt={logo.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}