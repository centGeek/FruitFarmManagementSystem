import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { BACKEND_URL} from "./utils/apiConfigs";

// Code-splitting: every authenticated/feature page is lazy-loaded so the initial bundle (login
// screen) no longer ships leaflet, recharts, the calendar and all admin/feature code. Each page
// becomes its own chunk fetched only when its route opens. LoginPage/Navbar/Footer stay eager
// because they render on the very first paint. React.lazy needs a default export — all these have one.
const RegisterPage = lazy(() => import('./components/RegisterPage'))
const HomePage = lazy(() => import('./components/homePage/HomePage'))
const InteractiveMap = lazy(() => import('./components/interactiveMap/OrchardMapSystem'))
const EmployeeManagement = lazy(() => import('./components/employeeManagement/EmployeeManagement'))
const ExpenseManagement = lazy(() => import('./components/expenseManagement/ExpenseManagement'))
const ProfitsManagement = lazy(() => import('./components/profitManagement/ProfitManagement'))
const WorkSchedule = lazy(() => import('./components/workSchedule/WorkEntryManagement'))
const WeatherNotifications = lazy(() => import('./components/weatherNotifications/WeatherNotifications'))
const GardenerProfile = lazy(() => import('./components/gardenerProfile/GardenerProfile'))
const AnalysisPage = lazy(() => import('./components/analytics/ProfitAnalysis'))
const Support = lazy(() => import('./components/support/Support'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'))
const AdminStats = lazy(() => import('./components/admin/AdminStats'))

// Fallback widoczny przez moment, gdy pobierany jest chunk danej strony.
const PageFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Ładowanie...</p>
    </div>
  </div>
);


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
      <div className="min-h-screen flex flex-col">
        {isLoggedIn && <Navbar onLogout={handleLogout} userRole={userRole} />}
        <div className="flex-1 flex flex-col">
      <Suspense fallback={<PageFallback />}>
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
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={["Gardener"]}>
              <Support/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminUsers/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminStats/>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App