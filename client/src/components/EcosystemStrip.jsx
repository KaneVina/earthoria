import logoChinh from "./assets/img/logo-chinh.png";
import lgFamilyStudio from "./assets/img/lg-m-family-studio.png";
import lgGameStudio from "./assets/img/lg-m-game-studio.png";
import lgKidStudio from "./assets/img/lg-m-kid-studio.png";
import lgQrStudio from "./assets/img/lg-m-qr-studio.png";
import lgStudio from "./assets/img/lg-m-studio.png";
import "./assets/css/ecosystemStrip.css";

const ECOSYSTEM_LOGOS = [
  { src: logoChinh, alt: "Earthoria" },
  { src: lgFamilyStudio, alt: "Earthoria Family Studio" },
  { src: lgGameStudio, alt: "Earthoria Game Studio" },
  { src: lgKidStudio, alt: "Earthoria Kid Studio" },
  { src: lgQrStudio, alt: "Earthoria QR Studio" },
  { src: lgStudio, alt: "Earthoria Studio" },
];

// Dải logo hệ sinh thái Earthoria — 1 hàng chạy marquee mượt, vô hạn (nhân
// đôi danh sách rồi dịch chuyển đúng 50% chiều rộng để tạo vòng lặp liền mạch).
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