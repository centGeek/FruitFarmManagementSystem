 import React, { useMemo } from 'react';
 import { useTranslation } from 'react-i18next';

 // Escapuje znaki specjalne HTML. Leaflet renderuje treść popupów/tooltipów jako SUROWY HTML
 // (bindPopup/setPopupContent/divIcon), więc każdą wartość pochodzącą od użytkownika lub z
 // zewnętrznego API (np. geokoder Nominatim) trzeba zescapować przed wstrzyknięciem do szablonu,
 // inaczej powstaje XSS. Dla treści budowanej w JSX React robi to automatycznie i helper jest zbędny.
 export const escapeHtml = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

 export const formatCurrency = (amount) => {
        return amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
 export const Alert = React.memo(({ type, message, onClose }) => {
    const { t } = useTranslation();
    const colors = useMemo(() => ({
        error: 'bg-red-50 border-red-300 text-red-700', success: 'bg-green-50 border-green-300 text-green-700', warning: 'bg-amber-50 border-amber-300 text-amber-700'
    }), []);

    if (!message) return null;

    return (
        <div className={`mb-4 p-4 border rounded-xl ${colors[type]} flex items-center justify-between shadow-sm`} role="alert">
            <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <p className="font-medium">{message}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 p-1 transition-colors text-lg"
                    aria-label={t('aria.closeAlert')}
                >
                    ❌
                </button>
            )}
        </div>
    );
}); 

export const CROP_TYPES = [
  {
    value: 'JABŁOŃ',
    label: '🍎 Jabłonie',
    varieties: [
      { value: 'GOLDEN_DELICIOUS', label: 'Golden Delicious' },
      { value: 'RED_DELICIOUS', label: 'Red Delicious' },
      { value: 'GALA', label: 'Gala' },
      { value: 'FUJI', label: 'Fuji' },
      { value: 'LIGOL', label: 'Ligol' },
      { value: 'SZAMPION', label: 'Szampion' },
      { value: 'JONAGOLD', label: 'Jonagold' },
      { value: 'HONEYCRISP', label: 'Honeycrisp' },
      { value: 'IDARED', label: 'Idared' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'GRUSZA',
    label: '🍐 Grusze',
    varieties: [
      { value: 'KONFERENCJA', label: 'Konferencja' },
      { value: 'WILLIAMS', label: 'Williams' },
      { value: 'BOSC', label: 'Bosc' },
      { value: 'FAWORYTKA', label: 'Faworytka' },
      { value: 'COMICE', label: 'Comice' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'WIŚNIA',
    label: '🍒 Wiśnie',
    varieties: [
      { value: 'BURLAT', label: 'Burlat' },
      { value: 'KELLERIS', label: 'Kelleris' },
      { value: 'MONTMORENCY', label: 'Montmorency' },
      { value: 'NORTHSTAR', label: 'Northstar' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'ŚLIWA',
    label: '🟣 Śliwy',
    varieties: [
      { value: 'WEGIERSKA', label: 'Węgierka' },
      { value: 'RENKLODA', label: 'Renkloda' },
      { value: 'ELENA', label: 'Elena' },
      { value: 'PRESIDENT', label: 'President' },
      { value: 'OPAL', label: 'Opal' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'CZEREŚNIA',
    label: '🍒 Czereśnie',
    varieties: [
      { value: 'BURLAT', label: 'Burlat' },
      { value: 'KORDIA', label: 'Kordia' },
      { value: 'REGINA', label: 'Regina' },
      { value: 'LAPINS', label: 'Lapins' },
      { value: 'SUMMIT', label: 'Summit' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'MALINA',
    label: '🍓 Maliny',
    varieties: [
      { value: 'POLKA', label: 'Polka' },
      { value: 'POLANA', label: 'Polana' },
      { value: 'GLEN_AMPLE', label: 'Glen Ample' },
      { value: 'LASZKA', label: 'Laszka' },
      { value: 'TULAMEEN', label: 'Tulameen' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },


  {
    value: 'TRUSKAWKA',
    label: '🍓 Truskawki',
    varieties: [
      { value: 'HONEOYE', label: 'Honeoye' },
      { value: 'ELSANTA', label: 'Elsanta' },
      { value: 'ALBA', label: 'Alba' },
      { value: 'CLERY', label: 'Clery' },
      { value: 'ROXANA', label: 'Roxana' },
      { value: 'MARMOLADA', label: 'Marmolada' },
      { value: 'SENGA_SENGANA', label: 'Senga Sengana' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },


  {
    value: 'PORZECZKA_CZARNA', 
    label: '🖤 Porzeczka czarna',
    varieties: [
      { value: 'TITANIA', label: 'Titania' },
      { value: 'BEN_LOMOND', label: 'Ben Lomond' },
      { value: 'BEN_NEVIS', label: 'Ben Nevis' },
      { value: 'TISEL', label: 'Tisel' },
      { value: 'TIBEN', label: 'Tiben' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'PORZECZKA_CZERWONA',
    label: '🔴 Porzeczka czerwona',
    varieties: [
      { value: 'ROVADA', label: 'Rovada' },
      { value: 'JONKER_VAN_TETS', label: 'Jonker van Tets' },
      { value: 'HOLLANDE', label: 'Hollande' },
      { value: 'RED_LAKE', label: 'Red Lake' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'AGREST',
    label: '🟢 Agrest',
    varieties: [
      { value: 'INVICTA', label: 'Invicta' },
      { value: 'HINNONMAKI_RED', label: 'Hinnonmäki Red' },
      { value: 'HINNONMAKI_YELLOW', label: 'Hinnonmäki Yellow' },
      { value: 'CAPTIVATOR', label: 'Captivator' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'BORÓWKA',
    label: '🔵 Borówka',
    varieties: [
      { value: 'DUKE', label: 'Duke' },
      { value: 'BLUECROP', label: 'Bluecrop' },
      { value: 'CHANDLER', label: 'Chandler' },
      { value: 'LEGACY', label: 'Legacy' },
      { value: 'SPARTAN', label: 'Spartan' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'JEŻYNA',
    label: '⚫ Jeżyna',
    varieties: [
      { value: 'LOCH_NESS', label: 'Loch Ness' },
      { value: 'THORNFREE', label: 'Thornfree' },
      { value: 'NAVAHO', label: 'Navaho' },
      { value: 'BLACK_SATIN', label: 'Black Satin' },
      { value: 'CHESTER', label: 'Chester' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },

  {
    value: 'ARONIA',
    label: '🫐 Aronia',
    varieties: [
      { value: 'NERO', label: 'Nero' },
      { value: 'VIKING', label: 'Viking' },
      { value: 'GALICJANKA', label: 'Galicjanka' },
      { value: 'HUGIN', label: 'Hugin' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  }
];

export interface CoordinateDTO {
  latitude: number;
  longitude: number;
}

export interface UserLocationDTO {
  userId: number;
  coordinateDTO: CoordinateDTO;
  locationName: string;
}

export interface OpenMeteoCoordinates {
  lat: number;
  lon: number;
}

export interface NotificationRule {
  id?: number;
  backendId?: number;
  weatherNotificationType: string;
  threshold: number;
  daysAhead: number;
  enabled: boolean;
  description?: string;
}

export interface ForecastAlert {
  notificationId: number;
  type: string;
  message: string;
  date: string;
  value: number;
  threshold: number;
}


export const NOTIFICATION_TYPES = [
  { 
    value: 'FROST_WARNING', 
    label: '🧊 Ostrzeżenie o przymrozku',
    description: 'Powiadom gdy temperatura spadnie poniżej',
    unit: '°C',
    defaultThreshold: 2
  },
  { 
    value: 'TEMP_LOW', 
    label: '❄️ Niska temperatura',
    description: 'Powiadom gdy temperatura spadnie poniżej',
    unit: '°C',
    defaultThreshold: 5
  },
  { 
    value: 'TEMP_HIGH', 
    label: '🌡️ Wysoka temperatura',
    description: 'Powiadom gdy temperatura przekroczy',
    unit: '°C',
    defaultThreshold: 30
  },
  { 
    value: 'RAIN_FORECAST', 
    label: '🌧️ Prognoza opadów',
    description: 'Powiadom o opadach deszczu powyżej',
    unit: '% prawdopodobieństwa',
    defaultThreshold: 70
  },
  { 
    value: 'STRONG_WIND', 
    label: '💨 Silny wiatr',
    description: 'Powiadom gdy wiatr przekroczy',
    unit: 'km/h',
    defaultThreshold: 40
  }
];

export const DAYS_AHEAD_OPTIONS = [
  { value: 1, label: 'Za 1 dzień' },
  { value: 2, label: 'Za 2 dni' },
  { value: 3, label: 'Za 3 dni' },
  { value: 5, label: 'Za 5 dni' },
  { value: 7, label: 'Za 7 dni' }
];

export const MONTH_OPTIONS = [
  { value: '', label: 'Wszystkie miesiące 📅' },
  { value: '1', label: 'Styczeń' }, { value: '2', label: 'Luty' }, { value: '3', label: 'Marzec' },
  { value: '4', label: 'Kwiecień' }, { value: '5', label: 'Maj' }, { value: '6', label: 'Czerwiec' },
  { value: '7', label: 'Lipiec' }, { value: '8', label: 'Sierpień' }, { value: '9', label: 'Wrzesień' },
  { value: '10', label: 'Październik' }, { value: '11', label: 'Listopad' }, { value: '12', label: 'Grudzień' }
];