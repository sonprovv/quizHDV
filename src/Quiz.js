import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

const PAGE_SIZE = 10;
const GROUP_SIZE = 50;
const EXAM_QUESTION_COUNT = 40;
const EXAM_TIME = 20 * 60; // 20 phút (giây)

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Phát hiện tiếng Anh đơn giản: nhiều ký tự alphabet, không dấu, nhiều từ tiếng Anh phổ biến
function isEnglish(text) {
  if (!text) return false;
  // Nếu có nhiều hơn 60% ký tự là alphabet không dấu, hoặc có nhiều từ tiếng Anh phổ biến
  const alphabet = text.replace(/[^a-zA-Z]/g, "");
  if (alphabet.length / text.length > 0.6) return true;
  const commonWords = ["the", "and", "is", "are", "of", "to", "in", "that", "with", "for", "on", "as", "by", "an", "be", "at", "from", "or", "this", "which", "but", "not", "it", "was", "can", "has", "have", "will", "if", "all", "one", "about", "more", "when", "so", "no", "do", "out", "up", "what", "who", "how", "where", "why", "your", "their", "our", "my", "me", "you", "they", "we", "he", "she", "his", "her", "them", "us", "i"]; 
  const lower = text.toLowerCase();
  let count = 0;
  for (const w of commonWords) if (lower.includes(" " + w + " ")) count++;
  if (count > 1) return true;
  return false;
}

// Hàm dịch sử dụng Google Translate web (bằng fetch tới API không chính thức)
async function translateText(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0].map((item) => item[0]).join("");
}

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState({});
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState(null); // Gói câu hỏi
  const [quizQuestions, setQuizQuestions] = useState([]); // Câu hỏi thực sự dùng cho quiz
  const [modes, setModes] = useState([]); // Danh sách các gói 50 câu
  const [isExam, setIsExam] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(EXAM_TIME);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const timerRef = useRef();
  const [translating, setTranslating] = useState({}); // trạng thái đang dịch
  const [translations, setTranslations] = useState({}); // lưu bản dịch

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
    if (mode === "exam") {
      // Lấy 40 câu ngẫu nhiên cho exam
      const shuffled = shuffleArray(questions).slice(0, EXAM_QUESTION_COUNT);
      setQuizQuestions(shuffled);
      setIsExam(true);
      setExamTimeLeft(EXAM_TIME);
      setExamStarted(true);
      setExamSubmitted(false);
      setPage(0);
      setAnswers({});
      setShowResult({});
    } else {
      const selected = questions.slice(mode.start, mode.end);
      setQuizQuestions(selected);
      setIsExam(false);
      setExamStarted(false);
      setExamSubmitted(false);
      setPage(0);
      setAnswers({});
      setShowResult({});
    }
  }, [mode, questions]);

  // Đếm ngược thời gian exam
  useEffect(() => {
    if (!isExam || !examStarted || examSubmitted) return;
    timerRef.current = setInterval(() => {
      setExamTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setExamSubmitted(true);
          // Hiện đáp án đúng/sai từng câu
          const newShowResult = {};
          for (let i = 0; i < quizQuestions.length; i++) newShowResult[i] = true;
          setShowResult(newShowResult);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [isExam, examStarted, examSubmitted, quizQuestions.length]);

  // Cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
    if (!isExam || examSubmitted) {
      setShowResult({ ...showResult, [qIndex]: true });
    }
  };

  // Đếm số câu đúng đã trả lời
  const correctCount = quizQuestions.reduce((acc, q, idx) => {
    if (answers[idx] && answers[idx] === q["Đáp án đúng"]) return acc + 1;
    return acc;
  }, 0);

  // Nộp bài exam
  const handleExamSubmit = () => {
    setExamSubmitted(true);
    // Hiện đáp án đúng/sai từng câu
    const newShowResult = {};
    for (let i = 0; i < quizQuestions.length; i++) newShowResult[i] = true;
    setShowResult(newShowResult);
    clearInterval(timerRef.current);
  };

  // Hiển thị thời gian dạng mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Hàm xử lý dịch câu hỏi/đáp án
  const handleTranslate = async (key, text) => {
    setTranslating((prev) => ({ ...prev, [key]: true }));
    const translated = await translateText(text);
    setTranslations((prev) => ({ ...prev, [key]: translated }));
    setTranslating((prev) => ({ ...prev, [key]: false }));
  };

  if (questions.length === 0) return <div className="loading">Đang tải câu hỏi...</div>;

  if (!mode) {
    return (
      <div className="quiz-form" style={{ textAlign: "center" }}>
        <h2>Chọn gói câu hỏi (50 câu/gói hoặc Exam)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, margin: "24px 0" }}>
          <button
            className="submit-btn"
            style={{ minWidth: 160, background: '#d32f2f', color: '#fff', fontWeight: 700 }}
            onClick={() => setMode("exam")}
          >
            Exam (40 câu/20 phút)
          </button>
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
        {isExam && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, color: examTimeLeft <= 60 ? '#d32f2f' : '#1976d2', fontSize: 20 }}>
              ⏰ Thời gian còn lại: {formatTime(examTimeLeft)}
            </span>
            {!examSubmitted && (
              <button
                className="submit-btn"
                style={{ marginLeft: 24, background: '#1976d2', color: '#fff' }}
                onClick={handleExamSubmit}
                type="button"
              >
                Nộp bài
              </button>
            )}
          </div>
        )}
        {currentQuestions.map((q, idx) => {
          const globalIdx = startIdx + idx;
          const qKey = `q_${globalIdx}`;
          return (
            <div key={q.id} className="question-block">
              <div className="question-title">
                <span className="question-number">Câu {q["Câu số"]}:</span> {q["Câu hỏi"]}
                {isEnglish(q["Câu hỏi"]) && (
                  <button
                    type="button"
                    className="translate-btn"
                    style={{ marginLeft: 8 }}
                    disabled={translating[qKey]}
                    onClick={() => handleTranslate(qKey, q["Câu hỏi"])}
                  >
                    {translating[qKey] ? "Đang dịch..." : "Dịch"}
                  </button>
                )}
              </div>
              {translations[qKey] && (
                <div className="translated-text">{translations[qKey]}</div>
              )}
              <div className="options">
                {["A", "B", "C", "D"].map((opt) => {
                  const optKey = `${qKey}_${opt}`;
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
                        disabled={isExam ? examSubmitted : showResult[globalIdx]}
                      />
                      <span className="option-letter">{opt}.</span> {q[opt]}
                      {isEnglish(q[opt]) && (
                        <button
                          type="button"
                          className="translate-btn"
                          style={{ marginLeft: 8 }}
                          disabled={translating[optKey]}
                          onClick={() => handleTranslate(optKey, q[opt])}
                        >
                          {translating[optKey] ? "Đang dịch..." : "Dịch"}
                        </button>
                      )}
                      {translations[optKey] && (
                        <div className="translated-text">{translations[optKey]}</div>
                      )}
                    </label>
                  );
                })}
              </div>
              {((!isExam && showResult[globalIdx]) || (isExam && examSubmitted && showResult[globalIdx])) && (
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