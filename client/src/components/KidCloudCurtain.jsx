export default function KidCloudCurtain({ stage, skyState }) {
  const stops = skyState?.stops || [];
  const style = {
    "--curtain-s1": stops[0] || "#0b1b3a",
    "--curtain-s2": stops[1] || "#1aaee8",
    "--curtain-s3": stops[2] || "#12a8e0",
    "--curtain-s4": stops[3] || "#6fd3f2",
    "--curtain-s5": stops[4] || "#eaf8ff",
    "--curtain-s6": stops[5] || "#f5fbff",
  };

  return (
    <div
      className={`kid-curtain${stage === "leave" ? " is-leaving" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <div className="kid-curtain-backdrop" />

      {/* Màn mây thật: 4 mảng mây khổng lồ chồng lấp sâu vào nhau ở 4
         góc, mờ dần êm ra rìa nên mắt chỉ thấy MỘT lớp màn trắng liền
         mạch phủ kín toàn màn hình (không phải từng cục rời rạc). 2
         quầng sáng/tối cực nhạt trôi rất chậm tạo cảm giác có vài chỗ
         "trôi nhè nhẹ" mà không lộ hình dạng cụ thể. 1 cầu vồng thật
         (+ 1 cầu vồng phụ mờ hơn) ẩn hiện phía sau mây. Lúc rời đi, 4
         mảng mây tách hẳn ra và bay toả về đúng 4 góc màn hình, để lộ
         dần cầu vồng phía sau. */}
      <div className="kid-curtain-sky">
        <span className="kid-curtain-haze kid-curtain-haze-a" />
        <span className="kid-curtain-haze kid-curtain-haze-b" />
        <span className="kid-curtain-sunglow" />
        <span className="kid-curtain-rainbow" />
        <div className="kid-curtain-mist">
          <span className="kid-curtain-mistpanel kid-curtain-mistpanel-tl" />
          <span className="kid-curtain-mistpanel kid-curtain-mistpanel-tr" />
          <span className="kid-curtain-mistpanel kid-curtain-mistpanel-bl" />
          <span className="kid-curtain-mistpanel kid-curtain-mistpanel-br" />
        </div>
      </div>

      <div className="kid-curtain-flare" />

      <div className="kid-curtain-center">
        <span className="kid-curtain-badge">
          <span className="kid-curtain-glow" />
          <span className="kid-curtain-ring" />
          <span className="kid-curtain-badge-inner">
            <img
              src="/logo/logo-mau/lg-kf-small.png"
              alt=""
              className="kid-curtain-logo"
            />
          </span>
        </span>

        <div className="kid-curtain-pill">
          <p className="kid-curtain-text">Bé chờ một chút xíu nhé…</p>
          <span className="kid-curtain-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}