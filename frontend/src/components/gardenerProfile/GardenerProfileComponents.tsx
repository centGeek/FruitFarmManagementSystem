import React from 'react';

export interface InputFieldProps {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    isPassword?: boolean;
    error?: string;
    isLoading?: boolean;
    showPassword?: boolean;
    setShowPassword?: React.Dispatch<React.SetStateAction<boolean>>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const InputField = React.memo(({ label, name, type = 'text', required = false, isPassword = false, error, isLoading, showPassword, setShowPassword, value, onChange, placeholder, disabled = false }: InputFieldProps) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                id={name}
                type={isPassword && showPassword ? "text" : type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                className={`w-full px-4 py-3 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {isPassword && setShowPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    disabled={isLoading}
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

export const LoadingState = React.memo(() => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie profilu... 🔄</p>
    </div>
));