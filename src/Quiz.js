import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

const PAGE_SIZE = 10;

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState({}); // Lưu trạng thái hiển thị đáp án từng câu
  const [page, setPage] = useState(0);

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
    }
    fetchQuestions();
  }, []);

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
    setShowResult({ ...showResult, [qIndex]: true });
  };

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const startIdx = page * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, questions.length);
  const currentQuestions = questions.slice(startIdx, endIdx);

  if (questions.length === 0) return <div className="loading">Đang tải câu hỏi...</div>;

  return (
    <div>
      <form className="quiz-form" onSubmit={e => e.preventDefault()}>
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
                    if (q["Đáp án đúng"] === opt) optionClass += " correct";
                    else if (answers[globalIdx] === opt) optionClass += " wrong";
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