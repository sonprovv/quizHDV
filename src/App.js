import React from "react";
import Quiz from "./Quiz";
import logo from "./logo.png"; // Giả sử bạn sẽ thêm file logo.png vào src
import './App.css';

function App() {
  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
        <img src={logo} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} />
        <h1 style={{ margin: 0, color: '#1976d2', fontWeight: 700 }}> Ôn tập hướng dịch vụ </h1>
      </div>
      <Quiz />
      <div style={{ textAlign: 'center', marginTop: 32, color: '#888', fontSize: 16 }}>
        <span>© 2025 Sơn PTIT</span>
      </div>
    </div>
  );
}

export default App;
