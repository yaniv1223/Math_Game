import React from 'react';

const MultipleChoiceQuestion = ({ question, options, onSelect, selected, disabled }) => (
  <div>
    <div style={{ marginBottom: 16 }}>{question}</div>
    {options.map(opt => (
      <label
        key={opt}
        style={{
          marginRight: 24,
          marginBottom: 16,
          padding: '12px 24px',
          borderRadius: 8,
          background: selected === opt ? '#2196f3' : '#f0f0f0',
          color: selected === opt ? '#fff' : '#000',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-block',
          minWidth: 80,
          minHeight: 48,
          textAlign: 'center',
          boxSizing: 'border-box',
          border: selected === opt ? '2px solid #1976d2' : '2px solid #e0e0e0',
          fontSize: 18,
          fontWeight: 500,
          verticalAlign: 'top'
        }}
      >
        <input
          type="radio"
          name="mcq"
          value={opt}
          checked={selected === opt}
          onChange={() => onSelect(opt)}
          disabled={disabled}
          style={{ marginRight: 8, marginLeft: 4 }}
        />
        {opt}
      </label>
    ))}
  </div>
);

export default MultipleChoiceQuestion;
