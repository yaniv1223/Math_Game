import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, set, update, onValue } from 'firebase/database';
import Question from './Question';
import ResultScreen from './ResultScreen';
import Thermometer from './Thermometer';

// Generates a random room code
function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateQuestions(num = 10) {
  return Array.from({ length: num }, () => ({
    a: Math.floor(Math.random() * 21) - 10,
    b: Math.floor(Math.random() * 21) - 10,
  }));
}

const GameLobby = () => {
  // Mode: null, 'single', or 'multi'
  const [mode, setMode] = useState(null);

  // Shared state
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [createdRoom, setCreatedRoom] = useState('');

  // Single player state
  const [singleQuestions, setSingleQuestions] = useState([]);
  const [singleCurrent, setSingleCurrent] = useState(0);
  const [singleScore, setSingleScore] = useState(0);
  const [singleAnswer, setSingleAnswer] = useState(0);
  const [singleSubmitted, setSingleSubmitted] = useState(false);
  const [singleShowResult, setSingleShowResult] = useState(false);

  // Multiplayer state
  const [userAnswer, setUserAnswer] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // --- MODE SELECTION ---
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
        <button onClick={() => setMode('multi')} style={{ marginRight: 10 }}>
          שני שחקנים אונליין
        </button>
      </div>
    );
  }

  // --- SINGLE PLAYER MODE ---
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
            }}
            style={{ marginTop: 10 }}
          >
            בדוק
          </button>
        ) : (
          <div style={{ margin: 10 }}>
            {singleAnswer === correctAnswer
              ? "תשובה נכונה!"
              : `תשובה לא נכונה. התשובה הנכונה: ${correctAnswer}`}
            <br />
            {singleCurrent < singleQuestions.length - 1 ? (
              <button
                onClick={() => {
                  setSingleCurrent(i => i + 1);
                  setSingleAnswer(0);
                  setSingleSubmitted(false);
                }}
              >
                לשאלה הבאה
              </button>
            ) : (
              <button onClick={() => setSingleShowResult(true)}>
                סיים משחק
              </button>
            )}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <h4>ניקוד: {singleScore}</h4>
        </div>
      </div>
    );
  }

  // --- MULTIPLAYER MODE ---

  // Create a new room in Firebase
  const handleCreateRoom = async () => {
    if (!playerName) {
      alert('Please enter your name');
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
      winner: null
    });
    setCreatedRoom(code);
  };

  // Join an existing room in Firebase
  const handleJoinRoom = async () => {
    if (!playerName || !joinCode) {
      alert('Please enter your name and room code');
      return;
    }
    await update(ref(db, 'rooms/' + joinCode + '/players'), {
      [playerName]: { score: 0 }
    });
    setRoomCode(joinCode);
  };

  // Listen for game state changes in Firebase
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, 'rooms/' + roomCode);
    return onValue(roomRef, (snapshot) => {
      setGameState(snapshot.val());
      setSubmitted(false);
      setUserAnswer(0);
    });
  }, [roomCode]);

  // Handle answer submission in multiplayer
  const handleSubmit = () => {
    if (!gameState || gameState.answered) return;
    const { questions, currentQuestion } = gameState;
    const correctAnswer = questions[currentQuestion].a + questions[currentQuestion].b;
    if (userAnswer === correctAnswer) {
      // First correct answer wins the point
      update(ref(db, 'rooms/' + roomCode), {
        [`players/${playerName}/score`]: (gameState.players[playerName]?.score || 0) + 1,
        answered: true,
        winner: playerName
      });
    } else {
      update(ref(db, 'rooms/' + roomCode), {
        answered: true,
        winner: null
      });
    }
    setSubmitted(true);
  };

  // Automatically move to next question after answer in multiplayer
  useEffect(() => {
    if (
      mode === 'multi' &&
      gameState &&
      gameState.answered &&
      gameState.currentQuestion < gameState.questions.length - 1
    ) {
      // Wait 1.5 seconds, then update Firebase to move to next question
      const timer = setTimeout(() => {
        update(ref(db, 'rooms/' + roomCode), {
          currentQuestion: gameState.currentQuestion + 1,
          answered: false,
          winner: null
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [mode, gameState, roomCode]);

  // Show lobby UI if not in a room (MULTIPLAYER)
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
          <button
            onClick={() => {
              if (!playerName) {
                alert('הכנס שם שחקן');
                return;
              }
              handleCreateRoom();
            }}
          >
            צור חדר חדש
          </button>
        </div>
        <div style={{ margin: 10 }}>
          <input
            placeholder="קוד חדר"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase', marginBottom: 10 }}
          />
          <button
            onClick={() => {
              if (!playerName || !joinCode) {
                alert('הכנס שם שחקן וקוד חדר');
                return;
              }
              handleJoinRoom();
            }}
          >
            הצטרף לחדר קיים
          </button>
        </div>
      </div>
    );
  }

  // Show waiting screen if only one player is in the room
  if (mode === 'multi' && gameState && Object.keys(gameState.players).length < 2) {
    return (
      <div>
        <h2>Your room code:</h2>
        <div style={{ fontSize: 32, fontWeight: 'bold', margin: 10 }}>{roomCode}</div>
        <div>Waiting for another player...</div>
      </div>
    );
  }

  // Show result screen if all questions are finished
  if (
    mode === 'multi' &&
    gameState &&
    gameState.currentQuestion >= gameState.questions.length
  ) {
    return (
      <ResultScreen
        score={gameState.players[playerName]?.score || 0}
        totalQuestions={gameState.questions.length}
        onRestart={() => window.location.reload()}
        extraContent={
          <div>
            <h4>Results:</h4>
            {Object.entries(gameState.players).map(([name, data]) => (
              <div key={name}>{name}: {data.score}</div>
            ))}
          </div>
        }
      />
    );
  }

  // Show game UI for multiplayer
  if (mode === 'multi' && gameState) {
    const { questions, currentQuestion, answered, winner } = gameState;
    const q = questions[currentQuestion];
    const correctAnswer = q.a + q.b;
    return (
      <div>
        <h3>Question {currentQuestion + 1} of {questions.length}</h3>
        <Question a={q.a} b={q.b} />
        <Thermometer
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          disabled={submitted || answered}
        />
        <button onClick={handleSubmit} disabled={submitted || answered}>Submit Answer</button>
        {answered && (
          <div style={{ margin: 10 }}>
            {winner
              ? `First to answer correctly: ${winner}`
              : 'No correct answer was submitted'}
            <br />
            <span>Moving to the next question...</span>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <h4>Scores:</h4>
          {Object.entries(gameState.players).map(([name, data]) => (
            <div key={name}>{name}: {data.score}</div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback if nothing matches
  return null;
};

export default GameLobby;