import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Apple, Leaf, BarChart3, Users, MapPin, Bell, Phone, UserCheck } from 'lucide-react';

const BACKEND_URL = "http://localhost:8091";

// Alert Component
const Alert = ({ type, message }) => {
  if (!message) return null;
  const colors = {
    error: 'bg-red-100 border-red-400 text-red-700',
    success: 'bg-green-100 border-green-400 text-green-700'
  };
  return (
    <div className={`mb-6 p-4 border rounded-xl ${colors[type]}`}>
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
        {message}
      </div>
    </div>
  );
};

// TextInput Component
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

// PasswordInput Component
const PasswordInput = ({ id, name, value, onChange, showPassword, setShowPassword, placeholder, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
        placeholder={placeholder}
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

// Helper function for handling successful registration
const handleRegistrationSuccess = (token, email) => {
  // Store token in sessionStorage for initial login
  sessionStorage.setItem('authToken', token);
  
  // Store user info
  localStorage.setItem('user', JSON.stringify({
    email: email,
    loginTime: new Date().toISOString(),
    loginMethod: 'registration'
  }));
  
  // Redirect to home or onboarding
  window.location.href = '/home';
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    nickname: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Input Handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  // Form Validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Imię jest wymagane');
      return false;
    }
    if (!formData.surname.trim()) {
      setError('Nazwisko jest wymagane');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Adres email jest wymagany');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Podaj prawidłowy adres email');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Hasło jest wymagane');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      return false;
    }
    return true;
  };

  // Email Registration Handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          nickname: formData.nickname.trim() || null,
          phoneNumber: formData.phoneNumber.trim() || null,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          isActive: true
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          // Immediate login after registration
          handleRegistrationSuccess(
            data.token,
            formData.email.trim().toLowerCase()
          );
        } else {
          // Registration successful but requires email verification
          setSuccess('Rejestracja zakończona pomyślnie! Sprawdź email w celu aktywacji konta.');
          setFormData({
            name: '',
            surname: '',
            nickname: '',
            phoneNumber: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
        }
      } else {
        setError(data.message || 'Błąd rejestracji');
      }
    } catch (err) {
      setError('Nie można połączyć się z serwerem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 text-green-200 animate-pulse"><Apple size={32} /></div>
      <div className="absolute top-40 right-32 text-lime-200 animate-bounce"><Leaf size={24} /></div>
      <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse"><Leaf size={28} /></div>

      <div className="w-full max-w-6xl flex bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Registration Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dołącz do OrchardManager</h1>
              <p className="text-gray-600">Utwórz konto i zacznij zarządzać swoim sadem</p>
            </div>

            {/* Alerts */}
            <Alert type="error" message={error} />
            <Alert type="success" message={success} />

            {/* Registration Form */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Imię"
                  icon={User}
                  disabled={isLoading}
                />
                
                <TextInput
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Nazwisko"
                  icon={UserCheck}
                  disabled={isLoading}
                />
              </div>

              <TextInput
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="Pseudonim (opcjonalne)"
                icon={User}
                disabled={isLoading}
              />

              <TextInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Numer telefonu (opcjonalny)"
                icon={Phone}
                disabled={isLoading}
              />

              <TextInput
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Adres email"
                icon={User}
                disabled={isLoading}
              />
              
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                placeholder="Hasło"
                disabled={isLoading}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                showPassword={showConfirmPassword}
                setShowPassword={setShowConfirmPassword}
                placeholder="Potwierdź hasło"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Rejestrowanie...
                  </div>
                ) : (
                  'Utwórz konto'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Masz już konto?{' '}
                <a href="/login" className="text-green-600 hover:text-green-500 font-medium">
                  Zaloguj się
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Features Showcase */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-center text-white">
          <h2 className="text-4xl font-bold mb-6">Rozpocznij profesjonalne zarządzanie sadem</h2>
          <p className="text-green-100 text-lg mb-8 leading-relaxed">
            Dołącz do tysięcy sadowników, którzy już wykorzystują OrchardManager do optymalizacji swojego gospodarstwa.
          </p>
          
          <div className="space-y-6">
            {[
              { icon: MapPin, title: 'Mapowanie działek', desc: 'Wizualizuj i organizuj swoje uprawy na interaktywnej mapie' },
              { icon: Users, title: 'Zarządzanie zespołem', desc: 'Koordynuj pracę wszystkich pracowników w jednym miejscu' },
              { icon: BarChart3, title: 'Raporty finansowe', desc: 'Analizuj koszty, przychody i rentowność w czasie rzeczywistym' },
              { icon: Bell, title: 'Smart powiadomienia', desc: 'Otrzymuj alerty o warunkach pogodowych i terminach prac' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-green-100 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 text-yellow-400 fill-current">⭐</div>
                ))}
              </div>
              <span className="ml-2 text-sm text-green-100">5.0/5 (127 opinii)</span>
            </div>
            <p className="text-sm text-green-100 italic mb-3">
              "System bardzo intuicyjny i funkcjonalny. Zaoszczędziliśmy mnóstwo czasu na rejestracji placy i koordynacji prac sezonowych."
            </p>
            <p className="text-white font-medium">
              — Anna Kowalska, Sad Grójecki
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}