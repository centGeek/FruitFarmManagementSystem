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
    { name: "Analiza", path: "/analyse" },
    { name: "Edytuj profil", path: "/gardener-profile" },
  ];

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <nav className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
      <div className="max-w-[1600px] mx-auto px-6 py-2.5">
        <div className="flex justify-between items-center gap-4">
          <div 
            className="text-xl font-bold cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-2"
            onClick={handleLogoClick}
          >
            <span className="text-2xl">🌱</span>
            <span>Panel Sadownika</span>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center flex-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium text-sm tracking-wide transition-all duration-300 transform whitespace-nowrap ${
                    isActive
                      ? "bg-white text-green-700 shadow-md scale-105"
                      : "hover:bg-white/20 hover:scale-105 active:scale-95"
                  }`
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </div>
          
          <button
            onClick={onLogout}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-green-600"
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
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white shadow-xl">
      <div className="max-w-[1600px] mx-auto px-6 py-2.5">
        <div className="flex justify-between items-center gap-4">
          <div 
            className="text-xl font-bold cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-2"
            onClick={handleLogoClick}
          >
            <span className="text-2xl">👑</span>
            <span>Admin Panel</span>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center flex-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium text-sm tracking-wide transition-all duration-300 transform whitespace-nowrap ${
                    isActive
                      ? "bg-white text-gray-900 shadow-md scale-105"
                      : "hover:bg-white/20 hover:scale-105 active:scale-95"
                  }`
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold border border-yellow-500/30">
              Admin Mode
            </span>
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
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
      <nav className="bg-gray-700 text-white shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold">Farm Management</div>
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-sm shadow-lg transition-all duration-300"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </nav>
    );
  }
}