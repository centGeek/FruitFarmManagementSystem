import { NavLink } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const tabs = [
    { name: "Home", path: "/home" },
    { name: "Map", path: "/map" },
    { name: "Expenses", path: "/expenses" },
    { name: "Profits", path: "/profits" },
    { name: "Management", path: "/management" },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Linki */}
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium transition-colors duration-200 ${
                  isActive ? "bg-white text-blue-600" : "hover:bg-blue-500"
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="ml-4 px-3 py-2 bg-red-500 rounded-md font-medium hover:bg-red-600 transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
