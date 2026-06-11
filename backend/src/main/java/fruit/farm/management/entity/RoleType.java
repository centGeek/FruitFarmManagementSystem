package fruit.farm.management.entity;

public enum RoleType {

    ADMIN("Admin"),
    GARDENER("Gardener"),
    EMPLOYEE("Employee");

    private final String displayName;

    RoleType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
