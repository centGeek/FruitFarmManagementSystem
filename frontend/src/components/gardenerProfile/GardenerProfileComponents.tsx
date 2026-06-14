import React from 'react';
import { useTranslation } from "react-i18next";

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

export const InputField = React.memo(({ label, name, type = 'text', required = false, isPassword = false, error, isLoading, showPassword, setShowPassword, value, onChange, placeholder, disabled = false }: InputFieldProps) => {
    const { t } = useTranslation("gardenerProfile");
    return (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
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
                className={`w-full px-4 py-3 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} border rounded-xl dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed`}
            />
            {isPassword && setShowPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    aria-label={showPassword ? t("password.hideAria") : t("password.showAria")}
                    disabled={isLoading}
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            )}
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
    );
});

export const LoadingState = React.memo(() => {
    const { t } = useTranslation("gardenerProfile");
    return (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 dark:border-green-800 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loading")}</p>
    </div>
    );
});