 export const formatCurrency = (amount) => {
        return amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

export const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    const colors = {
        error: 'bg-red-50 border-red-300 text-red-700',
        success: 'bg-green-50 border-green-300 text-green-700',
        warning: 'bg-amber-50 border-amber-300 text-amber-700'
    };
      
    return (
        <div className={`mb-4 p-4 border rounded-xl ${colors[type]} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <p className="font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 text-lg">❌</button>
        </div>
    );
};

export const CROP_TYPES = [
    {
    value: 'JABŁOŃ', 
    label: '🍎 Jabłonie',
    varieties: [
        { value: 'IDARED', label: 'Idared' },
        { value: 'LIGOL', label: 'Ligol' },
        { value: 'SZAMPION', label: 'Szampion' },
        { value: 'JONAGOLD', label: 'Jonagold' },
        { value: 'GLOSTER', label: 'Gloster' },
        { value: 'GALA', label: 'Gala' },
        { value: 'GOLDEN_DELICIOUS', label: 'Golden Delicious' },
        { value: 'RED_DELICIOUS', label: 'Red Delicious' },
        { value: 'PRINCE', label: 'Princ' },
        { value: 'ELSTAR', label: 'Elstar' },
        { value: 'MUTSU', label: 'Mutsu' },
        { value: 'ALWA', label: 'Alwa' },
        { value: 'MELODIA', label: 'Melodia' },
        { value: 'GALMAC', label: 'Galmac' },
        { value: 'PAPIEROWKA', label: 'Papierówka' },
        { value: 'LOBO', label: 'Lobo' },
        { value: 'TOPAZ', label: 'Topaz' },
        { value: 'RUBINOLA', label: 'Rubinola' },
        { value: 'PINOVA', label: 'Pinova' },
        { value: 'INNA', label: 'Inna odmiana' }
    ]
  },
    { 
        value: 'GRUSZA',
        label: '🍐 Grusze',
        varieties: [
            { value: 'CONFERENCE', label: 'Conference' },
            { value: 'WILLIAMS', label: 'Williams' },
            { value: 'LUKASOWKA', label: 'Łukasówka' },
            { value: 'FAWORYTKA', label: 'Faworytka' },
            { value: 'BONKRETA', label: 'Bonkreta' },
            { value: 'INNA', label: 'Inna odmiana' }
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
            { value: 'CACANSKA', label: 'Čačanska' },
            { value: 'INNA', label: 'Inna odmiana' }
        ]
    },
    { 
        value: 'WIŚNIA',
        label: '🍒 Wiśnie',
        varieties: [
            { value: 'LUTOWKA', label: 'Łutówka' }, 
            { value: 'NEFRIS', label: 'Nefris' },
            { value: 'DEBRECENI', label: 'Debreceni' },
            { value: 'KELLERIS', label: 'Kelleris' },
            { value: 'INNA', label: 'Inna odmiana' }
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
            { value: 'VAN', label: 'Van' },
            { value: 'SUMMIT', label: 'Summit' },
            { value: 'INNA', label: 'Inna odmiana' }
        ]
    },
    { 
        value: 'MALINA',
        label: '🍓 Maliny',
        varieties: [
            { value: 'POLKA', label: 'Polka' },
            { value: 'POLANA', label: 'Polana' },
            { value: 'LASZKA', label: 'Laszka' },
            { value: 'GLEN_AMPLE', label: 'Glen Ample' },
            { value: 'TULAMEEN', label: 'Tulameen' },
            { value: 'INNA', label: 'Inna odmiana' }
        ]
    }
];