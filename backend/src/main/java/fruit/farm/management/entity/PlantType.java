package fruit.farm.management.entity;

public enum PlantType {
    APPLE(AppleVariety.class),
    PEAR(PearVariety.class),
    CHERRY(CherryVariety.class),
    PLUM(PlumVariety.class),
    RASPBERRY(RaspberryVariety.class),
    SWEET_CHERRY(SweetCherryVariety.class);

    private final Class<? extends Enum<?>> varietyClass;

    PlantType(Class<? extends Enum<?>> varietyClass) {
        this.varietyClass = varietyClass;
    }

    public enum AppleVariety {
        GOLDEN_DELICIOUS, RED_DELICIOUS, GALA, FUJI, PINK_LADY, BRAEBURN, JONAGOLD,
        GRANNY_SMITH, HONEYCRISP, AMBROSIA, CHAMPION, IDARED, LIGOL, SZAMPION, JONATHAN, KOSZTELA,
        MALINOWKA, RENETA, ANANAS_BERENDA, PIROS, GLUCZÓWKA, KRÓLOWA_RENET, CORTLAND, MCINTOSH,
        BOSKOOP, ELSTAR, RUBIN, PAULARED, LOBO, PINOVA, TOPAZ, MODI, JAZZ, ENVY, KANZI, RUBYFROST, OTHER
    }

    public enum PearVariety {
        CONFERENCE, WILLIAMS, BOSC, CLAPPS_FAVORITE, ANJOU, COMICE, SANDRA, LUTY, KOSZTELA, SERENA,
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
