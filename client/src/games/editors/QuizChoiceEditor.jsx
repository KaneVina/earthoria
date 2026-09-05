import React, { useMemo } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { analyzeQuizChoice } from "../validators";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newOption() {
  return { id: uid(), text: "" };
}

export default function QuizChoiceEditor({ config, onChange }) {
  const questions = config?.questions || [];
  const setQuestions = (next) => onChange({ ...config, questions: next });

  const addQuestion = () =>
    setQuestions([
      ...questions,
      {
        id: uid(),
        text: "",
        options: [newOption(), newOption()],
        correctOptionId: null,
      },
    ]);

  const updateQuestion = (id, patch) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id) =>
    setQuestions(questions.filter((q) => q.id !== id));

  const addOption = (q) => {
    if (q.options.length >= 5) return;
    updateQuestion(q.id, { options: [...q.options, newOption()] });
  };

  const updateOption = (q, optId, text) =>
    updateQuestion(q.id, {
      options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    });

  const removeOption = (q, optId) => {
    if (q.options.length <= 2) return;
    const nextOptions = q.options.filter((o) => o.id !== optId);
    updateQuestion(q.id, {
      options: nextOptions,
      correctOptionId: q.correctOptionId === optId ? null : q.correctOptionId,
    });
  };

  const { errors, rowIssues } = useMemo(
    () => analyzeQuizChoice(config),
    [config],
  );
  const isValid = questions.length > 0 && errors.length === 0;

  return (
    <div className="g-editor">
      <div className="g-editor-hint">
        Mỗi câu hỏi cần 2-5 đáp án và chọn đúng 1 đáp án đúng bằng cách bấm vào
        ô tròn cạnh đáp án đó. Trẻ sẽ trả lời từng câu và ghi điểm theo số câu
        đúng.
      </div>

      {questions.length > 0 && (
        <div className="g-status-bar">
          <span className="g-status-count">{questions.length} câu hỏi</span>
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

      {questions.length === 0 && (
        <div className="g-editor-empty">
          Chưa có câu hỏi nào — bấm "Thêm câu hỏi" bên dưới
        </div>
      )}

      <div className="g-mp-list">
        {questions.map((q, qIdx) => {
          const issue = rowIssues[q.id] || {};
          const rowInvalid =
            issue.text || issue.noCorrect || issue.tooFewOptions;
          return (
            <div
              key={q.id}
              className={`g-mp-row${rowInvalid ? " g-mp-row--invalid" : ""}`}
              style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="g-pair-index">{qIdx + 1}</span>
                <input
                  className={`a-input${issue.text ? " g-input-error" : ""}`}
                  style={{ fontSize: 12, flex: 1 }}
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(q.id, { text: e.target.value })
                  }
                  placeholder="vd: Con gì có vòi dài và tai to?"
                  maxLength={200}
                />
                <button
                  type="button"
                  className="a-btn-icon delete"
                  onClick={() => removeQuestion(q.id)}
                  title="Xóa câu hỏi"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  paddingLeft: 26,
                }}
              >
                {q.options.map((o) => {
                  const optIssue = issue.optionIssues?.[o.id] || {};
                  return (
                    <div
                      key={o.id}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctOptionId === o.id}
                        onChange={() =>
                          updateQuestion(q.id, { correctOptionId: o.id })
                        }
                        title="Đánh dấu là đáp án đúng"
                      />
                      <input
                        className={`a-input${optIssue.empty || optIssue.duplicate ? " g-input-error" : ""}`}
                        style={{ fontSize: 12, flex: 1 }}
                        value={o.text}
                        onChange={(e) => updateOption(q, o.id, e.target.value)}
                        placeholder="vd: Con voi"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        className="a-btn-icon delete"
                        onClick={() => removeOption(q, o.id)}
                        disabled={q.options.length <= 2}
                        title="Xóa đáp án"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="a-btn-ghost"
                  style={{ alignSelf: "flex-start", fontSize: 11 }}
                  onClick={() => addOption(q)}
                  disabled={q.options.length >= 5}
                >
                  <Plus size={11} /> Thêm đáp án
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="a-btn-ghost"
        onClick={addQuestion}
        style={{ marginTop: 10 }}
      >
        <Plus size={13} /> Thêm câu hỏi
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
