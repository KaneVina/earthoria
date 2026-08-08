import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { childService } from "../../services/childService";

export default function KidLinkCard({ childId, childName }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await childService.getKidLink(childId);
      setLink(res.data.data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        `Tạo lại link mới cho ${childName}? Link/QR hiện tại sẽ ngừng hoạt động ngay lập tức trên mọi thiết bị đang dùng.`,
      )
    )
      return;
    setRegenerating(true);
    try {
      const res = await childService.regenerateKidLink(childId);
      setLink(res.data.data.url);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Không tạo lại được link, thử lại sau.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kid-link-${childName}.png`;
    a.click();
  };

  return (
    <div className="kid-link-card">
      <h4>Link riêng cho {childName}</h4>
      <p className="kid-link-hint">
        Mở link này (hoặc quét QR) trên thiết bị/tablet riêng của bé — vào thẳng
        thư viện sách của bé, không cần đăng nhập tài khoản phụ huynh trên
        thiết bị đó.
      </p>

      {loading ? (
        <p>Đang tải link...</p>
      ) : (
        <>
          <div className="kid-link-url-row">
            <input readOnly value={link || ""} onClick={(e) => e.target.select()} />
            <button onClick={handleCopy}>{copied ? "Đã chép ✓" : "Chép link"}</button>
          </div>

          <div ref={qrWrapRef} className="kid-link-qr">
            {link && <QRCodeCanvas value={link} size={180} includeMargin />}
          </div>

          <div className="kid-link-actions">
            <button onClick={handleDownloadQr} disabled={!link}>
              Tải QR
            </button>
            <button onClick={handleRegenerate} disabled={regenerating} className="danger">
              {regenerating ? "Đang tạo lại..." : "Tạo lại link (huỷ link cũ)"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}