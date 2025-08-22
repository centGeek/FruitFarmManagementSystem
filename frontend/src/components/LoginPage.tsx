import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Apple, Leaf, BarChart3, Users, MapPin, Bell } from 'lucide-react';

const GOOGLE_CLIENT_ID = "756765730426-ph1sg4bqiaajlb3b77olcrv6043rb2u0.apps.googleusercontent.com";
const BACKEND_URL = "http://localhost:8091";

// Komponent Alert
const Alert = ({ type, message }) => {
  if (!message) return null;
  const colors = {
    error: 'bg-red-100 border-red-400 text-red-700',
    success: 'bg-green-100 border-green-400 text-green-700'
  };
  return (
    <div className={`mb-6 p-4 border rounded-xl ${colors[type]}`}>
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
        {message}
      </div>
    </div>
  );
};

// Komponent TextInput
const TextInput = ({ id, name, value, onChange, placeholder, icon: Icon, type = "text", disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  </div>
);

// Komponent PasswordInput
const PasswordInput = ({ value, onChange, showPassword, setShowPassword, disabled }) => (
  <div>
    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Hasło</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
        placeholder="Wprowadź hasło"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        disabled={disabled}
      >
        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
      </button>
    </div>
  </div>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------------- Google Auth ----------------
  useEffect(() => {
    const loadGoogleIdentity = () => {
      if (window.google?.accounts) return initializeGoogleAuth();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkGoogleReady = () => {
          if (window.google?.accounts?.id) initializeGoogleAuth();
          else setTimeout(checkGoogleReady, 100);
        };
        checkGoogleReady();
      };
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      try {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), { theme: "outline", size: "large", text: "continue_with", width: 400 });
        setIsGoogleReady(true);
      } catch (err) {
        console.error('Google Auth init error', err);
      }
    };

    loadGoogleIdentity();
  }, []);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return setError('Brak tokena Google');
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential, clientId: GOOGLE_CLIENT_ID }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (formData.rememberMe) localStorage.setItem('authToken', data.token);
        else sessionStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({ email: data.email || 'google-user@example.com', loginTime: new Date().toISOString(), loginMethod: 'google' }));
        setSuccess('Logowanie przez Google zakończone pomyślnie.');
        setTimeout(() => window.location.href = '/home', 2000);
      } else setError(data.message || 'Błąd logowania Google');
    } catch (err) {
      setError('Nie można połączyć się z backend.');
    } finally { setIsLoading(false); }
  };

  // ---------------- Form Handling ----------------
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) return setError('Adres email jest wymagany'), false;
    if (!/\S+@\S+\.\S+/.test(formData.email)) return setError('Podaj prawidłowy adres email'), false;
    if (!formData.password.trim()) return setError('Hasło jest wymagane'), false;
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rememberMe: formData.rememberMe,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (formData.rememberMe) localStorage.setItem('authToken', data.token);
        else sessionStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({ email: formData.email.trim().toLowerCase(), loginTime: new Date().toISOString(), loginMethod: 'email' }));
        setSuccess(`Witaj ${formData.email}! Logowanie zakończone pomyślnie.`);
        setFormData({ email: '', password: '', rememberMe: false });
        setTimeout(() => window.location.href = '/home', 2000);
      } else {
        setError(data.message || 'Błąd logowania');
      }
    } catch (err) { setError('Nie można połączyć się z backend.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4">
      <div className="absolute top-20 left-20 text-green-200 animate-pulse"><Apple size={32} /></div>
      <div className="absolute top-40 right-32 text-lime-200 animate-bounce"><Leaf size={24} /></div>
      <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse"><Leaf size={28} /></div>

      <div className="w-full max-w-6xl flex bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg"><Apple className="w-8 h-8 text-white" /></div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">OrchardManager</h1>
              <p className="text-gray-600">System zarządzania gospodarstwem sadowniczym</p>
            </div>

            <Alert type="error" message={error} />
            <Alert type="success" message={success} />

            <div className="mb-6"><div id="google-signin-button"></div></div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">lub użyj email</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <TextInput id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Adres email" icon={User} disabled={isLoading} />
              <PasswordInput value={formData.password} onChange={handleInputChange} showPassword={showPassword} setShowPassword={setShowPassword} disabled={isLoading} />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleInputChange} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" disabled={isLoading} />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">Zapamiętaj mnie</label>
                </div>
                <a href="#" className="text-sm text-green-600 hover:text-green-500 font-medium">Zapomniałeś hasła?</a>
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                {isLoading ? <div className="flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Logowanie...</div> : 'Zaloguj się'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">Nie masz konta? <a href="/register" className="text-green-600 hover:text-green-500 font-medium">Zarejestruj się</a></p>
            </div>
          </div>
        </div>

        {/* Right side - Features showcase */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-center text-white">
          <h2 className="text-4xl font-bold mb-6">Zarządzaj swoim sadem profesjonalnie</h2>
          <p className="text-green-100 text-lg mb-8 leading-relaxed">Kompleksowy system do zarządzania gospodarstwem sadowniczym z zaawansowanymi narzędziami analizy i optymalizacji.</p>
          <div className="space-y-6">
            {[
              { icon: MapPin, title: 'Mapowanie upraw', desc: 'Przypisuj pracowników do konkretnych sektorów' },
              { icon: Users, title: 'Ewidencja pracy', desc: 'Harmonogramowanie i rejestracja czasu pracy' },
              { icon: BarChart3, title: 'Analiza efektywności', desc: 'Monitorowanie finansów i optymalizacja zasobów' },
              { icon: Bell, title: 'Notyfikacje pogodowe', desc: 'Alerty o anomaliach i zmianach pogodowych' }
            ].map((f, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><f.icon className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-green-100 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="text-sm text-green-100 italic">"OrchardManager zwiększył efektywność naszego gospodarstwa o 35% dzięki lepszemu planowaniu i monitorowaniu procesów."</p>
            <p className="text-white font-medium mt-2">— Jacek Centkowski, Gospodarstwo Sadownicze Lutkówka</p>
          </div>
        </div>
      </div>
    </div>
  );
}
