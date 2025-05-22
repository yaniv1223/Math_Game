import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Thermometer from "../components/Thermometer";
import Feedback from "../components/Feedback";

function MultiplayerGame({ gameId, playerId }) {
  const [gameState, setGameState] = useState(null);
  const [playerAnswer, setPlayerAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data?.questions && typeof data.currentQuestion === "number") {
          setGameState(data);
          setPlayerAnswer(data.answers?.[playerId] ?? null);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, playerId]);

  const handleAnswer = async (value) => {
    const updatedAnswers = {
      ...(gameState.answers || {}),
      [playerId]: value,
    };

    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, { answers: updatedAnswers });

    setPlayerAnswer(value);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  if (
    !gameState ||
    !Array.isArray(gameState.questions) ||
    typeof gameState.currentQuestion !== "number" ||
    !gameState.questions[gameState.currentQuestion]
  ) {
    return <div>טוען משחק...</div>;
  }

  const currentQ = gameState.questions[gameState.currentQuestion];
  const correctAnswer = currentQ.correctAnswer;

  return (
    <div className="multiplayer-game">
      <h2>שאלה {gameState.currentQuestion + 1}</h2>
      <p>{currentQ.question}</p>

      <Thermometer
        value={playerAnswer}
        onChange={handleAnswer}
        disabled={playerAnswer !== null}
      />

      {showFeedback && (
        <Feedback
          isCorrect={playerAnswer === correctAnswer}
          correctAnswer={correctAnswer}
        />
      )}
    </div>
  );
}

export default MultiplayerGame;
