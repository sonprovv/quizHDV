import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function fetchQuestions() {
      const querySnapshot = await getDocs(collection(db, "quizQuestions"));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(data);
    }
    fetchQuestions();
  }, []);

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q["Đáp án"]) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (questions.length === 0) return <div>Đang tải câu hỏi...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {questions.map((q, idx) => (
        <div key={q.id} style={{ marginBottom: 24 }}>
          <div>
            <b>Câu {q["Câu số"]}: {q["Câu hỏi"]}</b>
          </div>
          {["A", "B", "C", "D"].map((opt) => (
            <div key={opt}>
              <label>
                <input
                  type="radio"
                  name={`q${idx}`}
                  value={opt}
                  checked={answers[idx] === opt}
                  onChange={() => handleChange(idx, opt)}
                  disabled={submitted}
                />
                {opt}: {q[opt]}
              </label>
            </div>
          ))}
        </div>
      ))}
      {!submitted ? (
        <button type="submit">Nộp bài</button>
      ) : (
        <div>
          <h2>Bạn đúng {score}/{questions.length} câu!</h2>
        </div>
      )}
    </form>
  );
}

export default Quiz; 