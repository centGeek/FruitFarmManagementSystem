import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import AboutPage from './components/AboutPage'
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import HomePage from './components/homePage/HomePage'
import InteractiveMap from './components/interactiveMap/OrchardMapSystem'
import EmployeeManagement from './components/employeeManagement/EmployeeManagement'
import ExpenseManagement from './components/expenseManagement/ExpenseManagement'
import ProfitsManagement from './components/profitManagement/ProfitManagement'
import WorkSchedule from './components/workSchedule/WorkEntryManagement'
import WeatherNotifications from './components/weatherNotifications/WeatherNotifications'
import GardenerProfile from './components/gardenerProfile/GardenerProfile'
import AnalysisPage from './components/analytics/ProfitAnalysis'
import Support from './components/support/Support'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUsers from './components/admin/AdminUsers'
import AdminStats from './components/admin/AdminStats'
import { BACKEND_URL} from "./utils/apiConfigs";


function App() {
  const { t } = useTranslation()
  // Trzy stany zamiast pary boolean: dzięki 'unknown' nie blokujemy CAŁEJ aplikacji
  // pełnoekranowym spinnerem podczas weryfikacji — publiczna strona logowania renderuje się od razu.
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authed' | 'anon'>('unknown')
  const [userRole, setUserRole] = useState(null)
  const [isWaking, setIsWaking] = useState(false)
  const isLoggedIn = authStatus === 'authed'

useEffect(() => {
    const controller = new AbortController();
    // Backend na Azure (scale-to-zero) potrafi zimno startować kilkadziesiąt sekund.
    // Po 3 s pokazujemy komunikat „budzenie serwera". NIE przerywamy weryfikacji po timeoucie —
    // inaczej zalogowany użytkownik z ważną sesją zostałby wyrzucony do logowania w trakcie
    // zimnego startu. Backstopem jest proxy_read_timeout nginx (504 → response !ok → 'anon').
    const wakeTimer = setTimeout(() => setIsWaking(true), 3000);

    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.roles[0]);
          setAuthStatus('authed');
        } else {
          setAuthStatus('anon');
        }
      } catch (error) {
        // Przerwanie przy odmontowaniu/cleanupie ignorujemy; realny błąd sieci → wylogowany
        if ((error as any)?.name !== 'AbortError') {
          setAuthStatus('anon');
        }
      } finally {
        clearTimeout(wakeTimer);
      }
    };
    checkAuthStatus();

    return () => {
      clearTimeout(wakeTimer);
      controller.abort();
    };
  }, []);

  const handleLogin = (role) => {
    setUserRole(role);
    setAuthStatus('authed');
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
      setAuthStatus('anon');
      setUserRole(null);
      window.location.href = '/';
    }
  };

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    // Dopóki weryfikacja trwa, nie wyrzucaj zalogowanego użytkownika (Navigate) ani nie
    // pokazuj treści chronionej — spinner trzymamy TYLKO w obrębie trasy chronionej.
    if (authStatus === 'unknown') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('app.checkingAuth')}</p>
            {isWaking && (
              <p className="mt-2 text-sm text-gray-400">{t('app.wakingServer')}</p>
            )}
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/home" replace />;
    }

    return children;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {isLoggedIn && <Navbar onLogout={handleLogout} userRole={userRole} />}
        <div className="flex-1 flex flex-col">
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
        <Route path="/about" element={<AboutPage />} />

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
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App