import React from 'react';

function ResultScreen({ score, totalQuestions, onRestart, extraContent, onBackToMain }) {
  return (
    <div>
      <h2>המשחק הסתיים!</h2>
      <h3>הניקוד שלך: {score} מתוך {totalQuestions}</h3>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        display: 'inline-block',
        padding: '18px 30px',
        margin: '20px auto',
        boxShadow: '0 2px 12px #bbb'
      }}>
        <h3>תוצאה סופית</h3>
        <p style={{ fontSize: 18, margin: 8 }}>
          ענית נכון על {score} מתוך {totalQuestions} שאלות!
        </p>
        <p style={{ fontSize: 16, margin: 8 }}>
          {score === totalQuestions
            ? "מצוין! כל הכבוד!"
            : score >= Math.floor(totalQuestions * 0.7)
            ? "יפה מאוד! המשך להתאמן."
            : "נסה שוב כדי להשתפר."}
        </p>
        <button onClick={onRestart} style={{ fontSize: 18, padding: '8px 24px', marginTop: 15 }}>שחק שוב</button>
        {onBackToMain && (
          <button
            onClick={onBackToMain}
            style={{ fontSize: 16, padding: '8px 24px', marginTop: 10, marginRight: 10, background: '#eee' }}
          >
            חזור למסך הראשי
          </button>
        )}
        {extraContent}
      </div>
    </div>
  );
}

export default ResultScreen;