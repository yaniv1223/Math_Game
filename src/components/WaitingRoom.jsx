
import React from 'react';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';

function WaitingRoom({ gameId, gameData, user, playerRole }) {
  const setReady = async () => {
    const playerPath = `${playerRole}/ready`;
    await update(ref(database, `games/${gameId}`), {
      [playerPath]: true
    });
  };

  return (
    <div style={{ textAlign: 'center', padding: 20, direction: 'rtl' }}>
      <h2>חדר המתנה</h2>
      <div style={{
        background: '#f7f7f7',
        borderRadius: 12,
        padding: 20,
        margin: '20px auto',
        maxWidth: 500
      }}>
        <h3>קוד משחק: {gameId}</h3>
        <p>שתף את הקוד הזה עם חבר כדי שיוכל להצטרף למשחק</p>

        <div style={{ margin: '20px 0', padding: 15 }}>
          <div style={{ marginBottom: 10 }}>
            <strong>שחקן 1:</strong> {gameData.host?.name || 'ממתין...'}
            {gameData.host?.ready && ' (מוכן)'}
          </div>
          
          <div style={{ marginBottom: 10 }}>
            <strong>שחקן 2:</strong> {gameData.guest?.name || 'ממתין לשחקן...'}
            {gameData.guest?.ready && ' (מוכן)'}
          </div>
        </div>

        {playerRole && !gameData[playerRole]?.ready && (
          <button 
            onClick={setReady}
            style={{ 
              fontSize: 18, 
              padding: '8px 24px', 
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            אני מוכן להתחיל
          </button>
        )}
        
        {gameData.host?.ready && gameData.guest?.ready && (
          <p style={{ fontWeight: 'bold', color: 'green' }}>
            שני השחקנים מוכנים! המשחק יתחיל מיד...
          </p>
        )}
        
        {gameData.host?.ready && !gameData.guest?.ready && gameData.guest && (
          <p>ממתין לשחקן השני שיהיה מוכן...</p>
        )}
        
        {!gameData.host?.ready && gameData.guest?.ready && (
          <p>ממתין לשחקן הראשון שיהיה מוכן...</p>
        )}
        
        {!gameData.guest && (
          <p>ממתין לשחקן נוסף שיצטרף...</p>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
