import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import logo from 'C:/Users/admin/Documents/GitHub/Math_Game/public/logo.svg'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <img src={logo} alt="Logo" style={{ width: 80, height: 80, marginBottom: 16 }} />
      <App />
    </div>
  </StrictMode>,
)
