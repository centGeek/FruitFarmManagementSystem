package fruit.farm.management.entity;

public enum PlantType {
    JABŁOŃ(AppleVariety.class),
    GRUSZA(PearVariety.class),
    WIŚNIA(CherryVariety.class),
    ŚLIWA(PlumVariety.class),
    MALINA(RaspberryVariety.class),
    CZEREŚNIA(SweetCherryVariety.class);

    private final Class<? extends Enum<?>> varietyClass;

    PlantType(Class<? extends Enum<?>> varietyClass) {
        this.varietyClass = varietyClass;
    }

    public enum AppleVariety {
        GOLDEN_DELICIOUS, RED_DELICIOUS, GALA, FUJI, PINK_LADY, BRAEBURN, JONAGOLD,
        GRANNY_SMITH, HONEYCRISP, AMBROSIA,IDARED, LIGOL, SZAMPION, JONATHAN, KOSZTELA,
        MALINOWKA, RENETA, ANANAS_BERENDA, PIROS, GLUCZÓWKA, KRÓLOWA_RENET, CORTLAND, MCINTOSH,
        BOSKOOP, ELSTAR, RUBIN, PAULARED, LOBO, PINOVA, TOPAZ, MODI, JAZZ, ENVY, KANZI, RUBYFROST,

        PRINCE, GLOSTER, MUTSU, ALWA, MELODIA, GALMAC, PAPIEROWKA, OLIWKA_ZOLTA, WITOSA, LINDA,
        RUBINOLA, RETINA, PRIMA, FREE_REDSTAR, DELBARESTIVALE, OTHER
    }

    public enum PearVariety {
        Konferencja, WILLIAMS, BOSC, CLAPPS_FAVORITE, ANJOU, COMICE, SANDRA, LUTY, KOSZTELA, SERENA,
        KARMEN, ALEXANDRIA, HOSUI, SECKEL, FLORIDA_PRINCESS, OTHER
    }

    public enum CherryVariety {
        BURLAT, STELLA, VAN, KORDIA, MORELLO, SKEENA, MERLYN, SUMMIT, LAPINS, SWEETHEART, OTHER
    }

    public enum SweetCherryVariety {
        SIMONA, WERA, STACATO, BING, RAINIER, BLACK_TARTARIAN, SUNBURST, FERROVIE, VAN, SWEET_HEART, LAPINS, KORDIA, MERLYN,
        OTHER
    }

    public enum PlumVariety {
        WĘGIERSKA, RENKLÓDA, ELENA, PRESIDENT, CECYLIA, ANGELINA, OPAL, HUNGARIAN, BLUEFRE, VIOLET,
        DAMSON, VICTORIA, MIRABELLE, SANTA_ROSA, OTHER
    }

    public enum RaspberryVariety {
        POLKA, GLEN_AMPLE, HERITAGE, AUTUMN_BLOSSOM, TULAMEEN, NOVA, LATHAM, MEGASPLASH, AUTUMN_GOLD,
        KILLARNY, POLANA, OTHER
    }
}