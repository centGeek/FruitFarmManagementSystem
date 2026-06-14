import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, User, Lock, Apple, Leaf, BarChart3, Users, MapPin, Bell } from 'lucide-react';
import { BACKEND_URL} from "../utils/apiConfigs";
import { Alert} from "../utils/common";
import ThemeSwitcher from "./ThemeSwitcher";


const TextInput = ({ id, name, value, onChange, placeholder, icon: Icon, type = "text", disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{placeholder}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  </div>
);

const PasswordInput = ({ value, onChange, showPassword, setShowPassword, disabled }) => {
  const { t } = useTranslation("login");
  return (
  <div>
    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("common:fields.password")}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        name="password"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700"
        placeholder={t("passwordPlaceholder")}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        disabled={disabled}
      >
        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />}
      </button>
    </div>
  </div>
  );
};

export default function LoginPage({ onLogin }: { onLogin: (role: string | null) => void }) {
  const { t } = useTranslation("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({nickname: '', password: ''});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.nickname.trim()) {
      setError(t('validation.nicknameRequired'));
      return false;
    }
    if (!formData.password.trim()) {
      setError(t('validation.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  setError('');

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nickname: formData.nickname,
        password: formData.password
      }),
    });
    if (res.ok) {
      const verify = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include',
      });
      const verifyData = verify.ok ? await verify.json() : null;
      onLogin(verifyData?.roles?.[0] ?? null);
    } else {
      const data = await res.json();
      setError(data.message || t('errors.loginFailed'));
    }
  } catch (err) {
    setError(t('errors.serverUnreachable'));
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeSwitcher variant="surface" />
      </div>
      <div className="absolute top-20 left-20 text-green-200 animate-pulse"><Apple size={32} /></div>
      <div className="absolute top-40 right-32 text-lime-200 animate-bounce"><Leaf size={24} /></div>
      <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse"><Leaf size={28} /></div>

      <div className="w-full max-w-6xl flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('brand')}</h1>
              <p className="text-gray-600 dark:text-gray-300">{t('subtitle')}</p>
            </div>

            <Alert type="error" message={error} />

            <div className="space-y-5">
              <TextInput
                id="nickname"
                name="nickname"
                type="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder={t('common:fields.nickname')}
                icon={User}
                disabled={isLoading}
              />
              
              <PasswordInput
                value={formData.password}
                onChange={handleInputChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
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
                    {t('loggingIn')}
                  </div>
                ) : (
                  t('common:actions.login')
                )}
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('noAccount')}{' '}
                <a href="/register" className="text-green-600 dark:text-green-300 hover:text-green-500 font-medium">
                  {t('common:actions.register')}
                </a>
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <a href="/about" className="text-green-600 dark:text-green-300 hover:text-green-500 font-medium">
                  {t('about')}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-center text-white">
          <h2 className="text-4xl font-bold mb-6">{t('hero.title')}</h2>
          <p className="text-green-100 text-lg mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="space-y-6">
            {[
              { icon: MapPin, title: t('hero.features.mapping.title'), desc: t('hero.features.mapping.desc') },
              { icon: Users, title: t('hero.features.workLog.title'), desc: t('hero.features.workLog.desc') },
              { icon: BarChart3, title: t('hero.features.analysis.title'), desc: t('hero.features.analysis.desc') },
              { icon: Bell, title: t('hero.features.weather.title'), desc: t('hero.features.weather.desc') }
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
        </div>
      </div>
    </div>
  );
}