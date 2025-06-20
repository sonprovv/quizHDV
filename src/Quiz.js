import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

const PAGE_SIZE = 10;
const GROUP_SIZE = 50;

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState({}); // Lưu trạng thái hiển thị đáp án từng câu
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState(null); // Gói câu hỏi
  const [quizQuestions, setQuizQuestions] = useState([]); // Câu hỏi thực sự dùng cho quiz
  const [modes, setModes] = useState([]); // Danh sách các gói 50 câu

  useEffect(() => {
    async function fetchQuestions() {
      const querySnapshot = await getDocs(collection(db, "quizQuestions"));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sắp xếp theo số câu nếu có
      data.sort((a, b) => (a["Câu số"] || 0) - (b["Câu số"] || 0));
      setQuestions(data);
      // Tạo các gói 50 câu
      const groupCount = Math.ceil(data.length / GROUP_SIZE);
      const groupModes = Array.from({ length: groupCount }, (_, i) => {
        const start = i * GROUP_SIZE + 1;
        const end = Math.min((i + 1) * GROUP_SIZE, data.length);
        return {
          label: `Câu ${start}-${end}`,
          value: { start: start - 1, end: end },
        };
      });
      setModes(groupModes);
    }
    fetchQuestions();
  }, []);

  // Khi chọn mode, lấy số lượng câu hỏi tương ứng
  useEffect(() => {
    if (!mode || questions.length === 0) return;
    const selected = questions.slice(mode.start, mode.end);
    setQuizQuestions(selected);
    setPage(0);
    setAnswers({});
    setShowResult({});
  }, [mode, questions]);

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
    setShowResult({ ...showResult, [qIndex]: true });
  };

  // Đếm số câu đúng đã trả lời
  const correctCount = quizQuestions.reduce((acc, q, idx) => {
    if (answers[idx] && answers[idx] === q["Đáp án đúng"]) return acc + 1;
    return acc;
  }, 0);

  if (questions.length === 0) return <div className="loading">Đang tải câu hỏi...</div>;

  if (!mode) {
    return (
      <div className="quiz-form" style={{ textAlign: "center" }}>
        <h2>Chọn gói câu hỏi (50 câu/gói)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, margin: "24px 0" }}>
          {modes.map((m, idx) => (
            <button
              key={m.label}
              className="submit-btn"
              style={{ minWidth: 120 }}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(quizQuestions.length / PAGE_SIZE);
  const startIdx = page * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, quizQuestions.length);
  const currentQuestions = quizQuestions.slice(startIdx, endIdx);

  return (
    <div>
      <form className="quiz-form" onSubmit={e => e.preventDefault()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button
            type="button"
            className="submit-btn"
            style={{ background: "#888", marginRight: 8 }}
            onClick={() => setMode(null)}
          >
            ← Chọn lại gói
          </button>
          <div className="result" style={{ margin: 0, color: '#1976d2', fontSize: 18 }}>
            Đúng {correctCount}/{quizQuestions.length} câu
          </div>
        </div>
        {currentQuestions.map((q, idx) => {
          const globalIdx = startIdx + idx;
          return (
            <div key={q.id} className="question-block">
              <div className="question-title">
                <span className="question-number">Câu {q["Câu số"]}:</span> {q["Câu hỏi"]}
              </div>
              <div className="options">
                {["A", "B", "C", "D"].map((opt) => {
                  let optionClass = "option-label";
                  if (showResult[globalIdx]) {
                    if (q["Đáp án đúng"] === opt) {
                      optionClass += " correct";
                    } else if (answers[globalIdx] === opt) {
                      optionClass += " wrong";
                    }
                  } else if (answers[globalIdx] === opt) {
                    optionClass += " selected";
                  }
                  return (
                    <label key={opt} className={optionClass}>
                      <input
                        type="radio"
                        name={`q${globalIdx}`}
                        value={opt}
                        checked={answers[globalIdx] === opt}
                        onChange={() => handleChange(globalIdx, opt)}
                        disabled={showResult[globalIdx]}
                      />
                      <span className="option-letter">{opt}.</span> {q[opt]}
                    </label>
                  );
                })}
              </div>
              {showResult[globalIdx] && (
                <div className="result-inline">
                  {answers[globalIdx] === q["Đáp án đúng"] ? (
                    <span className="result-correct">✔ Đúng</span>
                  ) : (
                    <span className="result-wrong">✘ Sai. Đáp án đúng: {q["Đáp án đúng"]}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className="pagination">
          <button
            type="button"
            className="submit-btn"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Trang trước
          </button>
          <span className="page-info">Trang {page + 1} / {totalPages}</span>
          <button
            type="button"
            className="submit-btn"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
          >
            Trang sau
          </button>
        </div>
      </form>
    </div>
  );
}

export default Quiz; 