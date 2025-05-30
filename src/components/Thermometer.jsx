import React from 'react';
import './Thermometer.css';
import thermometerBg from '../assets/thermometer-bg.png';

function Thermometer({ userAnswer, setUserAnswer, disabled }) {
  const min = -20;
  const max = 20;

  return (
    <div className="thermometer-container">
      {/* Show the selected value above the thermometer */}
      <div className="selected-value" style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 24 }}>
        {userAnswer}°C
      </div>
      <div className="thermometer-bg-wrapper">
        <img src={thermometerBg} alt="Thermometer Background" className="thermometer-bg" />

        <div className="scale-overlay" style={{ pointerEvents: 'none' }}>
          <span className="min-label">{min}°C</span>
          <span className="max-label">{max}°C</span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={userAnswer}
          onChange={e => setUserAnswer(Number(e.target.value))}
          disabled={disabled}
          className="thermometer-slider"
          style={{
            width: '100%',
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 2,
            pointerEvents: disabled ? 'none' : 'auto'
          }}
        />
      </div>
    </div>
  );
}

export default Thermometer;
