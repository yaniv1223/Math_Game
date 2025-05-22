import React from 'react';

function Feedback({ userAnswer, correctAnswer, submitted, onBackToMain }) {
  if (!submitted) return null;

  return (
    <div style={{ margin: 10 }}>
      {userAnswer === correctAnswer
        ? "✅ תשובה נכונה!"
        : `❌ תשובה לא נכונה. התשובה הנכונה: ${correctAnswer}°C`}
      <br />
      <button
        style={{ marginTop: 16 }}
        onClick={onBackToMain}
      >
        חזור למסך הראשי
      </button>
    </div>
  );
}

export default Feedback;
