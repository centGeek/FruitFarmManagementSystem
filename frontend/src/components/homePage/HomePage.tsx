import { AlertCircle, Loader } from 'lucide-react';
import { Link } from "react-router-dom";
import { Alert } from "../../utils/common";
import { useHomePage } from './HomePageHooks';
import { NotificationCard, WeatherAlertCard, LoadingState, EmptyState } from './HomePageComponents';

export default function HomePage() {
    const { 
        notifications, isLoading, alert, closeAlert, 
        forecastAlerts, isCheckingAlerts, weatherError 
    } = useHomePage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <span className="text-indigo-600 mr-3">🔔</span> Powiadomienia
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">Wszystkie ważne informacje w jednym miejscu</p>
                </header>
                
                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center"><span className="mr-2">📬</span> Ostatnie aktualności</h2>
                            </div>
                            {isLoading ? <LoadingState /> : notifications.length === 0 ? <EmptyState /> : (
                                <div className="space-y-3">
                                    {notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1 lg:-mt-20">
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-4 md:p-5 border border-orange-200 lg:sticky lg:top-2">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                                <h2 className="text-base md:text-lg font-bold text-gray-900">Pogoda</h2>
                            </div>

                            {isCheckingAlerts ? (
                                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader className="w-6 h-6 text-orange-600 animate-spin" />
                                        <span className="text-orange-800 font-medium text-sm text-center">Sprawdzanie alertów...</span>
                                    </div>
                                </div>
                            ) : weatherError ? (
                                <div className="bg-red-100 border border-red-300 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-800">{weatherError}</div>
                                    </div>
                                </div>
                            ) : forecastAlerts.length > 0 ? (
                                <>
                                    <div className="mb-3 px-3 py-2 bg-orange-600 text-white rounded-lg text-center">
                                        <span className="font-bold text-lg">{forecastAlerts.length}</span>
                                        <span className="text-sm ml-2">{forecastAlerts.length === 1 ? 'ostrzeżenie' : forecastAlerts.length < 5 ? 'ostrzeżenia' : 'ostrzeżeń'}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[500px] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                                        {forecastAlerts.map((alert, index) => <WeatherAlertCard key={index} alert={alert} />)}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center">
                                    <div className="text-4xl md:text-5xl mb-3">☀️</div>
                                    <p className="text-gray-700 font-medium mb-1 text-sm md:text-base">Brak ostrzeżeń</p>
                                    <p className="text-gray-600 text-xs md:text-sm">Brak niespodzianek. Możesz skonfigurować alerty pogodowe w <Link to="/weather" className="font-bold underline text-red-800 hover:text-red-900">Notyfikacjach Powodowych</Link></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}