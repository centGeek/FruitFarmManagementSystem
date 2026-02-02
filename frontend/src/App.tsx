import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Navbar from "./components/Navbar"
import HomePage from './components/homePage/HomePage'
import InteractiveMap from './components/interactiveMap/OrchardMapSystem'
import EmployeeManagement from './components/employeeManagement/EmployeeManagement'
import ExpenseManagement from './components/expenseManagement/ExpenseManagement'
import ProfitsManagement from './components/profitManagement/ProfitManagement'
import WorkSchedule from './components/workSchedule/WorkEntryManagement'
import WeatherNotifications from './components/weatherNotifications/WeatherNotifications'
import GardenerProfile from './components/gardenerProfile/GardenerProfile'
import AnalysisPage from './components/analytics/ProfitAnalysis'
import { BACKEND_URL} from "./utils/apiConfigs";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null) 
  
  const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserRole(data.roles[0]);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Błąd weryfikacji:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    } finally {
      setIsLoggedIn(false);
      setUserRole(null);
      window.location.href = '/';
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
              (
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
            <ProtectedRoute allowedRoles={["Gardener"]}>
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