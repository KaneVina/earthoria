import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { analyzeLetterHunt } from "../validators";

export default function LetterHuntEditor({ config, onChange }) {
  const secretWord = config?.secretWord || "";
  const rows = config?.rows || 8;
  const cols = config?.cols || 8;
  const timeLimitSeconds = config?.timeLimitSeconds ?? 60;

  const { errors, letterCount, capacity, overCapacity } = useMemo(
    () => analyzeLetterHunt(config),
    [config],
  );
  const isValid = errors.length === 0 && letterCount > 0;
  const fillRatio = capacity > 0 ? Math.min(1, letterCount / capacity) : 0;

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Người chơi phải chạm đúng thứ tự các chữ cái rải rác trong bảng để ghép
        lại thành <strong>từ khoá bí mật</strong>, chạy đua với đồng hồ đếm
        ngược. Ví dụ từ khoá: <em>"CON VOI"</em>.
      </div>

      {secretWord && (
        <div className="g-status-bar">
          <span className="g-status-count">
            {letterCount} chữ cái / {capacity} ô ({rows}×{cols})
          </span>
          {isValid ? (
            <span className="g-status-badge ok">
              <CheckCircle2 size={12} /> Sẵn sàng lưu
            </span>
          ) : (
            <span className="g-status-badge warn">
              <AlertTriangle size={12} /> {errors.length} vấn đề cần sửa
            </span>
          )}
        </div>
      )}

      <div className="a-form-group" style={{ marginBottom: 6 }}>
        <label className="a-form-label">Từ khoá bí mật</label>
        <input
          className={`a-input${overCapacity || !secretWord.trim() ? "" : ""}`}
          value={secretWord}
          onChange={(e) =>
            onChange({ ...config, secretWord: e.target.value.toUpperCase() })
          }
          placeholder="vd: CON VOI"
          style={{ textTransform: "uppercase", letterSpacing: 1 }}
          maxLength={40}
        />
      </div>

      {secretWord && (
        <div className="g-lh-preview-track">
          {Array.from(secretWord).map((ch, i) =>
            ch === " " ? (
              <span key={i} className="g-lh-preview-space" />
            ) : (
              <span key={i} className="g-lh-preview-slot">
                {ch}
              </span>
            ),
          )}
        </div>
      )}

      <div className="g-inline-fields">
        <label>
          Số hàng
          <input
            type="number"
            className="a-input"
            min={4}
            max={14}
            value={rows}
            onChange={(e) =>
              onChange({ ...config, rows: Number(e.target.value) || 8 })
            }
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
            onChange={(e) =>
              onChange({ ...config, cols: Number(e.target.value) || 8 })
            }
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
            onChange={(e) =>
              onChange({
                ...config,
                timeLimitSeconds: Number(e.target.value) || 60,
              })
            }
          />
        </label>
      </div>

      {letterCount > 0 && (
        <div className="g-lh-capacity">
          <div className="g-lh-capacity-bar">
            <div
              className={`g-lh-capacity-fill${overCapacity ? " over" : ""}`}
              style={{ width: `${fillRatio * 100}%` }}
            />
          </div>
          <span
            className={
              overCapacity ? "g-editor-warn-text" : "g-editor-hint-text"
            }
          >
            {overCapacity
              ? `Bảng ${rows}×${cols} (${capacity} ô) không đủ chỗ cho ${letterCount} chữ cái — hãy tăng số hàng/cột.`
              : `Từ khoá có ${letterCount} chữ cái, bảng ${rows}×${cols} có ${capacity} ô — đủ chỗ.`}
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="g-issue-list">
          {errors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
