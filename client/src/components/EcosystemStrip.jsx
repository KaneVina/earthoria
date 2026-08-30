import "./assets/css/ecosystemStrip.css";

const ECOSYSTEM_LOGOS = [
  {
    src: "/logo/logo-mau/lg-m-chinh.png",
    alt: "Earthoria",
    name: "Earthoria",
    desc: "Hệ sinh thái gốc",
  },
  {
    src: "/logo/logo-mau/lg-m-family-studio.png",
    alt: "Earthoria Family Studio",
    name: "Family Studio",
    desc: "Nội dung cho gia đình",
  },
  {
    src: "/logo/logo-mau/lg-m-game-studio.png",
    alt: "Earthoria Game Studio",
    name: "Game Studio",
    desc: "Sản xuất trò chơi",
  },
  {
    src: "/logo/logo-mau/lg-kf-big.png",
    alt: "Earthoria Knowledge Farm",
    name: "Knowledge Farm",
    desc: "Tri thức & giáo dục",
  },
  {
    src: "/logo/logo-mau/lg-m-im.png",
    alt: "Earthoria Immersive Studio",
    name: "Immersive Studio",
    desc: "Trải nghiệm tương tác",
  },
];

export default function EcosystemStrip() {
  // 4 copies (not 2) so the track is wide enough to fully cover very wide
  // viewports (ultrawide / large desktop monitors) before it loops. With
  // only 2 copies, on wide screens the track could run out of logos before
  // reaching the end of the visible area, exposing a blank/plain-background
  // gap that looked like a broken/unloaded image.
  const track = [
    ...ECOSYSTEM_LOGOS,
    ...ECOSYSTEM_LOGOS,
    ...ECOSYSTEM_LOGOS,
    ...ECOSYSTEM_LOGOS,
  ];

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
                <img
                  src={logo.src}
                  alt={logo.alt}
                  loading="lazy"
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <span className="eco-strip-logo-name">{logo.name}</span>
                <span className="eco-strip-logo-desc">{logo.desc}</span>
              </div>
              {i < track.length - 1 && (
                <span className="eco-strip-sep" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}