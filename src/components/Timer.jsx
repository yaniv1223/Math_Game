// Timer.jsx
import React, { useEffect, useState } from 'react';

function Timer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration); // reset timer when duration changes

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [duration, onTimeUp]);

  return (
    <div style={{ fontSize: 18, color: 'red', marginBottom: 10 }}>
      ⏱ Time left: {timeLeft}s
    </div>
  );
}

export default Timer;
