import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import InteractiveMap from './components/InteractiveMap'
import LoginPage from './components/LoginPage'  // import LoginPage

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/map" element={<InteractiveMap />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
