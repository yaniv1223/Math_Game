
import React from 'react';

function PlayerStats({ hostData, guestData, currentPlayer }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', direction: 'rtl' }}>
      <div style={{ 
        padding: '10px 15px',
        borderRadius: '8px',
        backgroundColor: currentPlayer === 'host' ? '#e6f7ff' : 'transparent',
        border: currentPlayer === 'host' ? '2px solid #4285f4' : '1px solid #ddd',
      }}>
        <strong>{hostData?.name || 'שחקן 1'}</strong>
        <div>ניקוד: {hostData?.score || 0}</div>
      </div>
      
      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '0 10px' }}>
        נגד
      </div>
      
      <div style={{ 
        padding: '10px 15px',
        borderRadius: '8px',
        backgroundColor: currentPlayer === 'guest' ? '#e6f7ff' : 'transparent',
        border: currentPlayer === 'guest' ? '2px solid #4285f4' : '1px solid #ddd',
      }}>
        <strong>{guestData?.name || 'שחקן 2'}</strong>
        <div>ניקוד: {guestData?.score || 0}</div>
      </div>
    </div>
  );
}

export default PlayerStats;
