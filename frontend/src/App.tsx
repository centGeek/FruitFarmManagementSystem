import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Navbar from "./components/Navbar"
import HomePage from './components/HomePage'
import InteractiveMap from './components/InteractiveMap'
import EmployeeManagement from './components/EmployeeManagement'
import ExpenseManagement from './components/ExpenseManagement'
import ProfitsManagement from './components/ProfitsManagement'
import WorkSchedule from './components/WorkSchedule'
import WeatherNotifications from './components/WeatherNotifications'
import GardenerProfile from './components/GardenerProfile'
import AnalysisPage from './components/AnalysisPage'


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null) 
  
  const [isLoading, setIsLoading] = useState(true)

  const extractRoleFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles?.[0] || null; // Zwróć pierwszą rolę
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
          setIsLoggedIn(false);
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Wyciągnij rolę z tokenu przed weryfikacją
        const role = extractRoleFromToken(token);

        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setIsLoggedIn(true);
          setUserRole(role);
        } else {
          // Token nieprawidłowy, usuń go
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsLoggedIn(false);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    // Wyciągnij rolę po zalogowaniu
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      const role = extractRoleFromToken(token);
      setUserRole(role);
    }
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      });
      
      setIsLoggedIn(false);
      setUserRole(null);
    }
  };

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/home" replace />;    
      }
    
    return children;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sprawdzanie autentyfikacji...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar onLogout={handleLogout} userRole={userRole} />}
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              userRole === "Admin" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/register" 
          element={
            isLoggedIn ? (
              userRole === "Admin" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <RegisterPage onLogin={handleLogin} />
            )
          } 
        />
        
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <InteractiveMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <ExpenseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profits"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <ProfitsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-schedule"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <WorkSchedule/>
            </ProtectedRoute>
          }
        />
           <Route
          path="/weather"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <WeatherNotifications/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={["Gardener", "Admin"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gardener-profile"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <GardenerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyse"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <AnalysisPage/>
            </ProtectedRoute>
          }
        />        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App