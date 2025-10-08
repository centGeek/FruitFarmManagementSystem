package fruit.farm.management.entity;

public enum ProfitType {
    // 🍏 Sprzedaż produktów
    FRUIT_SALES,           // Sprzedaż owoców
    PLANT_SALES,           // Sprzedaż sadzonek / drzewek
    PROCESSING_PRODUCTS,   // Przetwory, soki, dżemy itp.

    // 🚜 Usługi i wynajem
    AGRICULTURAL_SERVICES, // Usługi rolnicze (np. opryski, koszenie)
    MACHINE_RENTAL,        // Wynajem maszyn / sprzętu
    LAND_RENTAL,           // Dzierżawa ziemi lub obiektów

    // 💰 Dopłaty i wsparcie
    EU_SUBSIDIES,          // Dopłaty unijne
    GOVERNMENT_SUPPORT,    // Wsparcie krajowe / dotacje
    ENVIRONMENTAL_PROGRAMS,// Programy środowiskowe (np. ekologiczne)
    INSURANCE_COMPENSATION,// Odszkodowania z ubezpieczeń

    // 🧾 Inne źródła przychodu
    REFUNDS,               // Zwroty, korekty faktur
    SALE_OF_ASSETS,        // Sprzedaż sprzętu, maszyn itp.
    OTHER                  // Inne przychody
}
