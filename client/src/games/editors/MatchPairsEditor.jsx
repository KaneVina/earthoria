import React, { useMemo } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { analyzeMatchPairs } from "../validators";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function MatchPairsEditor({ config, onChange }) {
  const pairs = config?.pairs || [];
  const setPairs = (next) => onChange({ ...config, pairs: next });

  const addPair = () => setPairs([...pairs, { id: uid(), left: "", right: "" }]);
  const updatePair = (id, patch) => setPairs(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePair = (id) => setPairs(pairs.filter((p) => p.id !== id));

  const { errors, rowIssues } = useMemo(() => analyzeMatchPairs(config), [config]);
  const isValid = pairs.length > 0 && errors.length === 0;

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Mỗi hàng là 1 cặp tương ứng — người chơi sẽ chạm 1 mục cột trái rồi
        chạm đúng mục cột phải tương ứng để nối. Ví dụ: <em>"Con voi"</em> ↔{" "}
        <em>"Loài động vật to lớn có vòi dài"</em>. Cần tối thiểu 2 cặp, mỗi
        cột không nên có nội dung trùng lặp.
      </div>

      {pairs.length > 0 && (
        <div className="g-status-bar">
          <span className="g-status-count">{pairs.length} cặp</span>
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

      {pairs.length === 0 && (
        <div className="g-editor-empty">Chưa có cặp nào — bấm "Thêm cặp" bên dưới</div>
      )}

      <div className="g-mp-list">
        {pairs.length > 0 && (
          <div className="g-mp-header">
            <span>Cột trái</span>
            <span>Cột phải (tương ứng)</span>
            <span />
          </div>
        )}
        {pairs.map((pair, idx) => {
          const issue = rowIssues[pair.id] || {};
          const rowInvalid = issue.left || issue.right || issue.leftDup || issue.rightDup;
          return (
            <div className={`g-mp-row${rowInvalid ? " g-mp-row--invalid" : ""}`} key={pair.id}>
              <span className="g-pair-index">{idx + 1}</span>
              <input
                className={`a-input${issue.left || issue.leftDup ? " g-input-error" : ""}`}
                style={{ fontSize: 12 }}
                value={pair.left}
                onChange={(e) => updatePair(pair.id, { left: e.target.value })}
                placeholder="vd: Con voi"
                maxLength={80}
              />
              <input
                className={`a-input${issue.right || issue.rightDup ? " g-input-error" : ""}`}
                style={{ fontSize: 12 }}
                value={pair.right}
                onChange={(e) => updatePair(pair.id, { right: e.target.value })}
                placeholder="vd: Loài động vật to lớn có vòi dài"
                maxLength={140}
              />
              <button
                type="button"
                className="a-btn-icon delete"
                onClick={() => removePair(pair.id)}
                title="Xóa cặp"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="a-btn-ghost" onClick={addPair} style={{ marginTop: 10 }}>
        <Plus size={13} /> Thêm cặp
      </button>

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