import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Navbar from "./components/Navbar"
import HomePage from './components/HomePage'
import InteractiveMap from './components/InteractiveMap'
import EmployeeManagement from './components/EmployeeManagement'
import ExpenseManagement from './components/ExpenseManagement'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null) // Dodana rola użytkownika
  const [isLoading, setIsLoading] = useState(true)

  // Funkcja do wyciągania roli z JWT tokenu
  const extractRoleFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles?.[0] || null; // Zwróć pierwszą rolę
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  // Sprawdź stan autentyfikacji przy ładowaniu aplikacji
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
        // Powiadom backend o wylogowaniu
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
      // Wyczyść tokeny i ciasteczka
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Wyczyszczenie wszystkich ciastek
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      });
      
      setIsLoggedIn(false);
      setUserRole(null);
    }
  };

  // Komponenty ProtectedRoute dla różnych ról
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Przekieruj do odpowiedniej domyślnej strony na podstawie roli
      if (userRole === "Admin") {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRole === "Gardener") {
        return <Navigate to="/home" replace />;
      }
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  // Pokaż loading podczas sprawdzania autentyfikacji
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
        
        {/* Trasy dla Gardener */}
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
              <div>Profits Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <div>Management Page</div>
            </ProtectedRoute>
          }
        />
        
        {/* Trasy dostępne dla obu ról */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={["Gardener", "Admin"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        
        {/* Trasy dla Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Admin Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Users Management</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Reports Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Settings Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Analytics Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/systems"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>Systems Page</div>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App