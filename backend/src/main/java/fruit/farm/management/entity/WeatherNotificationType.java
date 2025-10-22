package fruit.farm.management.entity;

public enum WeatherNotificationType {
    FROST_WARNING("Ostrzeżenie o przymrozku"),
    TEMP_LOW("Niska temperatura"),
    TEMP_HIGH("Wysoka temperatura"),
    RAIN_FORECAST("Prognoza opadów"),
    STRONG_WIND("Silny wiatr");

    private final String displayName;

    WeatherNotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}