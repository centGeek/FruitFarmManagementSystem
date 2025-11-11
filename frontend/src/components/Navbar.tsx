import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState(null);

  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 4 && code <= 48) return '☁️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 99) return '⛈️';
    return '🌤️';
  };

  // Pobierz koordynaty z profilu użytkownika
  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/gardener/location`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Nie udało się pobrać lokalizacji');
        }

        const data = await response.json();
        
        if (data.coordinateDTO?.latitude && data.coordinateDTO?.longitude) {
          setCoordinates({
            lat: data.coordinateDTO.latitude,
            lon: data.coordinateDTO.longitude
          });
        } else {
          console.warn('Brak koordynatów w profilu użytkownika');
          setLoading(false);
        }
      } catch (error) {
        console.error('Błąd pobierania koordynatów:', error);
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, []);

  // Pobierz pogodę dla koordynatów
  useEffect(() => {
    if (!coordinates) return;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,weather_code&timezone=Europe/Warsaw`
        );
        
        if (!response.ok) {
          throw new Error(`Błąd HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data?.current?.temperature_2m !== undefined && data?.current?.weather_code !== undefined) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code
          });
        } else {
          throw new Error('Niekompletne dane z API.');
        }
      } catch (error) {
        console.error('Błąd pobierania pogody:', error);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Odświeżanie co 10 minut
    const interval = setInterval(fetchWeather, 600000); 
    return () => clearInterval(interval);
  }, [coordinates]);

  return (
    <div className="flex items-center justify-center min-w-[70px] h-8"> 
      {loading && (
        <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded"></div>
            <div className="w-12 h-4 bg-white/20 rounded"></div>
          </div>
        </div>
      )}

      {!loading && weather && (
        <div className="px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-1.5">
            <span className="text-xl" role="img" aria-label="weather-icon">
              {getWeatherIcon(weather.code)}
            </span>
            <span className="text-base font-bold leading-none">{weather.temp}°C</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <nav className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl sticky top-0 z-50">
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
          
          <div className="flex items-center gap-3">
            <WeatherWidget /> 
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-green-600"
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
  
  if (userRole === "Gardener") {
    return <GardenerNavbar onLogout={onLogout} />;
  } 
  
  return (
    <nav className="bg-gray-700 text-white shadow-xl sticky top-0 z-50">
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

export { WeatherWidget, GardenerNavbar };