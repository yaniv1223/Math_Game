import React, { useState, useEffect } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from '../firebase';
import Question from './Question';
import Thermometer from './Thermometer';
import Timer from './Timer';
import Feedback from './Feedback';
import ResultScreen from './ResultScreen';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';

// Multiple choice questions about negative numbers
const generateOpenQuestions = () => ([
  {
    type: 'open',
    question: 'איזה מהמספרים הבאים הוא הגדול ביותר?',
    options: ['-17', '-3', '-12', '5'],
    correctAnswer: '5'
  },
  {
    type: 'open',
    question: 'איזה מהמספרים הבאים נמצא בין (10-) ל0 ?',
    options: ['-5', '-12', '3', '1'],
    correctAnswer: '-5'
  },
  {
    type: 'open',
    question: 'איזה מהבאים קטן מ(15-)?',
    options: ['-10', '-18', '-5', '0'],
    correctAnswer: '-18'
  },
  {
    type: 'open',
    question: 'איזה מספר גדול(5-) אבל קטן מ5?',
    options: ['0', '6', '-6', '10'],
    correctAnswer: '0'
  },
  {
    type: 'open',
    question: '?מהו הערך הנמוך ביותר ',
    options: ['-2', '0', '7', '-9'],
    correctAnswer: '-9'
  },
  {
    type: 'open',
    question: 'איזה מהמספרים הבאים שווה בערכו המוחלט ל־7?',
    options: ['7', '-7', '-14', '0'],
    correctAnswer: '-7'
  },
  {
    type: 'open',
    question: 'איזה מהמספרים הבאים נמצא בתחום [10-,20-]?',
    options: ['-8', '-15', '0', '-5'],
    correctAnswer: '-15'
  },
  {
    type: 'open',
    question: 'מהו המספר היחיד ברשימה שהוא חיובי?',
    options: ['-2', '-11', '4', '-1'],
    correctAnswer: '4'
  },
  {
    type: 'open',
    question: 'איזה מספר מהבאים הוא הקטן ביותר?',
    options: ['-19', '-3', '0', '7'],
    correctAnswer: '-19'
  },
  {
    type: 'open',
    question: '[(-10),10] איזה מהמספרים הבאים נמצא מחוץ לתחום ?',
    options: ['-8', '-13', '5', '0'],
    correctAnswer: '-13'
  }
]);

const generateMathQuestions = (num = 10) => {
  return Array.from({ length: num }, () => ({
    type: 'math',
    a: Math.floor(Math.random() * 21) - 10,
    b: Math.floor(Math.random() * 21) - 10
  }));
};

const generateQuestions = (types, count = 10) => {
  const questions = [];

  const mathQs = types.math ? generateMathQuestions(count) : [];
  const mcqQs = types.mcq ? generateOpenQuestions().slice(0, count) : [];

  const maxLength = Math.max(mathQs.length, mcqQs.length);

  for (let i = 0; i < maxLength; i++) {
    if (types.math && mathQs[i]) {
      questions.push(mathQs[i]);
    }
    if (types.mcq && mcqQs[i]) {
      questions.push(mcqQs[i]);
    }
  }

  return questions.slice(0, count);
};

const generateRoomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const GameLobby = () => {
  // Multiplayer state
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Single player state
  const [questionTypes, setQuestionTypes] = useState({ math: false, mcq: false });
  const [questionTypeSelected, setQuestionTypeSelected] = useState(false);

  // Multiplayer room creation state
  const [multiQuestionTypes, setMultiQuestionTypes] = useState({ math: true, mcq: false });
  const [multiTypeSelected, setMultiTypeSelected] = useState(false);

  const [singleQuestions, setSingleQuestions] = useState([]);
  const [singleCurrent, setSingleCurrent] = useState(0);
  const [singleScore, setSingleScore] = useState(0);
  const [singleAnswer, setSingleAnswer] = useState(null);
  const [singleSubmitted, setSingleSubmitted] = useState(false);
  const [singleShowResult, setSingleShowResult] = useState(false);

  // --- Multiplayer handlers ---
  // Room creator selects question types before creating room
  const handleCreateRoom = async () => {
    if (!playerName) {
      alert('הכנס שם שחקן');
      return;
    }
    if (!multiQuestionTypes.math && !multiQuestionTypes.mcq) {
      alert('יש לבחור לפחות סוג אחד של שאלות');
      return;
    }
    const code = generateRoomCode();
    const questions = generateQuestions(multiQuestionTypes, 10);
    await set(ref(db, 'rooms/' + code), {
      players: {
        [playerName]: { score: 0 }
      },
      questions,
      questionTypes: multiQuestionTypes, // store types in room
      currentQuestion: 0,
      answered: false,
      winner: null,
      answers: {},
      gameOver: false
    });
    setRoomCode(code);
    setMode('multi'); // Make sure to set mode to 'multi'
  };

  // When joining, fetch questionTypes from room if needed (optional, for UI)
  const handleJoinRoom = async () => {
    if (!playerName || !joinCode) {
      alert('הכנס שם שחקן וקוד חדר');
      return;
    }
    await update(ref(db, 'rooms/' + joinCode + '/players'), {
      [playerName]: { score: 0 }
    });
    setRoomCode(joinCode);
    setMode('multi'); // <-- Add this line
  };

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, 'rooms/' + roomCode);
    return onValue(roomRef, (snapshot) => {
      setGameState(snapshot.val());
      setSubmitted(!!snapshot.val()?.answers?.[playerName]);
      setUserAnswer(snapshot.val()?.answers?.[playerName] ?? null);
    });
  }, [roomCode, playerName]);

  const handleSubmitMulti = () => {
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
        [`answers/${playerName}`]: userAnswer
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
      gameState.answered
    ) {
      const timeoutId = setTimeout(() => {
        if (gameState.currentQuestion + 1 >= gameState.questions.length) {
          update(ref(db, 'rooms/' + roomCode), { gameOver: true });
        } else {
          update(ref(db, 'rooms/' + roomCode), {
            currentQuestion: gameState.currentQuestion + 1,
            answered: false,
            winner: null,
            answers: {}
          });
          setSubmitted(false);
          setUserAnswer(0);
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState?.answered, gameState?.currentQuestion, mode, roomCode]);

  // Single player logic
  const handleCheckboxChange = (type) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const proceedAfterSelectingType = (modeType) => {
    if (!questionTypes.math && !questionTypes.mcq) {
      alert("יש לבחור לפחות סוג אחד של שאלות");
      return;
    }
    setMode(modeType);
    const questions = generateQuestions(questionTypes, 10);
    setSingleQuestions(questions);
    setSingleCurrent(0);
    setSingleScore(0);
    setSingleAnswer(null);
    setSingleSubmitted(false);
    setSingleShowResult(false);
  };

  // 
  if (!mode && !questionTypeSelected && !multiTypeSelected) {
    return (
      <div>
        <h2>בחר מצב משחק</h2>
        <button onClick={() => setQuestionTypeSelected(true)}>משחק יחיד</button>
        <button onClick={() => setMultiTypeSelected(true)}>שני שחקנים אונליין</button>
      </div>
    );
  }

  // --- Single player type selection ---
  if (questionTypeSelected && !mode) {
    return (
      <div>
        <h3>בחר סוג שאלות:</h3>
        <label>
          <input
            type="checkbox"
            checked={questionTypes.math}
            onChange={() => setQuestionTypes(prev => ({ ...prev, math: !prev.math }))}
          />
          שאלות חיבור/חיסור
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={questionTypes.mcq}
            onChange={() => setQuestionTypes(prev => ({ ...prev, mcq: !prev.mcq }))}
          />
          שאלות אמריקאיות
        </label>
        <br />
        <button onClick={() => {
          if (!questionTypes.math && !questionTypes.mcq) {
            alert("יש לבחור לפחות סוג אחד של שאלות");
            return;
          }
          setMode('single');
          const questions = generateQuestions(questionTypes, 10);
          setSingleQuestions(questions);
          setSingleCurrent(0);
          setSingleScore(0);
          setSingleAnswer(null);
          setSingleSubmitted(false);
          setSingleShowResult(false);
        }}>המשך למשחק יחיד</button>
      </div>
    );
  }

  // --- Multiplayer type selection (room creator) ---
  if (multiTypeSelected && !mode) {
    return (
      <div>
        <h3>בחר סוג שאלות לחדר:</h3>
        <label>
          <input
            type="checkbox"
            checked={multiQuestionTypes.math}
            onChange={() => setMultiQuestionTypes(prev => ({ ...prev, math: !prev.math }))}
          />
          שאלות חיבור/חיסור
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={multiQuestionTypes.mcq}
            onChange={() => setMultiQuestionTypes(prev => ({ ...prev, mcq: !prev.mcq }))}
          />
          שאלות אמריקאיות
        </label>
        <br />
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

  // --- Multiplayer waiting for players ---
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

  // --- Multiplayer waiting for second player ---
  if (mode === 'multi' && gameState && Object.keys(gameState.players).length < 2) {
    return (
      <div>
        <h2>קוד החדר שלך:</h2>
        <div style={{ fontSize: 32, fontWeight: 'bold', margin: 10 }}>{roomCode}</div>
        <div>ממתין לשחקן נוסף...</div>
      </div>
    );
  }

  // --- Multiplayer game UI ---
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
        {q.type === 'math' && (
          <>
            <Question a={q.a} b={q.b} />
            <Thermometer
              userAnswer={userAnswer ?? 0}
              setUserAnswer={setUserAnswer}
              disabled={submitted || winner}
            />
          </>
        )}
        {q.type === 'open' && (
          <MultipleChoiceQuestion
            question={q.question}
            options={q.options}
            onSelect={setUserAnswer}
            selected={userAnswer}
            disabled={submitted || winner}
          />
        )}
        <button onClick={handleSubmitMulti} disabled={submitted || winner}>בדוק</button>
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

  // --- Single player UI (unchanged) ---
  if (mode === 'single') {
    if (singleShowResult) {
      return (
        <ResultScreen
          score={singleScore}
          totalQuestions={singleQuestions.length}
          onRestart={() => {
            const questions = generateQuestions(questionTypes, 10);
            setSingleQuestions(questions);
            setSingleCurrent(0);
            setSingleScore(0);
            setSingleAnswer(null);
            setSingleSubmitted(false);
            setSingleShowResult(false);
          }}
          onBackToMain={() => {
            setMode(null);
            setQuestionTypeSelected(false);
          }}
        />
      );
    }

    const q = singleQuestions[singleCurrent];

    const handleSubmit = () => {
      if (singleSubmitted) return;

      const isCorrect = q.type === 'math'
        ? singleAnswer === (q.a + q.b)
        : singleAnswer === q.correctAnswer;

      if (isCorrect) {
        setSingleScore(s => s + 1);
      }

      setSingleSubmitted(true);

      setTimeout(() => {
        if (singleCurrent < singleQuestions.length - 1) {
          setSingleCurrent(i => i + 1);
          setSingleAnswer(null);
          setSingleSubmitted(false);
        } else {
          setSingleShowResult(true);
        }
      }, 1000);
    };

    return (
      <div>
        <h3>שאלה {singleCurrent + 1} מתוך {singleQuestions.length}</h3>
        {q.type === 'math' && (
          <>
            <Question a={q.a} b={q.b} />
            <Thermometer
              userAnswer={singleAnswer ?? 0}
              setUserAnswer={setSingleAnswer}
              disabled={singleSubmitted}
            />
          </>
        )}
        {q.type === 'open' && (
          <MultipleChoiceQuestion
            question={q.question}
            options={q.options}
            onSelect={setSingleAnswer}
            selected={singleAnswer}
            disabled={singleSubmitted}
          />
        )}
        {!singleSubmitted ? (
          <button onClick={handleSubmit}>בדוק</button>
        ) : (
          <div style={{ margin: 10 }}>
            {singleAnswer === (q.correctAnswer ?? q.a + q.b)
              ? '✅ תשובה נכונה!'
              : `❌ תשובה לא נכונה. התשובה הנכונה: ${q.correctAnswer ?? q.a + q.b}`}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <h4>ניקוד: {singleScore}</h4>
        </div>
      </div>
    );
  }

  // Multiplayer UI (unchanged except for mode selection above)
  if (mode === 'multi' && gameState?.gameOver) {
    const players = gameState.players;
    const sorted = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
    const [winnerName, winnerData] = sorted[0];

    return (
      <div>
        <h2>המשחק הסתיים!</h2>
        <h3>המנצח: {winnerName} עם {winnerData.score} נקודות 🎉</h3>
        <button onClick={() => window.location.reload()}>
          חזור למסך הראשי
        </button>
      </div>
    );
  }

  return null;
};

export default GameLobby;
