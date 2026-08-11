import React from "react";

export default function LetterHuntEditor({ config, onChange }) {
  const secretWord = config?.secretWord || "";
  const rows = config?.rows || 8;
  const cols = config?.cols || 8;
  const timeLimitSeconds = config?.timeLimitSeconds ?? 60;

  const letterCount = secretWord.replace(/\s/g, "").length;
  const capacity = rows * cols;

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Người chơi phải chạm đúng thứ tự các chữ cái rải rác trong bảng để
        ghép lại thành <strong>từ khoá bí mật</strong>, chạy đua với đồng hồ
        đếm ngược. Ví dụ từ khoá: <em>"CON VOI"</em>.
      </div>

      <div className="a-form-group" style={{ marginBottom: 12 }}>
        <label className="a-form-label">Từ khoá bí mật</label>
        <input
          className="a-input"
          value={secretWord}
          onChange={(e) => onChange({ ...config, secretWord: e.target.value.toUpperCase() })}
          placeholder="vd: CON VOI"
          style={{ textTransform: "uppercase", letterSpacing: 1 }}
        />
      </div>

      <div className="g-inline-fields">
        <label>
          Số hàng
          <input
            type="number"
            className="a-input"
            min={4}
            max={14}
            value={rows}
            onChange={(e) => onChange({ ...config, rows: Number(e.target.value) || 8 })}
          />
        </label>
        <label>
          Số cột
          <input
            type="number"
            className="a-input"
            min={4}
            max={14}
            value={cols}
            onChange={(e) => onChange({ ...config, cols: Number(e.target.value) || 8 })}
          />
        </label>
        <label>
          Thời gian (giây)
          <input
            type="number"
            className="a-input"
            min={15}
            max={300}
            value={timeLimitSeconds}
            onChange={(e) => onChange({ ...config, timeLimitSeconds: Number(e.target.value) || 60 })}
          />
        </label>
      </div>

      {letterCount > 0 && (
        <div className={letterCount > capacity ? "g-editor-warn" : "g-editor-hint"} style={{ marginTop: 10 }}>
          {letterCount > capacity
            ? `Bảng ${rows}×${cols} (${capacity} ô) không đủ chỗ cho ${letterCount} chữ cái — hãy tăng số hàng/cột.`
            : `Từ khoá có ${letterCount} chữ cái, bảng ${rows}×${cols} có ${capacity} ô — đủ chỗ.`}
        </div>
      )}
    </div>
  );
}