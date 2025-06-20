import React from "react";
import Quiz from "./Quiz";
import './App.css';

function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1>Trắc nghiệm Online</h1>
      <Quiz />
    </div>
  );
}

export default App;
