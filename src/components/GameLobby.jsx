// GameLobby.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from '../firebase';
import Question from './Question';
import Thermometer from './Thermometer';
import Timer from './Timer';
import Feedback from './Feedback';
import ResultScreen from './ResultScreen';

const generateRoomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateQuestions = (num = 10) => {
  return Array.from({ length: num }, () => ({
    a: Math.floor(Math.random() * 21) - 10,
    b: Math.floor(Math.random() * 21) - 10,
  }));
};

const GameLobby = () => {
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [userAnswer, setUserAnswer] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [singleQuestions, setSingleQuestions] = useState([]);
  const [singleCurrent, setSingleCurrent] = useState(0);
  const [singleScore, setSingleScore] = useState(0);
  const [singleAnswer, setSingleAnswer] = useState(0);
  const [singleSubmitted, setSingleSubmitted] = useState(false);
  const [singleShowResult, setSingleShowResult] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName) {
      alert('הכנס שם שחקן');
      return;
    }
    const code = generateRoomCode();
    const questions = generateQuestions();
    await set(ref(db, 'rooms/' + code), {
      players: {
        [playerName]: { score: 0 }
      },
      questions,
      currentQuestion: 0,
      answered: false,
      winner: null,
      answers: {},
      gameOver: false
    });
    setRoomCode(code);
  };

  const handleJoinRoom = async () => {
    if (!playerName || !joinCode) {
      alert('הכנס שם שחקן וקוד חדר');
      return;
    }
    await update(ref(db, 'rooms/' + joinCode + '/players'), {
      [playerName]: { score: 0 }
    });
    setRoomCode(joinCode);
  };

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, 'rooms/' + roomCode);
    return onValue(roomRef, (snapshot) => {
      setGameState(snapshot.val());
      setSubmitted(!!snapshot.val()?.answers?.[playerName]);
      setUserAnswer(snapshot.val()?.answers?.[playerName] || 0);
    });
  }, [roomCode, playerName]);

  const handleSubmit = () => {
    if (!gameState || gameState.answered || gameState.winner) return;

    const { questions, currentQuestion, answers = {} } = gameState;
    const correctAnswer = questions[currentQuestion].a + questions[currentQuestion].b;

    if (answers[playerName] !== undefined) return;

    if (userAnswer === correctAnswer) {
      update(ref(db, 'rooms/' + roomCode), {
        [`players/${playerName}/score`]: (gameState.players[playerName]?.score || 0) + 1,
        [`answers/${playerName}`]: userAnswer,
        answered: true,
        winner: playerName
      });
    } else {
      const updatedAnswers = { ...answers, [playerName]: userAnswer };
      update(ref(db, 'rooms/' + roomCode), {
        answers: updatedAnswers
      });

      const playerCount = Object.keys(gameState.players).length;
      const submittedCount = Object.keys(updatedAnswers).length;
      if (submittedCount >= playerCount) {
        update(ref(db, 'rooms/' + roomCode), {
          answered: true,
          winner: null
        });
      }
    }

    setSubmitted(true);
  };

  useEffect(() => {
    if (
      mode === 'multi' &&
      gameState &&
      !gameState.gameOver &&
      gameState.answers
    ) {
      const playerCount = Object.keys(gameState.players).length;
      const answeredCount = Object.keys(gameState.answers).length;

      if (playerCount === 1 && answeredCount === 1 && gameState.answered) {
        if (gameState.currentQuestion + 1 >= gameState.questions.length) {
          update(ref(db, 'rooms/' + roomCode), { gameOver: true });
        } else {
          update(ref(db, 'rooms/' + roomCode), {
            currentQuestion: gameState.currentQuestion + 1,
            answered: false,
            winner: null,
            answers: {}
          });
        }
      }

      if (playerCount === 2 && answeredCount === 2 && gameState.answered) {
        if (gameState.currentQuestion + 1 >= gameState.questions.length) {
          update(ref(db, 'rooms/' + roomCode), { gameOver: true });
        } else {
          update(ref(db, 'rooms/' + roomCode), {
            currentQuestion: gameState.currentQuestion + 1,
            answered: false,
            winner: null,
            answers: {}
          });
        }
      }
    }
  }, [gameState, mode, roomCode]);

  if (!mode) {
    return (
      <div>
        <h2>בחר מצב משחק</h2>
        <button onClick={() => {
          setMode('single');
          setSingleQuestions(generateQuestions());
          setSingleCurrent(0);
          setSingleScore(0);
          setSingleAnswer(0);
          setSingleSubmitted(false);
          setSingleShowResult(false);
        }}>
          משחק יחיד
        </button>
        <button onClick={() => setMode('multi')}>שני שחקנים אונליין</button>
      </div>
    );
  }

  if (mode === 'single') {
    if (singleShowResult) {
      return (
        <ResultScreen
          score={singleScore}
          totalQuestions={singleQuestions.length}
          onRestart={() => {
            setSingleQuestions(generateQuestions());
            setSingleCurrent(0);
            setSingleScore(0);
            setSingleAnswer(0);
            setSingleSubmitted(false);
            setSingleShowResult(false);
          }}
          onBackToMain={() => setMode(null)}
        />
      );
    }

    const q = singleQuestions[singleCurrent];
    const correctAnswer = q.a + q.b;

    return (
      <div>
        <h3>שאלה {singleCurrent + 1} מתוך {singleQuestions.length}</h3>
        <Question a={q.a} b={q.b} />
        <Thermometer
          userAnswer={singleAnswer}
          setUserAnswer={setSingleAnswer}
          disabled={singleSubmitted}
        />
        {!singleSubmitted ? (
          <button
            onClick={() => {
              setSingleSubmitted(true);
              if (singleAnswer === correctAnswer) {
                setSingleScore(s => s + 1);
              }
              setTimeout(() => {
                if (singleCurrent < singleQuestions.length - 1) {
                  setSingleCurrent(i => i + 1);
                  setSingleAnswer(0);
                  setSingleSubmitted(false);
                } else {
                  setSingleShowResult(true);
                }
              }, 1000);
            }}
          >
            בדוק
          </button>
        ) : (
          <div style={{ margin: 10 }}>
            {singleAnswer === correctAnswer
              ? 'תשובה נכונה!'
              : `תשובה לא נכונה. התשובה הנכונה: ${correctAnswer}`}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <h4>ניקוד: {singleScore}</h4>
        </div>
      </div>
    );
  }

  if (mode === 'multi' && gameState?.gameOver) {
    const players = gameState.players;
    const sorted = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
    const [winnerName, winnerData] = sorted[0];

    return (
      <Feedback
        userAnswer={null}
        correctAnswer={null}
        submitted={true}
        onBackToMain={() => window.location.reload()}
      >
        <h2>המשחק הסתיים!</h2>
        <h3>המנצח: {winnerName} עם {winnerData.score} נקודות 🎉</h3>
      </Feedback>
    );
  }

  if (mode === 'multi' && !roomCode) {
    return (
      <div>
        <h2>משחק לשני שחקנים אונליין</h2>
        <input
          placeholder="שם שחקן"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div style={{ margin: 10 }}>
          <button onClick={handleCreateRoom}>צור חדר חדש</button>
        </div>
        <div style={{ margin: 10 }}>
          <input
            placeholder="קוד חדר"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase', marginBottom: 10 }}
          />
          <button onClick={handleJoinRoom}>הצטרף לחדר קיים</button>
        </div>
      </div>
    );
  }

  if (mode === 'multi' && gameState && Object.keys(gameState.players).length < 2) {
    return (
      <div>
        <h2>קוד החדר שלך:</h2>
        <div style={{ fontSize: 32, fontWeight: 'bold', margin: 10 }}>{roomCode}</div>
        <div>ממתין לשחקן נוסף...</div>
      </div>
    );
  }

  if (mode === 'multi' && gameState) {
    const { questions, currentQuestion, answered, winner } = gameState;
    const q = questions[currentQuestion];

    return (
      <div>
        <h3>שאלה {currentQuestion + 1} מתוך {questions.length}</h3>
        {!answered && (
          <Timer
            duration={30}
            onTimeUp={() => {}}
            roomCode={roomCode}
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
          />
        )}
        <Question a={q.a} b={q.b} />
        <Thermometer
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          disabled={submitted || winner}
        />
        <button onClick={handleSubmit} disabled={submitted || winner}>בדוק</button>
        {answered && (
          <div style={{ margin: 10 }}>
            {winner
              ? `הראשון שענה נכון: ${winner}`
              : 'לא התקבלה תשובה נכונה עדיין'}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <h4>ניקוד:</h4>
          {Object.entries(gameState.players).map(([name, data]) => (
            <div key={name}>{name}: {data.score}</div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default GameLobby;