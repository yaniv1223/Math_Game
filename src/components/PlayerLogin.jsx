import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';

function PlayerLogin({ onLogin }) {
  const [playerName, setPlayerName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const result = await signInAnonymously(auth);
      const name = playerName || `שחקן_${Math.floor(Math.random() * 1000)}`;
      
      await updateProfile(result.user, {
        displayName: name
      });
      
      if (onLogin) {
        onLogin(result.user);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <h2>התחברות למשחק</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="הכנס את שמך"
          style={{ padding: '8px 12px', margin: '10px 0', direction: 'rtl' }}
        />
        <div>
          <button 
            type="submit" 
            style={{ 
              fontSize: 18, 
              padding: '8px 24px', 
              marginTop: 10, 
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            התחבר
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlayerLogin;