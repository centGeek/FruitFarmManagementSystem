import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, XCircle, Clock, ArrowLeft, Home, RefreshCw, AlertTriangle, Info } from 'lucide-react';

const ErrorPage = ({ error, onGoBack, onGoHome, onRetry }) => {
    const { t } = useTranslation('errorPage');
    const [showDetails, setShowDetails] = useState(false);

    if (!error) return null;
    
    const getErrorType = () => {
        const errorMsg = error.error?.toLowerCase() || '';
        const message = error.message?.toLowerCase() || '';
        
        if (errorMsg.includes('exceeded') || errorMsg.includes('work') || errorMsg.includes('hours') || 
            message.includes('18 hours') || message.includes('hour')) {
            return 'exceeded_hours';
        }
        if (error.status === 401 || error.status === 403) return 'auth_error';
        if (error.status === 404) return 'not_found';
        if (error.status >= 500) return 'server_error';
        if (error.status >= 400 && error.status < 500) return 'client_error';
        return 'unknown';
    };

    const getErrorConfig = () => {
        const type = getErrorType();

        const configs = {
            exceeded_hours: {
                icon: Clock,
                iconColor: 'text-amber-500',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-300',
                textColor: 'text-amber-800',
                title: t('types.exceeded_hours.title')
            },
            auth_error: {
                icon: XCircle,
                iconColor: 'text-red-500',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-300',
                textColor: 'text-red-800',
                title: error.error || t('types.auth_error.title')
            },
            not_found: {
                icon: AlertCircle,
                iconColor: 'text-blue-500',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-300',
                textColor: 'text-blue-800',
                title: t('types.not_found.title')
            },
            server_error: {
                icon: XCircle,
                iconColor: 'text-red-500',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-300',
                textColor: 'text-red-800',
                title: error.error || t('types.server_error.title')
            },
            client_error: {
                icon: AlertTriangle,
                iconColor: 'text-orange-500',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-300',
                textColor: 'text-orange-800',
                title: error.error || t('types.client_error.title')
            },
            unknown: {
                icon: AlertCircle,
                iconColor: 'text-gray-500',
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-300',
                textColor: 'text-gray-800',
                title: error.error || t('types.unknown.title')
            }
        };

        return { ...configs[type], type };
    };

    const config = getErrorConfig();
    const Icon = config.icon;
    const tips = t(`types.${config.type}.tips`, { returnObjects: true }) as string[];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="max-w-2xl w-full animate-slideUp">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200">
                    <div className={`${config.bgColor} border-b-4 ${config.borderColor} px-6 sm:px-8 py-6`}>
                        <div className="flex items-center justify-center mb-4">
                            <Icon className={config.iconColor} size={64} />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl font-extrabold text-center ${config.textColor} mb-2`}>
                            {config.title}
                        </h1>
                        <p className="text-center text-gray-600 text-sm">
                            {t('errorCode')} <span className="font-mono font-bold">{error.status || t('codeNA')}</span>
                        </p>
                    </div>

                    <div className="px-6 sm:px-8 py-6 space-y-6">
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase mb-3 flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                {t('detailsHeading')}
                            </h3>
                            <p className="text-base sm:text-lg text-gray-800 leading-relaxed break-words">
                                {error.message || t('defaultMessage')}
                            </p>
                        </div>

                        {error.timestamp && (
                            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-1">{t('timestampHeading')}</p>
                                <p className="text-sm text-blue-900 font-mono">
                                    {new Date(error.timestamp).toLocaleString('pl-PL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}

                        {tips && tips.length > 0 && (
                            <div className={`${config.bgColor} rounded-xl p-4 border-2 ${config.borderColor}`}>
                                <h4 className={`text-sm font-bold ${config.textColor} mb-2 flex items-center`}>
                                    <Info size={16} className="mr-2" />
                                    {t('tipsHeading')}
                                </h4>
                                <ul className={`text-sm ${config.textColor} space-y-1 list-disc list-inside`}>
                                    {tips.map((tip, index) => (
                                        <li key={index}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="px-6 sm:px-8 py-6 bg-gray-50 border-t-2 border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 sm:px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base"
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    {t('retry')}
                                </button>
                            )}
                            {onGoBack && (
                                <button
                                    onClick={onGoBack}
                                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 sm:px-6 rounded-xl font-bold transition-all flex items-center justify-center text-sm sm:text-base"
                                >
                                    <ArrowLeft size={18} className="mr-2" />
                                    {t('common:actions.back')}
                                </button>
                            )}
                            {onGoHome && (
                                <button
                                    onClick={onGoHome}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 sm:px-6 rounded-xl font-bold transition-all flex items-center justify-center text-sm sm:text-base"
                                >
                                    <Home size={18} className="mr-2" />
                                    {t('goHome')}
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                            >
                                {showDetails ? t('hideTechnical') : t('showTechnical')}
                            </button>
                        </div>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-4 bg-gray-800 text-gray-100 rounded-xl p-4 text-xs font-mono overflow-x-auto animate-slideUp">
                        <p className="text-green-400 font-bold mb-2">{t('technicalHeading')}</p>
                        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { 
            opacity: 0;
            transform: translateY(30px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    .animate-slideUp {
        animation: slideUp 0.4s ease-out;
    }
`;
if (typeof document !== 'undefined' && !document.getElementById('error-page-styles')) {
    style.id = 'error-page-styles';
    document.head.appendChild(style);
}

export default ErrorPage;