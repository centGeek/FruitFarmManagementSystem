import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Navbar from "./components/Navbar"
import HomePage from './components/HomePage'
import InteractiveMap from './components/InteractiveMap'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true) // tymczasowo zalogowany

  const handleLogout = () => {
    // Wyczyszczenie wszystkich ciastek
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    setIsLoggedIn(false) // ustawiamy użytkownika jako wylogowanego
  }

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/home"
          element={isLoggedIn ? <HomePage /> : <Navigate to="/" />}
        />
        <Route
          path="/map"
          element={isLoggedIn ? <InteractiveMap /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
