import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Apple, Leaf, BarChart3, Users, MapPin, Bell } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const GOOGLE_CLIENT_ID = "756765730426-ph1sg4bqiaajlb3b77olcrv6043rb2u0.apps.googleusercontent.com";
  
  useEffect(() => {
    const loadGoogleIdentity = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleAuth();
        return;
      }

      console.log("🔄 Ładowanie Google Identity Services...");
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log("✅ Google script załadowany");        
        const checkGoogleReady = () => {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            console.log("✅ Google API gotowe");
            initializeGoogleAuth();
          } else {
            console.log("⏳ Czekam na Google API...");
            setTimeout(checkGoogleReady, 100);
          }
        };
        
        checkGoogleReady();
      };
      
  
      
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        const error = "Google API not ready";
        console.error("❌", error);
        return;
      }
      

      try {
        console.log("🔧 Inicjalizacja Google Auth z Client ID:", GOOGLE_CLIENT_ID.substring(0, 20) + "...");
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { 
            theme: "outline", 
            size: "large", 
            text: "continue_with",
            width: 400, 
          }
        );
        
        setIsGoogleReady(true);
        console.log("✅ Google Auth zainicjalizowany pomyślnie");

      } catch (error) {
        console.error('❌ Błąd inicjalizacji Google Auth:', error);
      }
    };

    loadGoogleIdentity();
  }, []);

  const handleGoogleResponse = async (response) => {
    console.log('Odpowiedź Google otrzymana:', response);
    
    if (response.credential) {
      console.log('✅ Zalogowano przez Google! Token JWT:', response.credential.substring(0, 50) + "...");
      alert("Pomyślnie zalogowano przez Google! Sprawdź konsolę po token.");
    } else {
      console.error('❌ Błąd logowania Google: brak tokena uwierzytelnienia');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Proszę wypełnić wszystkie pola');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Dane logowania:', formData);
      alert('Logowanie zakończone pomyślnie!');
      
    } catch (error) {
      console.error('Błąd logowania:', error);
      alert('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4">
      <div className="absolute top-20 left-20 text-green-200 animate-pulse">
        <Apple size={32} />
      </div>
      <div className="absolute top-40 right-32 text-lime-200 animate-bounce">
        <Leaf size={24} />
      </div>
      <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse">
        <Leaf size={28} />
      </div>
      
      <div className="w-full max-w-6xl flex bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">OrchardManager</h1>
              <p className="text-gray-600">System zarządzania gospodarstwem sadowniczym</p>
            </div>

            <div className="mb-6">
              <div id="google-signin-button"></div>
              
    
            </div>

            {/* Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">lub użyj email</span>
              </div>
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adres email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="twoj@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Hasło
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Wprowadź hasło"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                    Zapamiętaj mnie
                  </label>
                </div>
                <a href="#" className="text-sm text-green-600 hover:text-green-500 font-medium">
                  Zapomniałeś hasła?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logowanie...
                  </div>
                ) : (
                  'Zaloguj się'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Nie masz konta?{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                  Zarejestruj się
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Features showcase */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-center">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-6">Zarządzaj swoim sadem profesjonalnie</h2>
            <p className="text-green-100 text-lg mb-8 leading-relaxed">
              Kompleksowy system do zarządzania gospodarstwem sadowniczym z zaawansowanymi narzędziami 
              analizy i optymalizacji.
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mapowanie upraw</h3>
                  <p className="text-green-100 text-sm">Przypisuj pracowników do konkretnych sektorów</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ewidencja pracy</h3>
                  <p className="text-green-100 text-sm">Harmonogramowanie i rejestracja czasu pracy</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 classNamee="font-semibold text-lg">Analiza efektywności</h3>
                  <p className="text-green-100 text-sm">Monitorowanie finansów i optymalizacja zasobów</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Notyfikacje pogodowe</h3>
                  <p className="text-green-100 text-sm">Alerty o anomaliach i zmianach pogodowych</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <p className="text-sm text-green-100 italic">
                "OrchardManager zwiększył efektywność naszego gospodarstwa o 35% dzięki lepszemu 
                planowaniu i monitorowaniu procesów."
              </p>
              <p className="text-white font-medium mt-2">— Jacek Centkowski, Gospodarstwo Sadownicze Lutkówka</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}