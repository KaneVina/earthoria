import React, { useMemo, useState } from "react";
import { X, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { generateWordSearchGrid } from "../utils/wordSearchGenerator";
import { analyzeWordSearch } from "../validators";

function cleanKey(w) {
  return (w || "").toString().trim().toUpperCase().replace(/\s+/g, "");
}

export default function WordSearchEditor({ config, onChange }) {
  const words = config?.words || [];
  const [draft, setDraft] = useState("");
  const [previewSeed, setPreviewSeed] = useState(0);

  const setWords = (next) => onChange({ ...config, words: next });

  const commitDraft = () => {
    const val = draft.trim();
    if (!val) return;
    const key = cleanKey(val);
    if (key.length === 0) {
      setDraft("");
      return;
    }
    if (key.length > 14) {
      toast.error("Từ tối đa 14 chữ cái, thử từ ngắn hơn nhé");
      return;
    }
    if (words.some((w) => cleanKey(w) === key)) {
      toast.error(`"${val}" đã có trong danh sách rồi`);
      return;
    }
    setWords([...words, val]);
    setDraft("");
  };

  const removeWord = (idx) => setWords(words.filter((_, i) => i !== idx));

  const preview = useMemo(() => {
    if (words.length === 0) return null;
    return generateWordSearchGrid(words, config?.rows, config?.cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.join("|"), config?.rows, config?.cols, previewSeed]);

  const { errors, wordIssues } = useMemo(() => analyzeWordSearch(config), [config]);
  const capacityOk = !preview || preview.placements.length >= words.length;
  const isValid = words.length > 0 && errors.length === 0 && capacityOk;

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Nhập từng từ khoá rồi bấm Enter để thêm. Bảng sẽ đặt các từ theo hàng
        ngang / dọc / chéo và tự lấp đầy chữ ngẫu nhiên xung quanh — mỗi lượt
        chơi thật sẽ sinh ra 1 bảng mới (khác với bảng xem trước bên dưới) để
        đỡ nhàm khi chơi lại. Mỗi từ tối đa 14 chữ cái và không được trùng nhau.
      </div>

      {words.length > 0 && (
        <div className="g-status-bar">
          <span className="g-status-count">{words.length} từ khoá</span>
          {isValid ? (
            <span className="g-status-badge ok">
              <CheckCircle2 size={12} /> Sẵn sàng lưu
            </span>
          ) : (
            <span className="g-status-badge warn">
              <AlertTriangle size={12} /> {errors.length > 0 ? `${errors.length} vấn đề cần sửa` : "Bảng chưa đủ chỗ"}
            </span>
          )}
        </div>
      )}

      <div className="g-tag-input">
        <div className="g-tag-list">
          {words.map((w, i) => {
            const issue = wordIssues[i] || {};
            const invalid = issue.tooLong || issue.duplicate;
            return (
              <span className={`g-tag${invalid ? " g-tag--invalid" : ""}`} key={`${w}-${i}`} title={invalid ? "Cần sửa từ này" : undefined}>
                {w}
                <button type="button" onClick={() => removeWord(i)}>
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Backspace" && !draft && words.length) {
                removeWord(words.length - 1);
              }
            }}
            onBlur={commitDraft}
            placeholder={words.length ? "Thêm từ khác..." : "vd: VOI, HỔ, SƯ TỬ..."}
          />
        </div>
      </div>

      <div className="g-inline-fields">
        <label>
          Số hàng
          <input
            type="number"
            className="a-input"
            min={6}
            max={20}
            value={config?.rows || ""}
            placeholder="Tự động"
            onChange={(e) => onChange({ ...config, rows: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        <label>
          Số cột
          <input
            type="number"
            className="a-input"
            min={6}
            max={20}
            value={config?.cols || ""}
            placeholder="Tự động"
            onChange={(e) => onChange({ ...config, cols: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
      </div>

      {preview && preview.grid.length > 0 && (
        <div className="g-ws-preview-wrap">
          <div className="g-ws-preview-head">
            <span>Xem trước bảng (chỉ để tham khảo)</span>
            <button type="button" className="a-btn-ghost" onClick={() => setPreviewSeed((s) => s + 1)}>
              <RefreshCw size={12} /> Sinh lại
            </button>
          </div>
          <div
            className="g-ws-grid"
            style={{ gridTemplateColumns: `repeat(${preview.cols}, 1fr)`, maxWidth: preview.cols * 26 }}
          >
            {preview.grid.map((row, r) =>
              row.map((letter, c) => (
                <div className="g-ws-cell" key={`${r}-${c}`}>
                  {letter}
                </div>
              )),
            )}
          </div>
          {preview.placements.length < words.length && (
            <div className="g-editor-warn">
              Bảng hiện chưa đủ chỗ cho tất cả các từ ({preview.placements.length}/{words.length}) — thử tăng
              số hàng/cột hoặc bớt bớt vài từ dài.
            </div>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="g-issue-list">
          {errors.slice(0, 6).map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
          {errors.length > 6 && <li>... và {errors.length - 6} vấn đề khác</li>}
        </ul>
      )}
    </div>
  );
}