import React, { useRef, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Type, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { gameService } from "../../services/gameService";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function CardFaceEditor({ face, onChange, gameId, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await gameService.uploadImage(file, gameId);
      onChange({ kind: "image", value: res.data.data.url });
    } catch {
      toast.error("Tải ảnh thất bại, thử lại nhé");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="g-face">
      <div className="g-face-head">
        <span className="g-face-label">{label}</span>
        <div className="g-face-kind-toggle">
          <button
            type="button"
            className={face.kind !== "image" ? "active" : ""}
            onClick={() => onChange({ kind: "text", value: face.kind === "image" ? "" : face.value })}
            title="Chữ"
          >
            <Type size={11} />
          </button>
          <button
            type="button"
            className={face.kind === "image" ? "active" : ""}
            onClick={() => onChange({ kind: "image", value: face.kind === "image" ? face.value : "" })}
            title="Ảnh"
          >
            <ImageIcon size={11} />
          </button>
        </div>
      </div>

      {face.kind === "image" ? (
        <div className="g-face-image-slot">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          {face.value ? (
            <div className="g-face-image-preview">
              <img src={face.value} alt="" />
              <button type="button" onClick={() => onChange({ kind: "image", value: "" })}>
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="g-face-image-add"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className="a-spin" /> : <ImageIcon size={14} />}
              <span>{uploading ? "Đang tải..." : "Chọn ảnh"}</span>
            </button>
          )}
        </div>
      ) : (
        <input
          className="a-input"
          style={{ fontSize: 12 }}
          value={face.value || ""}
          onChange={(e) => onChange({ kind: "text", value: e.target.value })}
          placeholder="vd: Con voi"
        />
      )}
    </div>
  );
}

export default function MemoryMatchEditor({ config, onChange, gameId }) {
  const pairs = config?.pairs || [];

  const setPairs = (next) => onChange({ ...config, pairs: next });

  const addPair = () => {
    setPairs([
      ...pairs,
      { id: uid(), cardA: { kind: "text", value: "" }, cardB: { kind: "text", value: "" } },
    ]);
  };

  const updatePair = (id, patch) => {
    setPairs(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePair = (id) => setPairs(pairs.filter((p) => p.id !== id));

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Mỗi cặp gồm 2 mặt thẻ — người chơi lật để tìm 2 thẻ khớp nhau. Có thể
        ghép <strong>ảnh với chữ</strong> (vd: ảnh con voi ↔ chữ "Con voi")
        hoặc chữ với chữ. Cần tối thiểu 2 cặp.
      </div>

      {pairs.length === 0 && (
        <div className="g-editor-empty">Chưa có cặp thẻ nào — bấm "Thêm cặp thẻ" bên dưới</div>
      )}

      <div className="g-pair-list">
        {pairs.map((pair, idx) => (
          <div className="g-pair-row" key={pair.id}>
            <div className="g-pair-index">{idx + 1}</div>
            <CardFaceEditor
              label="Mặt A"
              face={pair.cardA}
              gameId={gameId}
              onChange={(cardA) => updatePair(pair.id, { cardA })}
            />
            <div className="g-pair-link">⇄</div>
            <CardFaceEditor
              label="Mặt B"
              face={pair.cardB}
              gameId={gameId}
              onChange={(cardB) => updatePair(pair.id, { cardB })}
            />
            <button
              type="button"
              className="a-btn-icon delete"
              style={{ alignSelf: "center" }}
              onClick={() => removePair(pair.id)}
              title="Xóa cặp"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="a-btn-ghost" onClick={addPair} style={{ marginTop: 10 }}>
        <Plus size={13} /> Thêm cặp thẻ
      </button>
    </div>
  );
}