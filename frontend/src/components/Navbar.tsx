import { NavLink, useNavigate } from "react-router-dom";

function GardenerNavbar({ onLogout }) {
  const navigate = useNavigate();
  
  const tabs = [
    { name: "Strona główna", path: "/home" },
    { name: "Mapa", path: "/map" },
    { name: "Pracownicy", path: "/employees" },
    { name: "Ewidencja pracy", path: "/work-schedule" },
    { name: "Wydatki", path: "/expenses" },
    { name: "Przychody", path: "/profits" },
    { name: "Notyfikacje pogodowe", path: "/weather" },
  ];

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <nav className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-lg border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div 
              className="text-lg font-bold cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={handleLogoClick}
            >
              🌱 Panel Sadownika
            </div>
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    `relative px-4 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 transform ${
                      isActive
                        ? "bg-white text-green-700 shadow-md scale-105"
                        : "hover:bg-white/10 hover:scale-105 active:scale-95"
                    }`
                  }
                >
                  {tab.name}
                </NavLink>
              ))}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-green-600"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}

function AdminNavbar({ onLogout }) {
  const navigate = useNavigate();
  
  const tabs = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Użytkownicy", path: "/admin/users" },
    { name: "Raporty", path: "/admin/reports" },
    { name: "Ustawienia", path: "/admin/settings" },
    { name: "Analityka", path: "/admin/analytics" },
    { name: "Systemy", path: "/admin/systems" }
  ];

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white shadow-lg border-b border-gray-700/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div 
              className="text-lg font-bold cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={handleLogoClick}
            >
              👑 Admin Panel
            </div>
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    `relative px-4 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 transform ${
                      isActive
                        ? "bg-white text-gray-900 shadow-md scale-105"
                        : "hover:bg-white/10 hover:scale-105 active:scale-95"
                    }`
                  }
                >
                  {tab.name}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm opacity-75">Admin Mode</span>
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar({ onLogout, userRole }) {
  if (userRole === "Admin") {
    return <AdminNavbar onLogout={onLogout} />;
  } else if (userRole === "Gardener") {
    return <GardenerNavbar onLogout={onLogout} />;
  } else {
    return (
      <nav className="bg-gray-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold">Farm Management</div>
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-sm"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </nav>
    );
  }
}